import { Anthropic } from '@anthropic-ai/sdk';
import { getServerSession } from '#auth';

export default defineEventHandler(async (event) => {
  // Get user session
  const session = await getServerSession(event);
  if (!session) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    });
  }

  // Get query parameters
  const query = getQuery(event);
  const message = query.message as string;
  const document = query.document as string;
  
  if (!message) {
    throw createError({
      statusCode: 400,
      message: 'Message is required'
    });
  }

  const config = useRuntimeConfig();
  const anthropic = new Anthropic({
    apiKey: config.anthropicApiKey
  });

  try {
    // Set up streaming response
    setResponseHeader(event, 'Content-Type', 'text/event-stream');
    setResponseHeader(event, 'Cache-Control', 'no-cache');
    setResponseHeader(event, 'Connection', 'keep-alive');
    
    let fullResponse = '';
    let documentUpdates = null;
    
    // Create a writable stream to handle the streaming response
    const stream = anthropic.messages.stream({
      model: 'claude-3-7-sonnet-latest',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `I'm working on my personal mission statement. Here's my current document: 
          
${document || "I'm just getting started with my personal mission statement."}

My question/thoughts: ${message}

Please help me explore this further and suggest updates to my mission statement document.`
        }
      ],
      system: `You are a concise guide for self-discovery, helping the user develop their personal mission statement document.
      
Your goal is to help the user gain insight through focused conversation. Be brief and direct.

Guide the conversation with these principles:
1. Ask ONE clear question at a time - never multiple questions in the same message
2. Keep responses under 3-4 sentences when possible
3. Listen attentively to their answers before moving to the next question
4. Summarize insights briefly before suggesting document updates
      
At the end of every response, include this exact JSON format for document updates:
\`\`\`json
{
  "documentUpdates": {
    "chapter": "Title of chapter to update",
    "content": "Content for this chapter (can be new or additions to existing content)"
  }
}
\`\`\`

IMPORTANT: Always include this JSON block with valid values for both 'chapter' and 'content'.

Suggested chapters include: "Who Am I?", "My Values", "My Present", "My Future", "My Purpose", but the user can create any chapters they want.`
    });
    
    // Process the stream and send chunks to the client
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.text) {
        const text = chunk.delta.text;
        fullResponse += text;
        
        // Send each chunk to the client
        event.node.res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
      }
    }
    
    // Process the complete response for document updates
    const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        documentUpdates = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error('Failed to parse JSON from AI response', e);
      }
    }
    
    // Send the final message with document updates
    event.node.res.write(`data: ${JSON.stringify({ 
      done: true,
      message: fullResponse.replace(/```json\s*[\s\S]*?\s*```/g, '').trim(),
      documentUpdates
    })}\n\n`);
    
    event.node.res.end();
    
    // Return nothing as we've manually handled the response
    return;
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to process your message'
    });
  }
});