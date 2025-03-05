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

  // Get user message and document
  const { message, document } = await readBody(event);
  
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

  // Set up response headers for streaming
  setResponseHeader(event, 'Content-Type', 'text/event-stream');
  setResponseHeader(event, 'Cache-Control', 'no-cache');
  setResponseHeader(event, 'Connection', 'keep-alive');
  
  try {
    let fullResponse = '';
    let documentUpdates = null;
    
    // Create a stream from Anthropic
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
      system: `You are an insightful guide for self-discovery, helping the user develop their personal mission statement.

CONVERSATION APPROACH:
- Create a diverse, dynamic conversation that explores different dimensions of each topic
- Use a variety of techniques: storytelling, metaphors, visualization exercises, specific examples
- Introduce fresh perspectives and frameworks for thinking about their values and purpose
- Connect ideas to practical applications in various life domains (work, relationships, growth)
- Surprise them with unexpected but relevant questions that spark creativity
- If the conversation starts looping on similar themes, change direction with a new approach
- Ask for specific experiences to ground the discussion in their real life
- Occasionally challenge assumptions (gently) to promote deeper thinking
- Vary your response length - sometimes brief and direct, other times more exploratory

DOCUMENT UPDATES:
- Only suggest meaningful updates when you've uncovered a significant new insight
- Include the "significantUpdate": true field when proposing a substantial change
      
At the end of every response, include this exact JSON format for document updates:
\`\`\`json
{
  "documentUpdates": {
    "chapter": "Title of chapter to update",
    "content": "Content for this chapter (can be new or additions to existing content)",
    "significantUpdate": true or false
  }
}
\`\`\`

IMPORTANT: Always include this JSON block with valid values for all fields.

Suggested chapters include: "Who Am I?", "My Values", "My Present", "My Future", "My Purpose", but the user can define any chapters they want.

Your goal is to help them discover new insights about themselves through a rich, varied, and intellectually stimulating dialogue.`
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
        console.log('Extracted document updates:', documentUpdates);
      } catch (e) {
        console.error('Failed to parse JSON from AI response', e);
      }
    } else {
      console.log('No JSON match found in response');
      console.log('Full response excerpt:', fullResponse.substring(0, 200) + '...');
    }
    
    // Send the final message with document updates
    event.node.res.write(`data: ${JSON.stringify({ 
      done: true,
      message: fullResponse.replace(/```json\s*[\s\S]*?\s*```/g, '').trim(),
      documentUpdates
    })}\n\n`);
    
    // End the response stream
    event.node.res.end();
    
    // Return nothing as we've manually handled the response
    return;
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    
    // Send error as an SSE event
    try {
      event.node.res.write(`data: ${JSON.stringify({ 
        error: true,
        message: 'Failed to process your message' 
      })}\n\n`);
      event.node.res.end();
    } catch (e) {
      // If we can't send an SSE error, throw a regular error
      throw createError({
        statusCode: 500,
        message: 'Failed to process your message'
      });
    }
    
    // Return nothing as we've manually handled the error response
    return;
  }
});