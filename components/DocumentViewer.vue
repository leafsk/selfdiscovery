<template>
  <div class="document-viewer">
    <div class="document-actions">
      <UButton 
        @click="refreshDocument" 
        size="sm" 
        color="gray" 
        variant="ghost"
        icon="i-heroicons-arrow-path"
        :loading="isLoading"
      >
        Refresh
      </UButton>
    </div>
  
    <div v-if="isLoading" class="loading">
      <UIcon name="i-heroicons-document-text" class="text-primary-500 animate-pulse h-12 w-12" />
      <span class="mt-2">Loading your mission statement...</span>
    </div>
    
    <div v-else-if="error" class="error-state">
      <UIcon name="i-heroicons-exclamation-circle" class="text-red-500 h-12 w-12" />
      <p class="mt-2 text-red-600">{{ error }}</p>
      <UButton class="mt-4" @click="fetchDocument" variant="soft" color="primary">Try Again</UButton>
    </div>
    
    <template v-else>
      <div class="document-header">
        <h1 class="document-title">My Mission Statement</h1>
        <p v-if="lastUpdated" class="document-meta">
          Last updated: {{ lastUpdated }}
        </p>
      </div>
      
      <div v-if="!hasChapters" class="empty-state">
        <UIcon name="i-heroicons-document-text" class="text-gray-400 h-12 w-12 mb-4" />
        <p class="text-gray-600">
          Your personal mission statement will appear here as you chat with the AI.
        </p>
        <p class="text-gray-500 mt-2">
          Try asking about your values, purpose, or goals to get started.
        </p>
      </div>
      
      <div v-else class="document-content">
        <UCard v-for="chapter in sortedChapters" 
          :key="chapter" 
          class="document-chapter mb-6"
          :ui="{ 
            base: 'transition-all',
            body: { padding: 'p-6' },
            header: { padding: 'px-6 pt-6 pb-0' }
          }"
        >
          <template #header>
            <div class="chapter-header">
              <h2 class="chapter-title">{{ chapter }}</h2>
              <UBadge v-if="isEditing(chapter)" color="primary" variant="soft">Editing</UBadge>
            </div>
          </template>
          
          <MarkdownEditor
            :modelValue="getChapterDisplayContent(chapter)"
            @update:modelValue="updateChapterContent(chapter, $event)"
            :editable="isEditing(chapter)"
            :placeholder="isEditing(chapter) ? 'Enter content...' : 'No content yet. Click Edit to add content.'"
            class="chapter-content"
          />
          
          <template #footer>
            <div class="chapter-actions">
              <div v-if="!isEditing(chapter)" class="flex justify-between w-full">
                <UButton 
                  @click="startChatAbout(chapter)"
                  size="sm"
                  variant="soft"
                  color="primary"
                  icon="i-heroicons-chat-bubble-left-text"
                >
                  Chat about {{ getChapterShortName(chapter) }}
                </UButton>
                <UButton 
                  @click="startEditing(chapter)" 
                  size="sm" 
                  variant="ghost" 
                  color="gray"
                  icon="i-heroicons-pencil-square"
                >
                  Edit
                </UButton>
              </div>
              <div v-else class="flex justify-end w-full">
                <UButton 
                  @click="saveChapter(chapter)" 
                  size="sm" 
                  variant="solid" 
                  color="primary"
                  icon="i-heroicons-check"
                  :loading="isSaving"
                >
                  Save
                </UButton>
                <UButton 
                  @click="cancelEditing()" 
                  size="sm" 
                  variant="ghost" 
                  color="gray"
                  icon="i-heroicons-x-mark"
                  class="ml-2"
                  :disabled="isSaving"
                >
                  Cancel
                </UButton>
              </div>
            </div>
          </template>
        </UCard>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, inject } from 'vue';
import { useDocumentStore } from '~/stores/document';
import { useChatStore } from '~/stores/chat';

const documentStore = useDocumentStore();
const { content, isLoading, error, formattedLastUpdated } = storeToRefs(documentStore);

const editMode = ref<string | null>(null);
const chapterContent = ref<Record<string, string>>({});
const isSaving = ref(false);

// Define chapter order for display
const chapterOrder = [
  "Who Am I?",
  "My Values",
  "My Present",
  "My Future"
];

