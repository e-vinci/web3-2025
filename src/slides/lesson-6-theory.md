---
marp: true
theme: default
class: lead
paginate: true
header: 'Web 3 2025 - Lesson 6'
footer: 'Web 3 2025 - Vinci'
backgroundColor: #fff
backgroundImage: url('https://marp.app/assets/hero-background.svg')
---

# Lesson 6: When Things Go Wrong

**Security, Authentication & Error Handling**

---

## Leaving the Happy Path

Until now, we've focused on the **happy path**:

- ✅ Users can create expenses
- ✅ Users can view expenses
- ✅ Data is stored and retrieved

But we're missing critical pieces:

- ❌ **No authentication** - Who is the user?
- ❌ **No authorization** - What can they access?
- ❌ **No security headers** - Protection against attacks
- ❌ **Poor error handling** - Unhelpful error messages

**Today: Making our app production-ready!**

<!--
Speaker Notes:
• Welcome to lesson 6 - security and error handling
• Up until now, anyone can do anything
• No protection against common web attacks
• Time to implement production-ready security
• These aren't optional features - they're essential
-->

---

# Today's Topics

1. **JWT Authentication** - Who are you?
2. **GraphQL Context & Middleware** - How to pass auth info
3. **Helmet Security Headers** - Protection against attacks
4. **Protected Routes** - Frontend access control
5. **Custom Error Handling** - Better error management

<!--
Speaker Notes:
• Comprehensive security implementation
• Each layer protects against different threats
• Authentication identifies users
• Authorization controls access
• Error handling provides good UX
-->

---

# JWT (JSON Web Tokens)

## What is a JWT?

A secure way to transmit information between parties as a JSON object.

**Structure**: `header.payload.signature`

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJ1c2VySWQiOjEyMywiZW1haWwiOiJhbGljZUBleGFtcGxlLmNvbSJ9.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

<!--
Speaker Notes:
• Three parts separated by dots
• Header: algorithm and token type
• Payload: claims (user data)
• Signature: verification that token hasn't been tampered with
• Stateless - server doesn't need to store sessions
-->

---

# JWT Structure Breakdown

## Header (Base64 encoded)

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

## Payload (Base64 encoded)

```json
{
  "userId": 123,
  "email": "alice@example.com",
  "exp": 1735689600
}
```

---

## Signature

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

<!--
Speaker Notes:
• Header specifies signing algorithm
• Payload contains claims - user data we want to transmit
• exp is expiration timestamp - tokens should expire
• Signature verifies token authenticity using secret key
• Only server with secret key can create valid signatures
-->

---

# JWT Server-Side Implementation

```typescript
// Creating a token (during login/register)
export function login(email: string, password: string): AuthResponse {
  // Verify credentials...
  const user = await findUser(email);

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  return { token, user };
}

// Verifying a token
export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
}
```

<!--
Speaker Notes:
• jwt.sign creates the token with payload and secret
• expiresIn ensures tokens don't live forever
• jwt.verify checks signature and returns payload
• Throws error if token is invalid or expired
• Never expose JWT_SECRET - keep it in environment variables
-->

---

# JWT Client-Side Implementation

## Storing the Token

```typescript
// After successful login
const response = await fetch('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

const { token } = await response.json();

// Store in localStorage
localStorage.setItem('auth_token', token);
```

---

## Sending the Token

```typescript
// Include in Authorization header
const response = await fetch('/api/expenses', {
  headers: {
    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
  },
});
```

<!--
Speaker Notes:
• Client receives token after successful authentication
• Store in localStorage for persistence across page refreshes
• Send with every API request in Authorization header
• Bearer scheme is standard for JWT
• Alternative: httpOnly cookies (more secure but less flexible)
-->

---

# GraphQL Context & Middleware

## What is Context?

A way to **pass data to all resolvers** without adding it as arguments.

Perfect for authentication data that every resolver needs!

```typescript
interface GraphQLContext {
  user?: {
    userId: number;
    email: string;
  };
}
```

