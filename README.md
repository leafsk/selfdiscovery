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

## License

MIT

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for Claude AI
- [Nuxt](https://nuxt.com/) team for the fantastic framework
