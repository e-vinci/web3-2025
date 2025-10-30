---
title: 'Lesson 6: When Things Go Wrong'
description: 'Secure your expense-sharing application with authentication, authorization, proper error handling, and security best practices.'
publishDate: 2025-10-31T00:00:00Z
excerpt: 'Learn how to implement JWT authentication, permission-based authorization, Helmet security headers, and comprehensive error management for both backend and frontend.'
tags:
- security
- authentication
- jwt
- helmet
- error-handling
- graphql
- express
- react
- typescript
- course
- web3-2025

category: 'course-lesson'
---
## Course material

- [Presentation Slides](https://raw.githubusercontent.com/e-vinci/web3-2025/refs/heads/main/src/slides/lesson-6-theory.pptx)


## Introduction

In previous lessons, we built a functional expense-sharing application with both REST and GraphQL APIs. However, **anyone can create, view, or modify any expense** without restrictions. In production applications, this is unacceptable.

In this lesson, you'll learn how to:
- **Authenticate users** with JWT tokens
- **Authorize actions** so users can only submit expenses they actually paid
- **Secure your application** with Helmet and proper security headers
- **Handle errors gracefully** on both backend and frontend
- **Validate inputs** to prevent bad data and security vulnerabilities

By the end of this lesson, your app will be production-ready with proper security and error handling.

---

## Recommended Reading

- [JWT Introduction](https://jwt.io/introduction)
- [OWASP Top Ten Web Application Security Risks](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Apollo Server Error Handling](https://www.apollographql.com/docs/apollo-server/data/errors/)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Zod Documentation](https://zod.dev/)

---

## Exercises

> **Starting Point:** These exercises build upon the code from Lesson 5. You should have a working Express backend with GraphQL (using Pothos) and a React frontend with Apollo Client. If you haven't completed Lesson 5, you can use the code in `exercises/lesson-5-graphql/` as your starting point.

### 1. Set Up User Authentication Backend

**Goal:** Add user registration and login endpoints with password hashing and JWT token generation.

**Steps:**

1. Install required packages:
```bash
npm install bcrypt jsonwebtoken
npm install --save-dev @types/bcrypt @types/jsonwebtoken
```

2. Add JWT secret to your environment variables in `.env`:
```dotenv
JWT_SECRET=your-super-secret-key-change-this-in-production
```

3. Update your Prisma schema to add password field to User model:
```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String   // Add this field
  bankAccount String?
  // ... other fields
}
```

4. Run migration:
```bash
npx prisma migrate dev --name add-user-password
```

5. Create `src/types/AuthTypes.ts` for shared types:
```ts
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}
```

6. Create `src/api/auth/authService.ts` to handle authentication logic:
```ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '../../generated/prisma';
import type { RegisterInput, LoginInput, AuthResponse } from '@/types/AuthTypes';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use';
const SALT_ROUNDS = 10;

export async function register(input: RegisterInput): Promise<AuthResponse> {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
    },
  });

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const validPassword = await bcrypt.compare(input.password, user.password);

  if (!validPassword) {
    throw new Error('Invalid email or password');
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}

export function verifyToken(token: string): { userId: number; email: string } {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
```

7. Create REST endpoints for auth in `src/api/auth/authController.ts`:
```ts
import type { Request, Response } from 'express';
import * as authService from './authService';
import type { RegisterInput, LoginInput } from '@/types/AuthTypes';

export async function register(req: Request, res: Response) {
  try {
    const input: RegisterInput = req.body;
    const result = await authService.register(input);
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ error: message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const input: LoginInput = req.body;
    const result = await authService.login(input);
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
}
```

8. Create `src/api/auth/authRouter.ts`:
```ts
import { Router } from 'express';
import * as authController from './authController';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

export default router;
```

9. Register the auth router in `src/server.ts`:
```ts
import authRouter from './api/auth/authRouter';
// ...
app.use('/auth', authRouter);
```

10. Test with curl or Postman:
```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com", "password": "secret123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "secret123"}'
```

You should receive a JWT token in the response.

---

### 2. Add Authentication to GraphQL Context

**Goal:** Extract and verify JWT tokens in GraphQL requests, making authenticated user available to all resolvers.

**Steps:**

1. Create `src/types/GraphQLContext.ts`:
```ts
export interface GraphQLContext {
  user?: {
    userId: number;
    email: string;
  };
}
```

2. Update `src/graphql/server.ts` to add context extraction:
```ts
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import schema from "./schema";
import type { GraphQLContext } from "@/types/GraphQLContext";
import { verifyToken } from "@/api/auth/authService";

const server = new ApolloServer({ schema });
await server.start();

const graphqlMiddleware = expressMiddleware(server, {
  context: async ({ req }): Promise<GraphQLContext> => {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : '';

    // Verify token and add user to context
    if (token) {
      try {
        const user = verifyToken(token);
        return { user };
      } catch (error) {
        // Invalid token - continue with empty context
        return {};
      }
    }

    return {};
  },
});

export default graphqlMiddleware;
```

3. Update `src/graphql/builder.ts` to include context type:
```ts
import type { GraphQLContext } from "@/types/GraphQLContext";
// ...

const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Scalars: ScalarsMap;
  Context: GraphQLContext; // Add this
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
  },
});
```

4. Test in ruru by adding Authorization header. First, log in to get a token, then use it:
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

---

### 3. Add Authorization Guards to Resolvers

**Goal:** Ensure users can only create expenses where they are the payer, and can only view expenses they're involved in.

**Steps:**

1. Create helper functions in `src/graphql/authHelpers.ts`:
```ts
import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '@/types/GraphQLContext';

export function requireAuth(context: GraphQLContext): { userId: number; email: string } {
  if (!context.user) {
    throw new GraphQLError('You must be logged in to perform this action', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
}

export function requireOwnership(
  userId: number,
  resourceOwnerId: number,
  resourceName: string = 'resource'
): void {
  if (userId !== resourceOwnerId) {
    throw new GraphQLError(`You don't have permission to access this ${resourceName}`, {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}
```

2. Update `src/api/expense/augmentGraphqlSchema.ts` to add authorization:
```ts
import { requireAuth } from '@/graphql/authHelpers';
import { GraphQLError } from 'graphql';
// ...

const augmentSchema = (builder: typeof SchemaBuilder) => {
  const ExpenseRef = builder.prismaObject('Expense', {
    fields: (t) => ({
      id: t.exposeID('id'),
      description: t.exposeString('description'),
      amount: t.exposeFloat('amount'),
      date: t.expose('date', { type: 'Date' }),
      payer: t.relation('payer'),
      participants: t.relation('participants')
    }),
  });

  builder.queryType({
    fields: (t) => ({
      expense: t.field({
        type: ExpenseRef,
        args: {
          id: t.arg.int({ required: true })
        },
        resolve: async (_root, args, ctx, _info) => {
          // Require authentication
          const user = requireAuth(ctx);

          const expense = await expenseRepository.getExpenseById(args.id as number);

          if (!expense) {
            throw new GraphQLError('Expense not found', {
              extensions: { code: 'NOT_FOUND' },
            });
          }

          // Check if user is involved in this expense (as payer or participant)
          const isInvolved =
            expense.payer.id === user.userId ||
            expense.participants.some(p => p.id === user.userId);

          if (!isInvolved) {
            throw new GraphQLError("You don't have permission to view this expense", {
              extensions: { code: 'FORBIDDEN' },
            });
          }

          return expense;
        }
      }),
    }),
  });

  builder.mutationType({
    fields: (t) => ({
      createExpense: t.field({
        type: ExpenseRef,
        args: {
          description: t.arg.string({ required: true }),
          amount: t.arg.float({ required: true }),
          date: t.arg({ type: 'Date', required: true }),
          payerId: t.arg.int({ required: true }),
          participantIds: t.arg({type: ['Int'], required: true }),
        },
        resolve: async (_parent, args, ctx, _info) => {
          // Require authentication
          const user = requireAuth(ctx);

          // User can only create expenses where they are the payer
          if (user.userId !== args.payerId) {
            throw new GraphQLError('You can only create expenses that you paid for', {
              extensions: { code: 'FORBIDDEN' },
            });
          }

          const { description, amount, date, payerId, participantIds } = args;
          return expenseRepository.createExpense({
            description,
            amount,
            date,
            payerId,
            participantIds
          });
        }
      }),
    }),
  });
};

export default augmentSchema;
```

3. Test authorization in ruru:
   - Try querying an expense without Authorization header => should get UNAUTHENTICATED error
   - Try creating an expense with a different payerId than your userId => should get FORBIDDEN error
   - Try with correct credentials => should work

---

### 4. Configure Helmet for Security Headers

**Goal:** Add Helmet middleware to set proper security headers for production.

**Steps:**

1. Helmet should already be installed from previous lessons. If not:
```bash
npm install helmet
```

2. Update `src/server.ts` to properly configure Helmet:
```ts
import helmet from 'helmet';
// ...

// Apply Helmet with proper configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline only for dev
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // For development with external resources
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
}));

