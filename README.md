# Grow - Personal Mission Statement App

Grow is an application that helps users discover and refine their personal mission statements through AI-guided conversations. The app dynamically creates and updates a structured document as users engage in reflective dialogue.

## Features

- **AI-Guided Conversations**: Chat with an AI assistant to explore your values, goals, and purpose
- **Dynamic Document Creation**: Your personal mission statement evolves as you chat
- **Mobile-Optimized Design**: Access your mission statement from any device
- **Secure User Authentication**: Keep your personal reflections private

## Technical Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript
- **UI Components**: Nuxt UI with TailwindCSS
- **Editor**: TipTap for Markdown editing and display
- **Auth**: Nuxt Auth Module with JWT
- **AI Integration**: Claude API for intelligent conversations

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Claude API key (for AI functionality)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/grow.git
cd grow
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file with:
```
ANTHROPIC_API_KEY=your_claude_api_key
AUTH_SECRET=your_auth_secret
```

4. Start the development server
```bash
npm run dev
```

## Usage

1. Create an account or sign in
2. Navigate to the Chat tab to start a conversation
3. Explore suggested conversation starters or ask your own questions
4. View your evolving mission statement in the Document tab
5. Edit any section manually if needed

## Deployment to Cloudflare Pages

This application is configured to deploy to Cloudflare Pages with D1 database integration.

### Prerequisites

1. A Cloudflare account
2. Wrangler CLI installed: `npm install -g wrangler`
3. D1 database already created

### Deployment Steps

1. Set up the database schema:
   ```bash
   wrangler d1 execute selfdiscovery --file=schema.sql
   ```

2. Build and deploy:
   ```bash
   npm run build
   npx wrangler pages deploy .output/public --project-name=selfdiscovery
   ```

3. Configure environment variables in the Cloudflare Pages dashboard:
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
   - `NEXTAUTH_SECRET`: A random string for session encryption
   - `NEXTAUTH_URL`: https://selfdiscovery.pages.dev

4. Bind the D1 database to your Cloudflare Pages deployment:
   ```bash
   # Replace DEPLOYMENT_ID with your actual deployment ID from the Pages dashboard
   npx wrangler pages deployment environment-variable set DEPLOYMENT_ID DB d1:selfdiscovery
   ```

### Cloudflare Local Development

Run the Cloudflare Pages development server:
```bash
npm run build
npm run dev:cf
```

## License

MIT

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude AI
- [Nuxt](https://nuxt.com/) team for the fantastic framework
- [Cloudflare](https://www.cloudflare.com/) for Pages and D1 database
