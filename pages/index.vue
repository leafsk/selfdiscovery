<template>
  <div class="home-page">
    <UContainer>
      <div class="welcome-section">
        <h1 class="text-4xl font-bold text-center text-primary-800 dark:text-primary-400">Grow</h1>
        <p class="text-xl text-center text-gray-700 dark:text-gray-200 mt-4">
          Discover your personal mission statement through meaningful conversation
        </p>
        
        <div class="action-buttons mt-8 flex justify-center gap-4">
          <UButton 
            to="/login" 
            v-if="!session"
            color="primary" 
            size="lg"
          >
            Get Started
          </UButton>
          <UButton 
            to="/dashboard" 
            v-else
            color="primary" 
            size="lg"
          >
            Go to Dashboard
          </UButton>
        </div>
      </div>
      
      <div class="features-section mt-16 grid md:grid-cols-3 gap-8">
        <div class="feature-card">
          <UIcon name="i-heroicons-chat-bubble-left-right" class="text-primary-500 dark:text-primary-400 h-10 w-10 mb-4" />
          <h2 class="text-xl font-semibold dark:text-white">AI-Guided Reflection</h2>
          <p class="mt-2 text-gray-700 dark:text-gray-300">
            Have meaningful conversations that help you discover your values, purpose, and goals.
          </p>
        </div>
        
        <div class="feature-card">
          <UIcon name="i-heroicons-document-text" class="text-primary-500 dark:text-primary-400 h-10 w-10 mb-4" />
          <h2 class="text-xl font-semibold dark:text-white">Dynamic Document</h2>
          <p class="mt-2 text-gray-700 dark:text-gray-300">
            Watch your personal mission statement evolve as you engage in thoughtful dialogue.
          </p>
        </div>
        
        <div class="feature-card">
          <UIcon name="i-heroicons-device-phone-mobile" class="text-primary-500 dark:text-primary-400 h-10 w-10 mb-4" />
          <h2 class="text-xl font-semibold dark:text-white">Mobile Optimized</h2>
          <p class="mt-2 text-gray-700 dark:text-gray-300">
            Access your personal growth journey anytime, anywhere from any device.
          </p>
        </div>
      </div>
      
      <div class="cta-section mt-16 text-center">
        <h2 class="text-2xl font-bold dark:text-white">Ready to discover your purpose?</h2>
        <UButton 
          to="/login" 
          v-if="!session"
          color="primary" 
          size="lg"
          class="mt-6"
        >
          Start Your Journey
        </UButton>
        <UButton 
          to="/dashboard" 
          v-else
          color="primary" 
          size="lg"
          class="mt-6"
        >
          Continue Your Journey
        </UButton>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
const { data: session } = useAuth();
</script>

<style scoped>
.home-page {
  @apply py-16 dark:bg-gray-900;
}

.welcome-section {
  @apply py-12;
}

.feature-card {
  @apply bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm dark:shadow-gray-900/30;
}

.cta-section {
  @apply bg-gray-50 dark:bg-gray-800 py-12 rounded-lg;
}
</style>