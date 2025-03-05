<template>
  <div class="dashboard-page">
    <UContainer>
      <div class="dashboard-header">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-primary-800">Self Discovery</h1>
          <div class="user-menu">
            <UDropdown :items="userMenuItems">
              <UButton
                color="gray"
                variant="ghost"
                trailing-icon="i-heroicons-chevron-down"
              >
                {{ userName }}
              </UButton>
            </UDropdown>
          </div>
        </div>
      </div>

      <UTabs :items="tabs" v-model="activeTab" class="mt-8">
        <template #item="{ item }">
          <div v-if="item.key === 'document'" class="document-tab">
            <DocumentViewer />
          </div>
          <div v-else-if="item.key === 'chat'" class="chat-tab">
            <ChatInterface />
          </div>
        </template>
      </UTabs>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, provide } from "vue";

definePageMeta({
  auth: {
    authenticated: true,
    navigateUnauthenticatedTo: "/login",
  },
});

const { data: session, signOut } = useAuth();

const userName = computed(() => {
  return session.value?.user?.name || "User";
});

const activeTab = ref(0); // Default to the first tab (document)

const tabs = [
  {
    key: "document",
    label: "Document",
    icon: "i-heroicons-document-text",
  },
  {
    key: "chat",
    label: "Chat",
    icon: "i-heroicons-chat-bubble-left-right",
  },
];

// Provide the active tab to child components
provide('tabs', activeTab);

const userMenuItems = [
  [
    {
      label: "Sign Out",
      icon: "i-heroicons-arrow-right-on-rectangle",
      click: () => handleSignOut(),
    },
  ],
];

async function handleSignOut() {
  await signOut({ callbackUrl: "/" });
}
</script>

<style scoped>
.dashboard-page {
  @apply py-8;
}

.dashboard-header {
  @apply mb-8;
}

.document-tab,
.chat-tab {
  @apply mt-6;
}

.chat-tab {
  @apply h-[70vh];
}

/* Dark mode styles for tabs */
:deep(.u-tabs-item) {
  @apply dark:text-gray-300;
}

:deep(.u-tabs-item.active) {
  @apply dark:text-white dark:bg-gray-800;
}

:deep(.u-tabs-item:not(.active):hover) {
  @apply dark:bg-gray-800/50;
}
</style>