// Clean content by removing any JSON at the end
function cleanChapterContent(text: string): string {
  if (!text) return '';
  
  // We'll use multiple approaches to detect JSON
  
  // 1. Look for a clear JSON block at the end of the text
  const jsonBlockRegex = /(\s*\{[\s\S]*\})\s*$/;
  const jsonBlockMatch = text.match(jsonBlockRegex);
  
  if (jsonBlockMatch) {
    const [fullMatch, jsonCandidate] = jsonBlockMatch;
    const startIndex = text.lastIndexOf(jsonCandidate);
    
    // Try to parse the candidate as JSON
    try {
      JSON.parse(jsonCandidate);
      // If valid JSON, return text without it
      return text.substring(0, startIndex).trim();
    } catch {
      // Not valid JSON, continue to other checks
    }
  }
  
  // 2. Try to find just a JSON opening brace and everything after it
  const jsonStartRegex = /\s*(\{[\s\S]*$)/;
  const possibleJsonStart = text.match(jsonStartRegex);
  
  if (possibleJsonStart) {
    const [fullMatch, braceContent] = possibleJsonStart;
    const startIndex = text.lastIndexOf(braceContent);
    
    // Verify if it's valid JSON
    try {
      JSON.parse(braceContent);
      // If we can parse it as JSON, return only the content before it
      return text.substring(0, startIndex).trim();
    } catch {
      // Not valid JSON, continue
    }
  }
  
  // 3. Look for array-style JSON
  const arrayStartRegex = /\s*(\[[\s\S]*$)/;
  const possibleArrayStart = text.match(arrayStartRegex);
  
  if (possibleArrayStart) {
    const [fullMatch, arrayContent] = possibleArrayStart;
    const startIndex = text.lastIndexOf(arrayContent);
    
    try {
      JSON.parse(arrayContent);
      return text.substring(0, startIndex).trim();
    } catch {
      // Not valid JSON
    }
  }
  
  return text;
}

// Local computed properties
const chapters = computed(() => Object.keys(content.value));
const hasChapters = computed(() => chapters.value.length > 0);
const lastUpdated = computed(() => formattedLastUpdated.value);

// Tabs reference for switching between tabs
const tabs = inject('tabs', ref(null));

// Clean chapter content for display
const cleanedContent = computed(() => {
  const cleaned: Record<string, string> = {};
  Object.entries(chapterContent.value).forEach(([key, value]) => {
    cleaned[key] = cleanChapterContent(value);
  });
  return cleaned;
});

// Sort chapters based on predefined order
const sortedChapters = computed(() => {
  const knownChapters = chapters.value.filter(c => chapterOrder.includes(c))
    .sort((a, b) => chapterOrder.indexOf(a) - chapterOrder.indexOf(b));
  
  const unknownChapters = chapters.value.filter(c => !chapterOrder.includes(c))
    .sort();
  
  return [...knownChapters, ...unknownChapters];
});

// Function to check if a chapter is being edited
function isEditing(chapter: string): boolean {
  return editMode.value === chapter;
}

// Get the appropriate content to display for a chapter (clean in view mode, original in edit mode)
function getChapterDisplayContent(chapter: string): string {
  // When in edit mode, show the complete content (including JSON)
  // When in view mode, show the cleaned content (without JSON)
  if (isEditing(chapter)) {
    return chapterContent.value[chapter] || '';
  } else {
    return cleanedContent.value[chapter] || '';
  }
}

// Update chapter content on edit - preserves any JSON data that might be at the end
function updateChapterContent(chapter: string, newContent: string): void {
  // Store the edited content
  chapterContent.value[chapter] = newContent;
}

// Get a shorter version of the chapter name for the button
function getChapterShortName(chapter: string): string {
  // Remove "My" prefix if it exists
  if (chapter.startsWith("My ")) {
    return chapter.substring(3);
  }
  
  // For "Who Am I?", return just "Identity"
  if (chapter === "Who Am I?") {
    return "Identity";
  }
  
  // For other cases, return the original or shorten if too long
  return chapter.length > 10 ? chapter.substring(0, 8) + "..." : chapter;
}

// Start a chat about a specific chapter
function startChatAbout(chapter: string) {
  const chatStore = useChatStore();
  
  // Clear existing messages
  chatStore.clearMessages();
  
  // Get the chapter content (cleaned version)
  const chapterContent = cleanedContent.value[chapter] || '';
  
  // First add a system message (invisible to user) with enhanced conversation guidance
  chatStore.sendSystemMessage(`The user is exploring their "${chapter}" chapter in their personal mission statement. Here's what they've written so far: "${chapterContent}".

CONVERSATION APPROACH:
- Create a diverse, dynamic conversation that explores different dimensions of the topic
- Use a variety of techniques: storytelling, metaphors, visualization exercises, reflective prompts
- Introduce new perspectives and frameworks for thinking about their ${chapter}
- Connect ideas to practical applications in various life domains (work, relationships, personal growth)
- Surprise them with unexpected but relevant questions that spark creativity
- Offer concrete examples and models from diverse sources
- Shift between abstract/philosophical and practical/tactical levels
- If you notice the conversation becoming repetitive, change direction with a bold new approach
- Ask for specific examples and experiences to ground the discussion
- Occasionally challenge assumptions (gently) to promote deeper thinking

Your goal is to help them discover new insights about themselves through a rich, varied, and intellectually stimulating dialogue.`);
  
  // Add a user message that will be displayed first (as if the user asked to dive deeper)
  const chapterName = getChapterShortName(chapter).toLowerCase();
  const userMessage = `I'd like to dive deeper into my ${chapterName} and understand it better`;
  chatStore.addUserMessage(userMessage);
  
  // Now send the actual message to the AI to get a response without adding another user message
  chatStore.sendMessage(userMessage, false);
  
  // Switch to the chat tab (which is at index 1)
  if (tabs.value !== undefined) {
    tabs.value = 1; // Set to chat tab (index 1)
  }
}

// Initialize the document
onMounted(async () => {
  await fetchDocument();
});

// Watch for changes in the store content
watch(content, (newContent) => {
  if (newContent && Object.keys(newContent).length > 0) {
    // Update local content when store content changes (like after refresh)
    // Preserve the complete content, including any JSON
    const updatedContent: Record<string, string> = {};
    Object.entries(newContent).forEach(([key, value]) => {
      updatedContent[key] = value;
    });
    
    chapterContent.value = updatedContent;
  }
}, { deep: true });

async function fetchDocument() {
  await documentStore.fetchDocument();
  
  // Copy the content to local state for editing
  // For each chapter, store the original content as is (with potential JSON data)
  const updatedContent: Record<string, string> = {};
  Object.entries(content.value).forEach(([key, value]) => {
    updatedContent[key] = value;
  });
  
  chapterContent.value = updatedContent;
  
  // Validate content
  if (Object.keys(content.value).length === 0) {
    console.warn('No chapters found in document');
  }
}

function refreshDocument() {
  fetchDocument();
}

function startEditing(chapter: string) {
  // Close any other open edit sessions first
  if (editMode.value && editMode.value !== chapter) {
    cancelEditing();
  }
  editMode.value = chapter;
}

function cancelEditing() {
  // Reset to original content with any JSON data preserved
  if (editMode.value) {
    // Make sure we restore the full original content including any JSON data
    chapterContent.value[editMode.value] = content.value[editMode.value] || '';
  }
  editMode.value = null;
}

async function saveChapter(chapter: string) {
  if (editMode.value === chapter) {
    isSaving.value = true;
    try {
      // Get current content (what the user has edited)
      const currentContent = chapterContent.value[chapter]?.trim() || 
        `This chapter needs content. Add your thoughts about "${chapter}" here.`;
      
      // Check if there was JSON data in the original content
      let contentToSave = currentContent;
      const originalContent = content.value[chapter] || '';
      
      // Extract JSON data from original content using the same methods as cleanChapterContent
      // First try to find a complete JSON object
      const jsonBlockRegex = /(\s*\{[\s\S]*\})\s*$/;
      const jsonBlockMatch = originalContent.match(jsonBlockRegex);
      
      if (jsonBlockMatch) {
        const [fullMatch, jsonCandidate] = jsonBlockMatch;
        try {
          // Verify it's valid JSON
          JSON.parse(jsonCandidate);
          // If valid, preserve the JSON data by appending it to the edited content
          contentToSave = `${currentContent}\n${jsonCandidate}`;
        } catch {
          // Try other JSON extraction methods
        }
      } else {
        // Try to find just a JSON start
        const jsonStartRegex = /\s*(\{[\s\S]*$)/;
        const possibleJsonStart = originalContent.match(jsonStartRegex);
        
        if (possibleJsonStart) {
          const [fullMatch, braceContent] = possibleJsonStart;
          try {
            // Verify it's valid JSON
            JSON.parse(braceContent);
            // If valid, preserve the JSON by appending it
            contentToSave = `${currentContent}\n${braceContent}`;
          } catch {
            // Try looking for array-style JSON
            const arrayStartRegex = /\s*(\[[\s\S]*$)/;
            const possibleArrayStart = originalContent.match(arrayStartRegex);
            
            if (possibleArrayStart) {
              const [fullMatch, arrayContent] = possibleArrayStart;
              try {
                JSON.parse(arrayContent);
                contentToSave = `${currentContent}\n${arrayContent}`;
              } catch {
                // Not valid JSON, use the edited content as is
              }
            }
          }
        }
      }
      
      await documentStore.updateChapter(chapter, contentToSave);
      editMode.value = null;
    } catch (error) {
      console.error('Error saving chapter:', error);
    } finally {
      isSaving.value = false;
    }
  }
}
</script>

<style scoped>
.document-viewer {
  @apply max-w-3xl mx-auto p-4;
}

.document-actions {
  @apply flex justify-end mb-4;
}

.document-header {
  @apply mb-8 text-center;
}

.document-title {
  @apply text-2xl font-bold text-gray-800 dark:text-gray-100;
}

.document-meta {
  @apply text-sm text-gray-600 mt-2 dark:text-gray-400;
}

.document-content {
  @apply space-y-4;
}

.document-chapter {
  @apply transition-all hover:shadow-md dark:hover:shadow-gray-700/30;
}

.chapter-header {
  @apply flex items-center justify-between;
}

.chapter-title {
  @apply text-xl font-semibold text-gray-800 mb-4 dark:text-gray-200;
}

.chapter-content {
  @apply mb-4;
}

.chapter-actions {
  @apply flex justify-end;
}

.loading, .error-state, .empty-state {
  @apply flex flex-col items-center justify-center py-12 text-gray-600 dark:text-gray-400;
}

.error-state {
  @apply text-red-600 dark:text-red-400;
}

.empty-state {
  @apply bg-white rounded-lg shadow-sm p-8 text-center dark:bg-gray-800;
}
</style>