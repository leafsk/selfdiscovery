<template>
  <div class="app-container" :class="{ 'dark': isDarkMode }">
    <div class="theme-content">
      <div class="theme-toggle">
        <UButton 
          @click="toggleDarkMode" 
          :icon="isDarkMode ? 'i-heroicons-sun' : 'i-heroicons-moon'" 
          variant="ghost" 
          color="gray"
          size="sm"
        />
      </div>
      <NuxtPage />
    </div>
  </div>
</template>

<script setup>
const colorMode = useColorMode();
const isDarkMode = ref(colorMode.value === 'dark');

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  colorMode.preference = isDarkMode.value ? 'dark' : 'light';
}

// Initialize dark mode based on user's system preference
onMounted(() => {
  if (colorMode.preference === 'dark' || 
     (colorMode.preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDarkMode.value = true;
  }
});
</script>

<style>
html, body {
  @apply min-h-screen;
}

.app-container {
  @apply min-h-screen;
}

.dark {
  color-scheme: dark;
}

.dark body {
  @apply bg-gray-900 text-white;
}

/* Light mode (default) */
body {
  @apply bg-gray-50 text-gray-900;
}

.theme-content {
  @apply min-h-screen relative;
}

.theme-toggle {
  @apply absolute top-2 right-2 z-10;
}
</style>
