import { defineStore } from 'pinia';

interface DocumentState {
  content: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export const useDocumentStore = defineStore('document', {
  state: (): DocumentState => ({
    content: {},
    isLoading: false,
    error: null,
    lastUpdated: null
  }),
  
  actions: {
    async fetchDocument() {
      this.isLoading = true;
      this.error = null;
      
      try {
        const { data } = await useFetch('/api/document');
        if (data.value) {
          console.log('Document fetched from API:', data.value);
          
          if (typeof data.value.content === 'object') {
            this.content = data.value.content as Record<string, string>;
            
            // Ensure all chapters have content
            Object.entries(this.content).forEach(([key, value]) => {
              if (!value || value.trim() === '') {
                console.warn(`Chapter "${key}" has empty content, setting placeholder`);
                this.content[key] = `This is where your insights about "${key}" will appear...`;
              }
            });
            
            this.lastUpdated = data.value.updatedAt;
          } else {
            console.error('Invalid document content structure:', data.value.content);
          }
        }
      } catch (e) {
        this.error = 'Failed to load your document';
        console.error('Error fetching document:', e);
      } finally {
        this.isLoading = false;
      }
    },
    
    async updateChapter(chapter: string, content: string) {
      this.isLoading = true;
      this.error = null;
      
      try {
        const { data } = await useFetch('/api/document/update', {
          method: 'POST',
          body: { chapter, content }
        });
        
        if (data.value && data.value.success) {
          // Update the local state
          this.content[chapter] = content;
          this.lastUpdated = data.value.updatedAt;
        }
      } catch (e) {
        this.error = 'Failed to update your document';
        console.error('Error updating document:', e);
      } finally {
        this.isLoading = false;
      }
    }
  },
  
  getters: {
    chapters: (state) => Object.keys(state.content),
    chapterContent: (state) => (chapter: string) => state.content[chapter] || '',
    formattedLastUpdated: (state) => {
      if (!state.lastUpdated) return '';
      return new Date(state.lastUpdated).toLocaleString();
    }
  }
});