// Configure CORS for authenticated requests
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```

3. Add `FRONTEND_URL` to your `.env`:
```dotenv
FRONTEND_URL=http://localhost:5173
```

4. Test by checking response headers in your browser's Network tab. You should see headers like:
   - `Content-Security-Policy`
   - `Strict-Transport-Security`
   - `X-Content-Type-Options`
   - `X-Frame-Options`

---

### 5. Implement Custom Error Classes

**Goal:** Create structured error handling with custom error types for better error management.

**Steps:**

1. Create `src/errors/AppErrors.ts`:
```ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_SERVER_ERROR'
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHENTICATED');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}
```

2. Update `src/api/auth/authService.ts` to use custom errors:
```ts
import { AuthenticationError, ConflictError } from '@/errors/AppErrors';
// ...

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }
  // ... rest of code
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  const validPassword = await bcrypt.compare(input.password, user.password);

  if (!validPassword) {
    throw new AuthenticationError('Invalid email or password');
  }
  // ... rest of code
}
```

3. Create error formatter for GraphQL in `src/graphql/errorFormatter.ts`:
```ts
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { AppError } from '@/errors/AppErrors';

export function formatError(error: GraphQLError): GraphQLFormattedError {
  // Log error for debugging (in production, use proper logging service)
  console.error('GraphQL Error:', error);

  // Extract original error
  const originalError = error.originalError;

  // Handle our custom AppErrors
  if (originalError instanceof AppError) {
    return {
      message: originalError.message,
      extensions: {
        code: originalError.code,
        statusCode: originalError.statusCode,
      },
      locations: error.locations,
      path: error.path,
    };
  }

  // Handle Prisma errors
  if (originalError?.name === 'PrismaClientKnownRequestError') {
    const prismaError = originalError as any;

    if (prismaError.code === 'P2002') {
      return {
        message: 'A record with this unique field already exists',
        extensions: { code: 'CONFLICT', statusCode: 409 },
      };
    }

    if (prismaError.code === 'P2025') {
      return {
        message: 'Record not found',
        extensions: { code: 'NOT_FOUND', statusCode: 404 },
      };
    }
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    return {
      message: 'An unexpected error occurred',
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    };
  }

  // In development, return full error details
  return {
    message: error.message,
    extensions: {
      code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
    locations: error.locations,
    path: error.path,
  };
}
```

4. Update `src/graphql/server.ts` to use error formatter:
```ts
import { formatError } from './errorFormatter';
// ...

const server = new ApolloServer({
  schema,
  formatError, // Add this
});
```

5. Update `src/graphql/authHelpers.ts` to use custom errors:
```ts
import { AuthenticationError, AuthorizationError } from '@/errors/AppErrors';
import type { GraphQLContext } from '@/types/GraphQLContext';

export function requireAuth(context: GraphQLContext): { userId: number; email: string } {
  if (!context.user) {
    throw new AuthenticationError('You must be logged in to perform this action');
  }
  return context.user;
}

export function requireOwnership(
  userId: number,
  resourceOwnerId: number,
  resourceName: string = 'resource'
): void {
  if (userId !== resourceOwnerId) {
    throw new AuthorizationError(`You don't have permission to access this ${resourceName}`);
  }
}
```

---

### 6. Frontend: Authentication State Management

**Goal:** Create a React context for managing authentication state and storing JWT tokens.

**Steps:**

1. Install dependencies if needed:
```bash
npm install jwt-decode
```

2. Create `src/contexts/AuthContext.tsx`:
```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  userId: number;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  const [user, setUser] = useState<User | null>(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      try {
        return jwtDecode<User>(storedToken);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        return null;
      }
    }
    return null;
  });

  const login = (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    const decoded = jwtDecode<User>(newToken);
    setUser(decoded);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  // Check if token is expired on mount and periodically
  useEffect(() => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          // Token expired
          logout();
        }
      } catch {
        logout();
      }
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

