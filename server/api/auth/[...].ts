import { NuxtAuthHandler } from '#auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { userOperations } from '~/server/utils/db';

// For a real application, you would use a real database for credential verification
// This is just a mock user store for demo purposes
const users = [
  {
    id: '1',
    email: 'user@example.com',
    name: 'Test User',
    password: 'password123' // In a real app, this would be hashed
  }
];

// Ensure our demo user exists in the database
try {
  const existingUser = userOperations.findById.get('1');
  if (!existingUser) {
    userOperations.createUser.run('1', 'user@example.com', 'Test User');
    console.log('Demo user created in SQLite database');
  }
} catch (e) {
  console.error('Error ensuring demo user exists:', e);
}

export default NuxtAuthHandler({
  secret: 'your-secret-here', // In production, use an environment variable
  providers: [
    // @ts-expect-error You need to use .default here for it to work during SSR
    CredentialsProvider.default({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials: any) {
        // This is where you would check the credentials against your database
        const user = users.find(u => u.email === credentials.email && u.password === credentials.password);
        
        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name
          };
        }
        
        return null;
      }
    })
  ],
  pages: {
    signIn: '/login'
  },
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    }
  }
});