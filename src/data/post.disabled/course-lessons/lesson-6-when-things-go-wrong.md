---
title: 'Lesson 6: When Things Go Wrong'
description: 'Secure your expense-sharing application with authentication, authorization, proper error handling, and security best practices.'
publishDate: 2026-10-23T00:00:00Z
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

> **Starting Point:** These exercises build upon the code from Lesson 5. You should have a working Express backend with GraphQL and a React frontend. If you haven't completed Lesson 5, you can use the code in `exercises/lesson-5-router-graphql/` as your starting point.

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

5. Create `src/types/auth.ts` for shared types:
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

6. Create `src/services/auth.service.ts` to handle authentication logic:
```ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../prisma/db.ts';
import type { AuthResponse, LoginInput, RegisterInput } from '../types/auth.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use';
const SALT_ROUNDS = 10;

export class AuthService {
  static async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await db.orm.public.User.where({ email: input.email }).first();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create user
    const user = await db.orm.public.User.create({
      name: input.name,
      email: input.email,
      password: hashedPassword,
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

  static async login(input: LoginInput): Promise<AuthResponse> {
    // Find user
    const user = await db.orm.public.User.where({ email: input.email }).first();

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

  static verifyToken(token: string): { userId: number; email: string } {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}
```

7. Create REST endpoints for auth in `src/routes/auth.router.ts`:
```ts
import { Router, type Request, type Response } from 'express';
import { AuthService } from '../services/auth.service.ts';
import type { RegisterInput, LoginInput } from '../types/auth.ts';

const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const input: RegisterInput = req.body;
    const result = await AuthService.register(input);
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ error: message });
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const input: LoginInput = req.body;
    const result = await AuthService.login(input);
    res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});

export default authRouter;
```

8. Register the auth router in `app.ts`:
```ts
import authRouter from './src/routes/auth.router.ts';
// ...
app.use('/auth', authRouter);
```

9. Test your API with `auth.http` file

Create a new user route test and a login route test.

10. Test with curl or Postman (optinal):
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

2. Update `app.ts` to pass a context factory to `createYoga()`:
```ts
import { createYoga } from 'graphql-yoga';
import { schema } from './src/graphql/schema.ts';
import { AuthService } from './src/services/auth.service.ts';
import type { GraphQLContext } from './src/types/GraphQLContext.ts';

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  cors: false,
  maskedErrors: process.env.NODE_ENV === 'production',
  context: async ({ request }): Promise<GraphQLContext> => {
    // Extract token from Authorization header
    // Note: yoga uses the Web API `request.headers.get()`, not Node's req.headers
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : '';

    if (token) {
      try {
        const user = AuthService.verifyToken(token);
        return { user };
      } catch {
        // Invalid token - continue as unauthenticated
        return {};
      }
    }

    return {};
  },
});
app.use(yoga.graphqlEndpoint, yoga);
```

3. Update `src/graphql/schema.ts` to annotate the context type on `createSchema`:
```ts
import type { GraphQLContext } from '../types/GraphQLContext.ts';
// ...

export const schema = createSchema<GraphQLContext>({
  typeDefs: /* GraphQL */ `...`, // same typeDefs as before
  resolvers: { ... },            // same resolvers as before
});
```

This one-line change is enough to make TypeScript aware of `ctx.user` inside every resolver.

4. Test in GraphiQL by adding the Authorization header. Log in first to get a token, then open GraphiQL's **Headers** tab and add:
```json
{ "Authorization": "Bearer YOUR_JWT_TOKEN_HERE" }
```

<!--Token OK But not response from srv-->

---

### 3. Add Authorization Guards to Resolvers

**Goal:** Ensure users can only create expenses where they are the payer, and can only view expenses they're involved in.

**Steps:**

1. Create helper functions in `src/graphql/authHelpers.ts`:
```ts
import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../types/GraphQLContext.ts';

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

2. Update `src/graphql/schema.ts` to add authorization checks to the resolvers:
```ts
import { createSchema } from 'graphql-yoga';
import { GraphQLError } from 'graphql';
import { ExpensesService } from '../services/expenses.service.ts';
import { UsersService } from '../services/users.service.ts';
import { CategoriesService } from '../services/categories.service.ts';
import { parseNewExpense, type Expense } from '../types/expense.ts';
import { requireAuth } from './authHelpers.ts';
import type { GraphQLContext } from '../types/GraphQLContext.ts';

