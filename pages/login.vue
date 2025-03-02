<template>
  <div class="login-page">
    <UContainer class="max-w-md">
      <div class="login-container">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-primary-800">Sign In to Grow</h1>
          <p class="text-gray-600 mt-2">Continue your self-discovery journey</p>
        </div>
        
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <UFormGroup label="Email">
              <UInput
                v-model="email"
                type="email"
                placeholder="your@email.com"
                autocomplete="email"
                required
              />
            </UFormGroup>
          </div>
          
          <div class="form-group">
            <UFormGroup label="Password">
              <UInput
                v-model="password"
                type="password"
                placeholder="••••••••"
                autocomplete="current-password"
                required
              />
            </UFormGroup>
          </div>
          
          <UButton 
            type="submit" 
            color="primary" 
            block 
            :loading="isLoading"
            class="mt-6"
          >
            Sign In
          </UButton>
          
          <div v-if="errorMessage" class="error-message mt-4 text-red-500 text-center text-sm">
            {{ errorMessage }}
          </div>
        </form>
        
        <div class="mt-6 text-center text-sm text-gray-600">
          <p>For demo purposes, use:</p>
          <p class="font-mono mt-1">user@example.com / password123</p>
        </div>
        
        <div class="mt-8 text-center">
          <NuxtLink to="/" class="text-primary-600 hover:text-primary-800 text-sm">
            Back to Home
          </NuxtLink>
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

definePageMeta({
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/dashboard'
  }
});

const router = useRouter();
const { signIn } = useAuth();

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

async function handleLogin() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter both email and password';
    return;
  }
  
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    const result = await signIn('credentials', {
      email: email.value,
      password: password.value,
      callbackUrl: '/dashboard'
    });
    
    if (result?.error) {
      errorMessage.value = 'Invalid email or password';
    } else {
      router.push('/dashboard');
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMessage.value = 'An error occurred during sign in';
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  @apply py-16 min-h-screen flex items-center justify-center;
}

.login-container {
  @apply bg-white p-8 rounded-lg shadow-md;
}

.login-form {
  @apply space-y-4;
}
</style>