3. Wrap your app with `AuthProvider` in `src/App.tsx`:
```tsx
import { AuthProvider } from './contexts/AuthContext';
// ...

function App() {
  return (
    <AuthProvider>
      <ApolloProvider client={client}>
        <RouterProvider router={router} />
      </ApolloProvider>
    </AuthProvider>
  );
}
```

4. Create login page component `src/pages/Login/Component.tsx`:
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      login(data.token);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

5. Add route for login page in your router configuration.

6. Update your navigation/header component to show login/logout based on authentication state. For example, if you have a navbar with a user selector, replace it with authentication controls:

```tsx
// Example: src/components/Header.tsx or updating existing navbar
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          Expenso
        </Link>

        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-gray-700">
                Welcome, {user?.email}
              </span>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate('/login')}>
              Login
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
```

7. If your app previously had a user selector dropdown (e.g., to switch between different users during development), remove it and replace it with the authentication controls from step 6. The authenticated user is now determined by the JWT token, not by manual selection:

```tsx
// BEFORE (development-only user selector):
<select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
  <option value="1">Alice</option>
  <option value="2">Bob</option>
  <option value="3">Charlie</option>
</select>

// AFTER (authentication-based):
{isAuthenticated ? (
  <>
    <span>Welcome, {user?.email}</span>
    <Button onClick={handleLogout}>Logout</Button>
  </>
) : (
  <Button onClick={() => navigate('/login')}>Login</Button>
)}
```