<!--
Speaker Notes:
• Context available in every resolver
• Avoids repeating auth logic in each resolver
• Set up once in middleware
• TypeScript interface ensures type safety
• Optional user - might not be authenticated
-->

---

# Setting Up GraphQL Context

```typescript
const graphqlMiddleware = expressMiddleware(server, {
  context: async ({ req }): Promise<GraphQLContext> => {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

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
```

<!--
Speaker Notes:
• Runs before every GraphQL request
• Extracts JWT from Authorization header
• Verifies token and decodes payload
• Adds user to context if valid token
• Returns empty context if no token or invalid
• All resolvers receive this context as parameter
-->

---

# Using Context in Resolvers

```typescript
// Helper function to require authentication
export function requireAuth(context: GraphQLContext) {
  if (!context.user) {
    throw new GraphQLError('You must be logged in', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
}
```

<!--
Speaker Notes:
• requireAuth checks if user exists in context
• Throws UNAUTHENTICATED if not logged in
• Throws FORBIDDEN if logged in but not authorized
• Separation of authentication (who are you) and authorization (what can you do)
• Context makes this pattern clean and reusable
-->

---

# Helmet: HTTP Security Headers

## What is Helmet?

Middleware that sets **HTTP security headers** to protect against common web vulnerabilities.

```bash
npm install helmet
```

```typescript
import helmet from 'helmet';

app.use(helmet());
```

**That's it!** 🛡️

<!--
Speaker Notes:
• Helmet is Express middleware
• Sets multiple security-related HTTP headers
• Protects against common attacks
• One line of code for significant security improvement
• Industry standard for Express apps
• Let's look at what it actually does
-->

---

# Content Security Policy (CSP)

## Prevents: Cross-Site Scripting (XSS) attacks

```typescript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"], // Only load from same origin
        scriptSrc: ["'self'"], // Only run scripts from same origin
        styleSrc: ["'self'", "'unsafe-inline'"], // Styles from same origin + inline
        imgSrc: ["'self'", 'data:', 'https:'], // Images from various sources
        connectSrc: ["'self'"], // API calls only to same origin
        fontSrc: ["'self'"], // Fonts from same origin
        objectSrc: ["'none'"], // No plugins (Flash, etc.)
        frameSrc: ["'none'"], // No iframes
      },
    },
  })
);
```

**Attack Prevented:** Attacker injects `<script>` tag, but CSP blocks execution

<!--
Speaker Notes:
• CSP defines trusted sources for different content types
• Browser enforces these policies
• defaultSrc is fallback for unspecified directives
• scriptSrc prevents malicious script injection
• unsafe-inline needed for some frameworks but risky
• connectSrc controls where fetch/XMLHttpRequest can connect
• Significantly reduces XSS attack surface
-->

---

# Protected Routes (Frontend)

## Why Protected Routes?

**Without protection:**

- User tries to access `/expenses/new`
- Page loads, makes API call
- API returns 401 Unauthorized error
- User sees cryptic error message 😕

---

**With protection:**

- User tries to access `/expenses/new`
- Route checks authentication
- Immediately redirects to `/login`
- Clear user experience ✅

<!--
Speaker Notes:
• Frontend protection is UX, not security
• Real security happens on backend
• Protected routes improve user experience
• Redirect before loading page components
• Prevents loading data for unauthenticated users
• Clearer flow for users
-->

---

# Implementing Protected Routes

