// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: [
    // '@nuxtjs/tailwindcss', // Removed Tailwind module
    "@nuxt/ui",
    "@sidebase/nuxt-auth",
    "@pinia/nuxt",
  ],
  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: ''
  },
  css: ["~/assets/css/tailwind.css"],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  auth: {
    // Auth configuration will go here
  },
  runtimeConfig: {
    // Private keys for server
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    // Public keys for client
    public: {
      apiBaseUrl: process.env.API_BASE_URL || "/api",
    },
  },
});