export const schema = createSchema<GraphQLContext>({
  typeDefs: /* GraphQL */ `
    // ... same typeDefs as before (User, Category, Expense, ExpenseFilter, CreateExpenseInput, Query, Mutation)
  `,
  resolvers: {
    Expense: {
      date: (expense: Expense) => expense.date.toISOString(),
    },
    Query: {
      expenses: (_parent, args, ctx) => {
        requireAuth(ctx);
        return ExpensesService.getExpenses(args.filter ?? {});
      },
      expense: async (_parent, args, ctx) => {
        const user = requireAuth(ctx);

        const expense = await ExpensesService.getExpenseById(args.id);

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
      },
      users: () => UsersService.getUsers(),
      categories: () => CategoriesService.getCategories(),
    },
    Mutation: {
      createExpense: async (_parent, args, ctx) => {
        const user = requireAuth(ctx);

        // User can only create expenses where they are the payer
        if (user.userId !== args.input.payerId) {
          throw new GraphQLError('You can only create expenses that you paid for', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        const newExpense = parseNewExpense(args.input);
        if (newExpense === false) {
          throw new GraphQLError('Invalid expense');
        }
        return ExpensesService.addExpense(newExpense);
      },
    },
  },
});
```

3. Test authorization in GraphiQL:
   - Try querying an expense without Authorization header => should get UNAUTHENTICATED error
   - Try creating an expense with a different payerId than your userId => should get FORBIDDEN error
   - Try with correct credentials => should work

---

### 4. Configure Helmet for Security Headers

**Goal:** Add Helmet middleware to set proper security headers for production.

**Steps:**

1. Install Helmet:
```bash
npm install helmet
```

2. Update `app.ts` to properly configure Helmet:
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

2. Update `src/services/auth.service.ts` to use custom errors:
```ts
import { AuthenticationError, ConflictError } from '../errors/AppErrors.ts';
// ...

static async register(input: RegisterInput): Promise<AuthResponse> {
  const existingUser = await db.orm.public.User.where({ email: input.email }).first();

  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }
  // ... rest of code
}

static async login(input: LoginInput): Promise<AuthResponse> {
  const user = await db.orm.public.User.where({ email: input.email }).first();

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

> **Note:** graphql-yoga's `formatError` receives `(formattedError, error)` — two arguments, not one. `formattedError` is the already-sanitised error object (with `maskedErrors` applied); `error` is the original thrown value. This differs from Apollo Server's single-argument version.

```ts
import type { GraphQLFormattedError } from 'graphql';
import { AppError } from '../errors/AppErrors.ts';

export function formatError(
  formattedError: GraphQLFormattedError,
  error: unknown
): GraphQLFormattedError {
  // Log for debugging (use a proper logging library in production)
  console.error('GraphQL Error:', error);

  // Unwrap the original error from Yoga's wrapper
  const originalError = (error as any)?.originalError ?? error;

  // Handle our custom AppErrors
  if (originalError instanceof AppError) {
    return {
      ...formattedError,
      message: originalError.message,
      extensions: {
        code: originalError.code,
        statusCode: originalError.statusCode,
      },
    };
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    return {
      message: 'An unexpected error occurred',
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    };
  }

  return formattedError;
}
```

4. Update `app.ts` to use the error formatter in `createYoga()`:
```ts
import { formatError } from './src/graphql/errorFormatter.ts';
// ...

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  cors: false,
  maskedErrors: process.env.NODE_ENV === 'production',
  formatError, // Add this
  context: async ({ request }) => {
    // ... same context extraction as before
  },
});
```

5. Update `src/graphql/authHelpers.ts` to use custom errors:
```ts
import { AuthenticationError, AuthorizationError } from '../errors/AppErrors.ts';
import type { GraphQLContext } from '../types/GraphQLContext.ts';

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

3. Wrap your app with `AuthProvider` in `src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AuthProvider } from './contexts/AuthContext';
// ... your existing imports

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
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
// In ExpenseNew.tsx, get the authenticated user from context
import { graphqlRequest } from '../../lib/graphql';
import { useAuth } from '../contexts/AuthContext';

const CREATE_EXPENSE = /* GraphQL */ `
  mutation CreateExpense($input: CreateExpenseInput!) {
    createExpense(input: $input) {
      id
    }
  }
`;

const { user } = useAuth();

// Use user.userId as the payerId instead of a selected value
const createExpense = async (data: NewExpenseInput) => {
  await graphqlRequest(CREATE_EXPENSE, {
    input: {
      ...data,
      payerId: user!.userId, // Use authenticated user's ID
    },
  });
  navigate('/expenses');
};
```

---

### 7. Configure Authenticated GraphQL Client

**Goal:** Automatically include the JWT token in all GraphQL requests, and redirect to the login page when a request is rejected as unauthenticated.

Since Lesson 5 uses a plain `graphqlRequest()` fetch function rather than Apollo Client, adding auth is a two-line change: read the token from `localStorage` and add an `Authorization` header.

**Steps:**

1. Update `src/lib/graphql.ts`:
```ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'auth_token';

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

  const response = await fetch(`${API_BASE_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Attach the token when present
      ...(token && { authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ query, variables }),
  });

  const { data, errors } = await response.json();

  if (errors) {
    console.error('[GraphQL error]:', errors[0]);

    // Expired or invalid token → clear it and redirect to login
    if (errors[0]?.extensions?.code === 'UNAUTHENTICATED') {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }

    throw new Response(errors[0].message, { status: 500 });
  }

  return data as T;
}
```

2. Test by creating an expense — the `Authorization: Bearer …` header should now appear in the Network tab of your browser's dev tools.

---

### 8. Create Protected Routes

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