```typescript
import { Navigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

---

**Usage:**

```typescript
const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { path: 'expenses', element: <ExpenseList /> },
      { path: 'expenses/new', element: <NewExpense /> },
    ],
  },
]);
```

<!--
Speaker Notes:
• Simple component that checks authentication
• Wraps protected pages/layouts
• Navigate with replace prevents back button issues
• All nested routes inherit protection
• Clean, declarative route structure
• useAuth hook accesses authentication context
-->

---

# Protected Routes Benefits

✅ **Better UX**

- Clear redirect flow
- No loading spinners for failed auth

✅ **Performance**

- Don't load components unnecessarily
- Don't fetch data for unauthenticated users

✅ **Clarity**

- Easy to see which routes are protected
- Centralized authentication logic

❗ **Remember:** This is UX, not security! (why?)

<!--
Speaker Notes:
• Frontend protection about user experience
• Backend protection about actual security
• Can't rely on client-side checks alone
• Attackers can bypass frontend entirely
• Always authenticate and authorize on backend
• Frontend routes just provide nice UX
-->

---

# Custom Error Classes

## The Problem with Generic Errors

```typescript
throw new Error('User not found');
throw new Error('Invalid password');
throw new Error('Permission denied');
```

**Issues:**

- No structured information
- How should frontend handle these?
- What HTTP status code?
- How to filter in logs?
- No type safety

<!--
Speaker Notes:
• Generic Error class lacks semantic meaning
• All errors look the same
• Hard to handle different errors differently
• No standard for status codes
• Difficult to log and monitor effectively
-->

---

# Custom Error Implementation

```typescript
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
...
```

<!--
Speaker Notes:
• Base AppError class with common properties
• Specific error classes for different scenarios
• Each error has appropriate HTTP status code
• Code property for programmatic error handling
• captureStackTrace preserves error origin
• Easy to add new error types
• TypeScript provides type safety
-->

---

# Benefits of Custom Errors

✅ **Type Safety**

```typescript
if (error instanceof AuthenticationError) {
  redirectToLogin();
}
```

✅ **Consistent Status Codes**

```typescript
throw new NotFoundError('Expense not found');
// Automatically sets statusCode: 404
```

---

✅ **Better Error Messages**

```typescript
throw new ValidationError('Email must be valid');
// Code: VALIDATION_ERROR, clear to both devs and users
```

✅ **Easier Logging & Monitoring**

```typescript
if (error instanceof AppError) {
  logger.warn(error.code, error.message);
} else {
  logger.error('Unexpected error', error);
}
```

<!--
Speaker Notes:
• Type checking enables smart error handling
• No manual status code management
• Clear error categories
• Easy to filter and search logs
• Monitoring tools can group by error type
• Better debugging experience
• Consistent error handling across application
-->

---

# Using Custom Errors

```typescript
// In service layer
export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    throw new AuthenticationError('Invalid email or password');
  }
