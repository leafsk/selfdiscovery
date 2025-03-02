import { getServerSession } from '#auth';
import { documentOperations } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    });
  }

  const { chapter, content } = await readBody(event);
  
  if (!chapter || !content) {
    throw createError({
      statusCode: 400,
      message: 'Chapter and content are required'
    });
  }

  const userId = session.user.id;
  
  // Get the current document
  const existingDoc = documentOperations.getByUserId.get(userId);
  
  if (existingDoc) {
    // Parse the existing content
    let documentContent;
    try {
      documentContent = JSON.parse(existingDoc.content);
      console.log('Successfully parsed existing document content:', documentContent);
    } catch (e) {
      console.error('Error parsing existing document content:', e);
      console.log('Raw document content:', existingDoc.content);
      documentContent = {};
    }
    
    // Always replace the chapter content completely
    documentContent[chapter] = content;
    console.log(`Setting content for chapter "${chapter}"`)
    
    // Save the updated document
    documentOperations.update.run(JSON.stringify(documentContent), existingDoc.id);
    
    return {
      success: true,
      message: 'Document updated successfully',
      updatedAt: new Date().toISOString()
    };
  } else {
    // Create a new document with this chapter
    const newContent = { [chapter]: content };
    const result = documentOperations.create.run(userId, JSON.stringify(newContent));
    
    return {
      success: true,
      message: 'Document created successfully',
      updatedAt: new Date().toISOString()
    };
  }
});