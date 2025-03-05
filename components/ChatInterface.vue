<template>
  <div class="chat-interface">
    <div class="chat-header">
      <h3 class="chat-title">Guided Conversation</h3>
      
      <UDropdown :items="chatMenuItems">
        <UButton
          color="gray" 
          variant="ghost"
          icon="i-heroicons-ellipsis-vertical"
          size="sm"
        />
      </UDropdown>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <template v-if="messages.length === 0">
        <div class="chat-welcome">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white">Start a conversation</h2>
          <p class="text-gray-700 dark:text-gray-100 mt-2">
            Start a guided conversation to build your personal mission statement. Select a topic to explore:
          </p>
          <div class="conversation-starters mt-4 space-y-2">
            <UButton
              v-for="starter in conversationStarters"
              :key="starter"
              @click="sendMessage(starter)"
              variant="soft"
              color="primary"
              class="text-left w-full mb-2"
            >
              {{ starter }}
            </UButton>
          </div>
        </div>
      </template>
      
      <template v-else>
        <div 
          v-for="message in messages.filter(m => m.role !== 'system')" 
          :key="message.id" 
          class="chat-message" 
          :class="{
            'user-message': message.role === 'user',
            'assistant-message': message.role === 'assistant',
            'notification-message': message.role === 'notification'
          }"
        >
          <div class="message-content">
            <!-- Use plain text for user messages -->
            <template v-if="message.role === 'user'">
              {{ message.content }}
            </template>
            
            <!-- Use formatted markdown for assistant messages -->
            <div v-else-if="message.role === 'assistant'" 
              v-html="renderMarkdown(message.content)" 
              class="assistant-markdown prose dark:prose-invert"></div>
            
            <!-- Special styling for notification messages -->
            <div v-else-if="message.role === 'notification'"
              v-html="renderMarkdown(message.content)"
              class="notification-content prose dark:prose-invert"></div>
          </div>
          <div v-if="message.role !== 'notification'" class="message-timestamp text-xs text-gray-500">
            {{ formatTime(message.timestamp) }}
          </div>
        </div>
      </template>
      
      <div v-if="isLoading" class="loading-indicator">
        <UIcon name="i-heroicons-ellipsis-horizontal-circle" class="text-gray-400 animate-pulse" />
        <span class="ml-2 text-sm text-gray-500">Thinking...</span>
      </div>
      
      <!-- Show typing indicator message if loading and there's at least one message -->
      <div v-if="isLoading && messages.filter(m => m.role !== 'system').length > 0" 
        class="chat-message assistant-message typing-message">
        <div class="typing-animation">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
    
    <div class="chat-input-container">
      <UTextarea
        v-model="newMessage"
        :rows="2"
        autoresize
        placeholder="Type your message..."
        class="chat-input"
        @keydown.enter.prevent="sendMessage(newMessage); newMessage = ''"
      />
      <UButton
        @click="sendMessage(newMessage); newMessage = ''"
        :disabled="!newMessage.trim() || isLoading"
        color="primary"
        class="send-button"
        icon="i-heroicons-paper-airplane"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watchEffect } from 'vue';
import { useChatStore } from '~/stores/chat';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';

const chatStore = useChatStore();
const { messages, isLoading, error } = storeToRefs(chatStore);

const newMessage = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

const conversationStarters = [
  "What core values would I want to be remembered for?",
  "How might my unique experiences shape my life purpose?",
  "If I had unlimited resources, what would I create in the world?",
  "Which of my strengths have I not fully developed yet?",
  "How do my relationships reflect who I truly am?"
];

const chatMenuItems = [
  [
    {
      label: 'Start new conversation',
      icon: 'i-heroicons-plus-circle',
      click: () => startNewConversation()
    },
    {
      label: 'Clear current chat',
      icon: 'i-heroicons-trash',
      click: () => clearCurrentChat()
    }
  ]
];

function sendMessage(content: string) {
  if (!content.trim() || isLoading.value) return;
  
  chatStore.sendMessage(content);
  newMessage.value = '';
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function startNewConversation() {
  if (messages.value.length > 0) {
    // Show confirmation dialog
    if (confirm('Start a new conversation? This will clear the current chat.')) {
      chatStore.clearMessages();
    }
  }
}

function clearCurrentChat() {
  if (messages.value.length > 0) {
    if (confirm('Are you sure you want to clear the current conversation?')) {
      chatStore.clearMessages();
    }
  }
}


// Function to convert markdown to HTML using TipTap
const markdownToHtmlEditor = new Editor({
  extensions: [
    StarterKit,
    Markdown.configure({
      html: false,
      tightLists: true,
      tightListClass: 'tight',
      bulletListMarker: '-',
      linkify: true,
      breaks: true,
    })
  ],
  editable: false
});

function renderMarkdown(text: string) {
  if (!text) return '';
  
  // Remove JSON-like code blocks that might contain metadata
  const cleanedText = text.replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/g, '<em>[JSON data hidden]</em>')
                          .replace(/```(?:json)?\s*\[[\s\S]*?\]\s*```/g, '<em>[JSON data hidden]</em>')
                          // Replace inline JSON with indicators
                          .replace(/`\{[\s\S]*?\}`/g, '<em>[JSON data hidden]</em>')
                          .replace(/`\[[\s\S]*?\]`/g, '<em>[JSON data hidden]</em>');
  
  // Set the markdown content to the editor with JSON code blocks removed
  markdownToHtmlEditor.commands.setContent(cleanedText);
  
  // Return the editor's HTML content
  return markdownToHtmlEditor.getHTML();
}