```

// Generate token...
}

---

```typescript
// In GraphQL resolver
export function requireAuth(context: GraphQLContext) {
  if (!context.user) {
    throw new AuthenticationError('You must be logged in');
  }
  return context.user;
}
```

<!--
Speaker Notes:
• Throw specific error types in business logic
• Clear intent from error class name
• Consistent error codes across application
• Frontend can distinguish error types
• Better logging and monitoring
• Easier to write error handling middleware
-->

---

# Error Formatter (GraphQL)

```typescript
export function formatError(error: GraphQLError): GraphQLFormattedError {
  const originalError = error.originalError;

  // Handle our custom AppErrors
  if (originalError instanceof AppError) {
    return {
      message: originalError.message,
      extensions: {
        code: originalError.code,
        statusCode: originalError.statusCode,
      },
    };
  }

```

---

```typescript

  // Handle Prisma errors
  if (originalError?.name === 'PrismaClientKnownRequestError') {
    const prismaError = originalError as any;
    if (prismaError.code === 'P2002') {
      return {
        message: 'A record with this unique field already exists',
        extensions: { code: 'CONFLICT', statusCode: 409 },
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

  return { message: error.message };
}
```

<!--
Speaker Notes:
• Converts all errors to consistent format
• Extracts error codes and status codes
• Handles Prisma database errors
• Hides implementation details in production
• Provides useful error info in development
• Integrated with Apollo Server
• Single place to control error responses
-->

---

# Frontend Error Handling

```typescript
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApolloError) {
    if (error.graphQLErrors.length > 0) {
      return error.graphQLErrors[0].message;
    }
    if (error.networkError) {
      return 'Network error. Please check your connection.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

export function displayError(error: unknown): void {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);

  if (code === 'UNAUTHENTICATED') {
    toast.error('Please log in to continue');
  } else if (code === 'FORBIDDEN') {
    toast.error("You don't have permission");
  } else {
    toast.error(message);
  }
}
```

<!--
Speaker Notes:
• Utility functions for consistent error handling
• Extracts user-friendly messages
• Special handling for different error codes
• Uses toast notifications for better UX
• Centralized error display logic
• Easy to customize error presentation
• Type-safe with unknown type
-->

---

# Error Boundaries (React)

```tsx
export default class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h1>Something went wrong</h1>
          <button onClick={() => window.location.reload()}>Refresh Page</button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Catches errors in component tree and prevents app crash**

<!--
Speaker Notes:
• Error boundaries catch React component errors
• Prevents entire app from crashing
• Shows fallback UI instead
• Can log errors to monitoring service
• Class component required - no hook alternative yet
• Place at strategic points in component tree
• User can recover without losing all work
-->

---

# Security Layers Summary

| Layer                | Purpose          | Protection                                             |
| -------------------- | ---------------- | ------------------------------------------------------ |
| **JWT**              | Authentication   | Identifies users securely                              |
| **GraphQL Context**  | Auth propagation | Makes auth info available to resolvers                 |
| **Authorization**    | Access control   | Ensures users can only access their data               |
| **Helmet**           | HTTP headers     | Protects against web attacks (XSS, clickjacking, etc.) |
| **Protected Routes** | UX               | Redirects unauthenticated users                        |
| **Custom Errors**    | Error handling   | Consistent, clear error messages                       |
| **Input Validation** | Data quality     | Prevents bad/malicious data                            |

**Defense in depth:** Multiple layers protect your application!

<!--
Speaker Notes:
• Each layer addresses different security concerns
• If one layer fails, others provide backup
• Defense in depth is security best practice
• Never rely on single security measure
• Frontend and backend security work together
• Comprehensive security requires all layers
-->

---

# Common Security Mistakes

❌ **Storing passwords in plain text**
→ Use bcrypt with salt rounds

❌ **Trusting frontend validation only**
→ Always validate on backend too

❌ **Not using HTTPS in production**
→ Tokens and passwords sent in clear text

❌ **Weak JWT secrets**
→ Use long, random secrets

❌ **No token expiration**
→ Tokens should expire (7 days max)

❌ **Exposing stack traces in production**
→ Use error formatters

<!--
Speaker Notes:
• These are common mistakes we must avoid
• Frontend validation is UX, not security
• HTTPS absolutely required for production
• Weak secrets can be brute forced
• Long-lived tokens increase risk if compromised
• Stack traces reveal implementation details
• Always assume attackers have technical knowledge
-->

---

# Security Best Practices

✅ **Hash passwords with bcrypt**
→ Never store plain text passwords

✅ **Validate on both frontend and backend**
→ Frontend for UX, backend for security

✅ **Use environment variables for secrets**
→ Never commit secrets to git

✅ **Implement rate limiting**
→ Prevent brute force attacks

✅ **Keep dependencies updated**
→ Security patches in package updates

✅ **Use HTTPS everywhere**
→ Encrypt all traffic

✅ **Log security events**
→ Monitor for suspicious activity

<!--
Speaker Notes:
• bcrypt automatically handles salt and hashing
• Backend validation is security boundary
• .env files keep secrets out of code
• Rate limiting prevents automated attacks
• npm audit finds known vulnerabilities
• HTTPS isn't just for production anymore
• Logging helps detect and respond to attacks
-->

---

# Key Takeaways

1. **JWT provides stateless authentication** - Server doesn't store sessions
2. **GraphQL context makes auth available everywhere** - No prop drilling
3. **Helmet protects against common attacks** - One line of code, huge impact
4. **Protected routes improve UX** - Frontend prevention, not security
5. **Custom errors provide structure** - Consistent handling across app
6. **Defense in depth** - Multiple layers of security
7. **Always validate on backend** - Frontend validation is just UX

**Security is not optional - it's foundational!**

<!--
Speaker Notes:
• These concepts work together to create secure application
• Each piece addresses specific security concern
• Don't skip security - add it from the start
• Harder to add security later than build it in
• These patterns are industry standard
• Understanding security makes you better developer
-->

---
