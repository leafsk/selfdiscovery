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
        <p class="text-gray-600">
          Your personal mission statement will appear here as you chat with the AI.
        </p>
        <p class="text-gray-500 mt-2">
          Try asking about your values, purpose, or goals to get started.
        </p>
      </div>
      
      <div v-else class="document-content">
        <div v-for="chapter in chapters" :key="chapter" class="document-chapter">
          <h2 class="chapter-title">{{ chapter }}</h2>
          <MarkdownEditor
            v-model="chapterContent[chapter]" 
            :editable="editMode === chapter"
            :placeholder="editMode === chapter ? 'Enter content...' : 'No content yet. Click Edit to add content.'"
            class="chapter-content"
          />
          <div class="chapter-actions">
            <UButton 
              v-if="editMode !== chapter" 
              @click="startEditing(chapter)" 
              size="sm" 
              variant="ghost" 
              color="gray"
              icon="i-heroicons-pencil-square"
            >
              Edit
            </UButton>
            <template v-else>
              <UButton 
                @click="saveChapter(chapter)" 
                size="sm" 
                variant="solid" 
                color="primary"
                icon="i-heroicons-check"
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
              >
                Cancel
              </UButton>
            </template>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDocumentStore } from '~/stores/document';

const documentStore = useDocumentStore();
const { content, isLoading, error, formattedLastUpdated } = storeToRefs(documentStore);

const editMode = ref<string | null>(null);
const chapterContent = ref<Record<string, string>>({});

// Local computed properties
const chapters = computed(() => Object.keys(content.value));
const hasChapters = computed(() => chapters.value.length > 0);
const lastUpdated = computed(() => formattedLastUpdated.value);

// Initialize the document
onMounted(async () => {
  await fetchDocument();
});

async function fetchDocument() {
  await documentStore.fetchDocument();
  
  // Copy the content to local state for editing
  chapterContent.value = { ...content.value };
  
  // Validate content
  if (Object.keys(content.value).length === 0) {
    console.warn('No chapters found in document');
  }
}

function refreshDocument() {
  fetchDocument();
}


function startEditing(chapter: string) {
  editMode.value = chapter;
}

function cancelEditing() {
  // Reset to original content
  chapterContent.value = { ...content.value };
  editMode.value = null;
}

async function saveChapter(chapter: string) {
  if (editMode.value === chapter) {
    // Make sure we're not saving empty content
    const contentToSave = chapterContent.value[chapter]?.trim() || 
      `This chapter needs content. Add your thoughts about "${chapter}" here.`;
      
    await documentStore.updateChapter(chapter, contentToSave);
    editMode.value = null;
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
  @apply space-y-8;
}

.document-chapter {
  @apply bg-white rounded-lg shadow-sm p-6 dark:bg-gray-800;
}

.chapter-title {
  @apply text-xl font-semibold text-gray-800 mb-4 dark:text-gray-200;
}

.chapter-content {
  @apply mb-4;
}

.chapter-preview {
  @apply mb-4 prose prose-lg dark:prose-invert max-w-none;
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