When creating expenses, use the authenticated user's ID from the token instead of a manually selected user:

```tsx
// In NewExpense component, get the authenticated user
const { user } = useAuth();

// Use user.userId as the payerId instead of a selected value
const onSubmit = async (data: ExpenseFormData) => {
  await graphqlClient.mutate({
    mutation: CREATE_EXPENSE_GQL,
    variables: {
      description: data.description,
      amount: data.amount,
      date: data.date ? new Date(data.date) : new Date(),
      payerId: user!.userId, // Use authenticated user's ID
      participantIds: data.participantIds.map(id => Number(id)),
    },
  });
};
```

---

### 8. Configure Authenticated Apollo Client

**Goal:** Automatically include JWT token in all GraphQL requests.

**Steps:**

1. Update `src/lib/graphql-client.ts`:
```ts
import { ApolloClient, HttpLink, InMemoryCache, from } from "@apollo/client";
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

const API_HOST = import.meta.env.VITE_GRAPHQL_URL;
const TOKEN_KEY = 'auth_token';

// HTTP connection to the API
const httpLink = new HttpLink({
  uri: API_HOST,
});

// Middleware to add auth token to requests
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem(TOKEN_KEY);

  return {
    headers: {
      ...headers,
      ...(token && { authorization: `Bearer ${token}` }),
    },
  };
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, extensions, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Code: ${extensions?.code}, Path: ${path}`
      );

      // Handle authentication errors
      if (extensions?.code === 'UNAUTHENTICATED') {
        // Clear token and redirect to login
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;
```

2. Test by creating an expense - the token should now be automatically included in the request headers.

---

### 9. Create Protected Routes

**Goal:** Redirect unauthenticated users to login page when accessing protected routes.

**Steps:**

1. Create `src/components/ProtectedRoute.tsx`:
```tsx
import { Navigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

2. Update your router configuration to wrap protected routes:
```tsx
import ProtectedRoute from '@/components/ProtectedRoute';
// ...

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'expenses/new',
        element: <NewExpense />,
        loader: newExpenseLoader,
      },
      {
        path: 'expenses/:id',
        element: <ExpenseDetails />,
        loader: expenseDetailsLoader,
      },
      // ... other protected routes
    ],
  },
]);
```

3. Test by accessing protected routes without being logged in - you should be redirected to login.

---

## Summary

In this lesson, you've transformed your expense-sharing application into a production-ready, secure system:

- **Authentication**: Users can register and log in with JWT tokens
- **Authorization**: Users can only create expenses they paid for and view expenses they're involved in
- **Security Headers**: Helmet protects against common web vulnerabilities
- **Error Handling**: Custom error classes provide clear, consistent error messages
- **Frontend Auth**: React context manages authentication state
- **Protected Routes**: Unauthenticated users are redirected to login


Your application now follows security best practices and provides a professional user experience with proper error handling and validation.

# The PR

Adding some statistics - check it [here](https://github.com/e-vinci/web3-2025/pull/14)