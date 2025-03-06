import { getServerSession } from '#auth';
import { documentOperations, userOperations, setD1Database } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  // For Cloudflare D1 binding
  if (event.context.cloudflare?.env?.DB) {
    setD1Database(event.context.cloudflare.env.DB);
  }

  const session = await getServerSession(event);
  if (!session) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    });
  }
  
  const userId = session.user.id;
  
  // Ensure the user exists in our database
  const existingUser = await userOperations.findById.get(userId);
  if (!existingUser) {
    await userOperations.createUser.run(userId, session.user.email, session.user.name || null);
  }
  
  // Get the user's document from the database
  const document = await documentOperations.getByUserId.get(userId);
  
  if (document) {
    let content;
    try {
      // Try to parse the content as JSON
      content = JSON.parse(document.content);
      console.log('Successfully parsed document content:', content);
    } catch (e) {
      console.error('Error parsing document content:', e);
      console.log('Raw document content:', document.content);
      
      // If parsing fails, provide a default structure
      content = {
        "Who Am I?": "I'm just starting to explore who I am...",
        "My Values": "These are the principles that guide my life...",
        "My Present": "Currently, I am...",
        "My Future": "I aspire to..."
      };
      
      // Update the document with the proper JSON structure
      await documentOperations.update.run(JSON.stringify(content), document.id);
      console.log('Created default document structure');
    }
    
    return {
      userId,
      content,
      updatedAt: document.updated_at
    };
  } else {
    // Create a default document if none exists
    const defaultContent = {
      "Who Am I?": "I'm just starting to explore who I am...",
      "My Values": "These are the principles that guide my life...",
      "My Present": "Currently, I am...",
      "My Future": "I aspire to..."
    };
    
    const jsonContent = JSON.stringify(defaultContent);
    const result = await documentOperations.create.run(userId, jsonContent);
    
    return {
      userId,
      content: defaultContent,
      updatedAt: new Date().toISOString()
    };
  }
});