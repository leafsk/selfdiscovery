import { defineStore } from 'pinia';
import { useDocumentStore } from './document';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system' | 'notification';
  timestamp: string;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    messages: [],
    isLoading: false,
    error: null
  }),
  
  actions: {
    addUserMessage(content: string) {
      this.messages.push({
        id: crypto.randomUUID(),
        content,
        role: 'user',
        timestamp: new Date().toISOString()
      });
    },
    
    addAssistantMessage(content: string) {
      this.messages.push({
        id: crypto.randomUUID(),
        content,
        role: 'assistant',
        timestamp: new Date().toISOString()
      });
    },
    
    async sendMessage(content: string, addUserMessage = true) {
      // Add the user message to the chat only if requested
      if (addUserMessage) {
        this.addUserMessage(content);
      }
      this.isLoading = true;
      this.error = null;
      
      const documentStore = useDocumentStore();
      
      try {
        // Serialize the document content
        const documentContent = Object.entries(documentStore.content)
          .map(([chapter, content]) => `## ${chapter}\n\n${content}`)
          .join('\n\n');
        
        // Create a temporary message for streaming
        const streamingMessageId = crypto.randomUUID();
        this.messages.push({
          id: streamingMessageId,
          content: '',
          role: 'assistant',
          timestamp: new Date().toISOString()
        });
        
        // Use POST method instead of EventSource
        const assistantMessageId = streamingMessageId;
        let fullMessage = '';

        // Make a fetch request to the streaming endpoint
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            document: documentContent
          })
        });

        // Check if we got a valid response
        if (!response.ok) {
          throw new Error('Failed to get response from server');
        }

        // Create a reader for the response body
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to create reader');
        }

        // Read the stream
        const decoder = new TextDecoder();
        let done = false;

        while (!done) {
          const { done: streamDone, value } = await reader.read();
          
          if (streamDone) {
            done = true;
            continue;
          }

          // Decode and process the chunk
          const chunk = decoder.decode(value, { stream: true });
          
          // Handle SSE format - each line starts with "data: "
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(5));
                
                if (data.chunk) {
                  // Append to the streaming message
                  fullMessage += data.chunk;
                  
                  // Update the message in place
                  const messageIndex = this.messages.findIndex(m => m.id === assistantMessageId);
                  if (messageIndex !== -1) {
                    this.messages[messageIndex].content = fullMessage;
                  }
                }
                
                if (data.done) {
                  // Final message with document updates
                  const messageIndex = this.messages.findIndex(m => m.id === assistantMessageId);
                  if (messageIndex !== -1) {
                    this.messages[messageIndex].content = data.message;
                  }
                  
                  // Check if there are document updates
                  console.log('Document updates data:', data.documentUpdates);
                  
                  // Handle different possible structures
                  let updateData = null;
                  
                  // Case 1: { documentUpdates: { chapter, content } }
                  if (data.documentUpdates?.documentUpdates) {
                    updateData = data.documentUpdates.documentUpdates;
                  } 
                  // Case 2: { documentUpdates: { chapter, content } }
                  else if (data.documentUpdates?.chapter && data.documentUpdates?.content) {
                    updateData = data.documentUpdates;
                  }
                  
                  if (updateData) {
                    const { chapter, content, significantUpdate } = updateData;
                    
                    if (chapter && content) {
                      console.log('Potential document update for chapter:', chapter);
                      
                      // Only update if it's marked as significant or has substantially more content
                      const existingContent = documentStore.content[chapter] || '';
                      const contentDifference = content.length - existingContent.length;
                      const isSignificantChange = significantUpdate === true || 
                                                 contentDifference > 50;
                      
                      if (isSignificantChange) {
                        console.log('Updating document - significant change detected');
                        console.log('Content difference:', contentDifference);
                        
                        // Update the document with the AI's suggestions
                        documentStore.updateChapter(chapter, content);
                        
                        // Add a notification message about the update
                        const updateNotification = `*Your "${chapter}" chapter has been updated with new insights from this conversation.*`;
                        this.addSystemNotification(updateNotification);
                      } else {
                        console.log('Skipping document update - not a significant change');
                      }
                    } else {
                      console.warn('Missing chapter or content in extracted update data');
                    }
                  } else {
                    console.warn('No valid document update data found');
                  }
                  
                  done = true;
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }

        this.isLoading = false;
      } catch (e) {
        this.error = 'Failed to send message';
        console.error('Error sending message:', e);
        this.isLoading = false;
      }
    },
    
    clearMessages() {
      this.messages = [];
    },
    
    sendSystemMessage(content: string) {
      // System messages are not displayed to the user but are included in the API call
      this.messages.push({
        id: crypto.randomUUID(),
        content,
        role: 'system',
        timestamp: new Date().toISOString()
      });
    },
    
    sendAssistantMessage(content: string) {
      // Directly add an assistant message without making an API call
      this.addAssistantMessage(content);
    },
    
    addSystemNotification(content: string) {
      // Add a notification message that will be visible to the user
      // but styled differently from normal messages
      this.messages.push({
        id: crypto.randomUUID(),
        content,
        role: 'notification',
        timestamp: new Date().toISOString()
      });
    }
  }
});