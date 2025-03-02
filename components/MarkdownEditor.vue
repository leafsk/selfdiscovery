<template>
  <div class="markdown-editor">
    <editor-content :editor="editor" class="prose max-w-none" />
  </div>
</template>

<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { watchEffect, onBeforeUnmount, computed } from 'vue'

const props = defineProps<{
  modelValue: string
  editable?: boolean
  placeholder?: string
}>()

// Ensure modelValue is never undefined
const content = computed(() => {
  return props.modelValue || '';
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editor = new Editor({
  extensions: [
    StarterKit,
    Image,
    Link.configure({
      openOnClick: false
    })
  ],
  content: content.value,
  parseOptions: {
    preserveWhitespace: false
  },
  editable: props.editable !== false,
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
  editorProps: {
    attributes: {
      class: 'prose prose-sm dark:prose-invert max-w-none',
      'data-placeholder': props.placeholder || 'Start typing...'
    }
  }
})

// Initialize the editor with content

// Update editor content when modelValue changes - without comparing HTML
watchEffect(() => {
  if (editor && props.modelValue !== undefined) {
    // Only update the content when in view mode or when first loading content in edit mode
    // to avoid constant refresh loops
    if (!props.editable || editor.isEmpty) {
      editor.commands.setContent(content.value, false);
    }
  }
})

// Update editability
watchEffect(() => {
  if (props.editable !== undefined) {
    editor.setEditable(props.editable)
  }
})

// Clean up on component destroy
onBeforeUnmount(() => {
  editor.destroy()
})
</script>

<style scoped>
.markdown-editor {
  @apply rounded-md border border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-gray-800;
}

.markdown-editor :deep(.ProseMirror) {
  @apply min-h-[150px] outline-none dark:text-gray-200;
}

.markdown-editor :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  @apply text-gray-400 float-left h-0 pointer-events-none dark:text-gray-500;
  content: attr(data-placeholder);
}

/* Make sure heading tags have good contrast in dark mode */
.markdown-editor :deep(h1),
.markdown-editor :deep(h2),
.markdown-editor :deep(h3),
.markdown-editor :deep(h4),
.markdown-editor :deep(h5),
.markdown-editor :deep(h6) {
  @apply dark:text-white;
}

/* Ensure links are visible in dark mode */
.markdown-editor :deep(a) {
  @apply dark:text-blue-400;
}

/* Fix list item contrast */
.markdown-editor :deep(ul),
.markdown-editor :deep(ol) {
  @apply dark:text-gray-200;
}
</style>