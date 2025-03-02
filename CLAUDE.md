# CLAUDE.md - Project Guidelines

## Build Commands
- Start dev server: `npm run dev`
- Build for production: `npm run build`
- Generate static site: `npm run generate`
- Preview production build: `npm run preview`

## Project Structure
- Nuxt 3 application using Vue 3 and TypeScript
- Standard Nuxt directory structure:
  - `/pages` - Route components
  - `/components` - Reusable Vue components
  - `/composables` - Reusable composition functions
  - `/server` - Server-side code
  - `/public` - Static assets

## Code Style Guidelines
- Use TypeScript for type safety
- Follow Vue 3 Composition API patterns
- Component naming: PascalCase for components
- Variable/function naming: camelCase
- Use async/await for asynchronous operations
- Prefer const over let where possible
- Keep components focused on single responsibilities
- Document complex functions with JSDoc comments