// Scroll to bottom when new messages arrive
watchEffect(() => {
  if (messages.value.length) {
    setTimeout(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    }, 50);
  }
});

onMounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
});
</script>

<style scoped>
.chat-interface {
  @apply flex flex-col h-full;
}

.chat-header {
  @apply flex items-center justify-between p-3 border-b;
}

.chat-title {
  @apply text-lg font-medium text-gray-800 dark:text-gray-200;
}

.chat-messages {
  @apply flex-1 overflow-y-auto p-4 space-y-4;
}

.chat-message {
  @apply p-3 rounded-lg max-w-[85%];
}

.user-message {
  @apply bg-primary-100 text-primary-950 ml-auto dark:bg-primary-800 dark:text-primary-50;
}

.assistant-message {
  @apply bg-gray-100 text-gray-900 mr-auto dark:bg-gray-800 dark:text-gray-100;
}

.notification-message {
  @apply bg-blue-50 text-blue-900 w-full max-w-full text-center mx-auto py-2 px-3 
         dark:bg-blue-900/30 dark:text-blue-200 border border-blue-100 dark:border-blue-800;
}

.message-content {
  @apply whitespace-pre-wrap;
}

/* Custom styling for assistant markdown editor */
.assistant-markdown {
  @apply p-0 shadow-none mt-0;
}

/* Ensure proper spacing in markdown lists */
/* Fixed list styling with no paragraph margin issues */
.assistant-message .assistant-markdown ul,
.assistant-message .assistant-markdown ol {
  @apply pl-5 my-2 list-outside; 
}

.assistant-message .assistant-markdown li {
  @apply mb-1;
}

/* Improved list bullets/numbers alignment */
.assistant-message .assistant-markdown ul {
  @apply list-disc;
}

.assistant-message .assistant-markdown ol {
  @apply list-decimal;
}

/* Add the tight class styles to remove paragraph margins in lists */
.assistant-message .assistant-markdown ul.tight li > p,
.assistant-message .assistant-markdown ol.tight li > p {
  @apply my-0;
}

/* Headings in messages - smaller sizes */
.assistant-message .assistant-markdown h1 {
  @apply text-lg font-bold mt-3 mb-1;
}

.assistant-message .assistant-markdown h2 {
  @apply text-base font-bold mt-2 mb-1;
}

.assistant-message .assistant-markdown h3 {
  @apply text-sm font-bold mt-2 mb-1;
}

/* Remove margins from first and last elements */
.assistant-message .assistant-markdown > *:first-child,
.notification-message .notification-content > *:first-child {
  @apply mt-0;
}

.assistant-message .assistant-markdown > *:last-child,
.notification-message .notification-content > *:last-child {
  @apply mb-0;
}

/* Notification content styling */
.notification-content {
  @apply text-sm font-medium;
}

/* Style code blocks */
.assistant-message .assistant-markdown pre {
  @apply bg-gray-200 dark:bg-gray-700 p-2 rounded my-2 overflow-auto text-sm;
}

/* Style inline code */
.assistant-message .assistant-markdown code {
  @apply bg-gray-200 dark:bg-gray-700 px-1 rounded text-sm font-mono;
}

/* Style links */
.assistant-message .assistant-markdown a {
  @apply text-blue-600 dark:text-blue-400 hover:underline;
}

.chat-input-container {
  @apply p-4 border-t flex items-end gap-2;
}

.chat-input {
  @apply flex-1;
}

.chat-welcome {
  @apply p-6 bg-gray-50 dark:bg-gray-800 rounded-lg;
}

.loading-indicator {
  @apply flex items-center p-2;
}

.typing-message {
  @apply py-4 px-5;
}

.typing-animation {
  @apply flex space-x-1;
}

.typing-animation span {
  @apply bg-gray-400 dark:bg-gray-300 rounded-full h-2 w-2 animate-bounce;
}

.typing-animation span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-animation span:nth-child(3) {
  animation-delay: 0.4s;
}
</style>