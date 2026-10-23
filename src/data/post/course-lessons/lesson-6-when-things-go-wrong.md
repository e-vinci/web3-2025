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

Over five lessons we have built an application that works. It also asks nobody who they are.

Anyone can read every expense. Anyone can create an expense in your name. You will see that for
yourself in Exercise 0, with one command and no browser — and your deployed app on Render is
answering that same command right now.

This week we close it, in two halves that are easy to confuse:

**Authentication** asks *who are you?* You show a password once, and get a token back.
**Authorization** asks *may you do this?* That question is asked again on every single request.

A server can be completely sure who you are and still be wrong about what you may do. People
shorten both words to "auth". Keep them apart.

## Objectives

By the end of this lesson you can:

- **Store a password so that nobody can read it back** — not an attacker, not you — and say why a
  hash is not encryption.
- **Hand out a signed token when somebody logs in, and check it on every later request**, and say
  which part of that token you trust and why.
- **Point at the one place in a GraphQL server that answers "who is calling?"**, and write it.
- **Stop a user from acting as somebody else**, by checking in the resolver — and say why the same
  check in the browser is worth nothing.
- **Say in your schema whose data a query returns**, and explain why `expenses` and
  `me { expenses }` are different questions.
- **Send a token from one single place in the frontend**, because lesson 5 left you exactly one
  place to put it.

If you can do those six things on Friday without looking anything up, the lesson worked. The fourth
is the one that matters most: everything else exists to make it possible.

## If you fall behind

Exercises 1 to 6 are the lesson. They move the decision "who are you, and may you do this?" out of
the browser, where anyone can lie, and onto the server, where nobody can. Do not trade them away.

Two things are safe to postpone. **The look of the login page** — it is a form with two fields, and
you wrote harder forms in lesson 3. And **the optional challenges**, which sit after the summary for
exactly that reason.

One thing is not: **Exercise 0**. It takes ten minutes, and it is the only place in the lesson where
you see the hole with your own eyes instead of being told about it.

---

## Recommended Reading

Read the first two before you start. The others are references to come back to during the exercises.

1. [Full Stack Open – Part 4d: Token authentication](https://fullstackopen.com/en/part4/token_authentication)
   – the same idea as Exercises 1 to 4, explained more slowly, in Express without GraphQL. Read it if
   the token flow does not click.
2. [JWT – Introduction](https://jwt.io/introduction) – what is actually inside a token. Paste one of
   your own into the debugger on that page and read it.
3. [OWASP Top Ten](https://owasp.org/www-project-top-ten/) – the industry's list of what actually
   goes wrong. Read *Broken Access Control* and *Identification and Authentication Failures*; they
   are numbers one and seven, and this lesson is about both.
4. [GraphQL Yoga – Error Masking](https://the-guild.dev/graphql/yoga-server/docs/features/error-masking)
   – how a resolver error becomes a response, and what it hides.
5. [Helmet](https://helmet.js.org/) – a reference for Exercise 11, not homework.

---

## Exercises

> **Starting Point:** These exercises build upon the code from Lesson 5. You should have a working Express backend with GraphQL and a React frontend. If you haven't completed Lesson 5, you can use the code in `exercises/lesson-5-router-graphql/` as your starting point.

### 0. Post an expense as somebody else (~10 min)

**Goal:** see the hole before you fix it. No new code in this exercise — only your lesson 5 app, as
you left it.

1. Start your backend and your frontend. Open `/expenses/new`.

2. **Lie with the form.** The add form has a *Payer* dropdown, filled from `useUsers()`. Pick a user
   who is not you. Any user. Fill in `Coffee`, `4.50`, today's date. Submit.

   Go to `/expenses`. It is there, with that person's name on it.

   Nothing broke, because nothing was ever checked. The server was told who paid, by the browser,
   and it believed the browser. You might now think: *fine, I will take the dropdown out.* Step 3 is
   why that does not help.

3. **Lie without the form.** Close the browser — the frontend is not involved in what follows. Open
   a terminal and send this straight to your GraphQL endpoint. Change `payerId` to any user id that
   is not yours:

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createExpense(input: { description: \"Dinner for the whole team\", amount: 900, date: \"2026-10-22\", payerId: 2, participants: [1,2] }) { id description } }"}'
```

> **&#10067; Predict first.** Before you press enter, write down one word: does this succeed, or is
> it refused? And if you think it is refused — by what? Name the line of code that refuses it.

   It succeeds:

```json
{"data":{"createExpense":{"id":7,"description":"Dinner for the whole team"}}}
```

   Reload `/expenses` and read the row. You have just put a 900&nbsp;€ dinner on somebody else's
   name, from a terminal, with no account, no password, and no browser.

4. **Read the whole story.** Now ask your server for everything it will tell a stranger:

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ users { id name email bankAccount } }"}'
```

   Every user, every email address, every bank account you seeded. To anyone who knows the URL.

5. **Write down what you learned, in your own words.** Three questions, and the third is the one
   that matters:

   - In step 2 the browser sent `payerId`. **Where did that number come from, and why did the server
     believe it?**
   - Step 3 used no browser at all. **So what would removing the dropdown have fixed?**
   - Your deployed app on Render is answering that same `curl` right now. **Who is stopping it?**

> **&#9888; From the trenches:** every control in a frontend is a *suggestion*. A dropdown, a
> disabled button, a hidden menu item — all of them are things you **ask** the browser to do, and the
> browser belongs to the user, not to you. The whole rest of this lesson lives on the other side of
> the network, because that is the only side you own. When you read "the frontend validates it",
> hear "the frontend validates it **for honest people**".

   Keep that terminal open. You will run the same `curl` again at the end of Exercise 5, and it will
   come back refused.

---

### 1. Set up, and declare the new column (~15 min)

**Goal:** install what the lesson needs, and tell the contract that a user has a password hash.

1. Install required packages:
```bash
npm install bcrypt jsonwebtoken
npm install --save-dev @types/bcrypt @types/jsonwebtoken
```

2. Add JWT secret to your environment variables in `.env` and add the same key with a different value on Render:
```dotenv
JWT_SECRET=your-super-secret-key-change-this-in-production
```

3. Add **one line** to the `User` model in `backend/src/prisma/contract.prisma`. 

```prisma
  passwordHash String
```

   The name says what the column holds. We never store a password, so a column called `password` would be a lie, the kind of lie that makes somebody write `user.password` one day and mean it.

---

### 2. Migrate a table that already has rows (~25 min)

**Goal:** add a NOT NULL column to four rows that have no value for it — and find out why that is three steps, not one.

1. Emit the contract and plan the migration. Same two commands as lesson 3 — nothing new here:

```bash
# from backend/
npx prisma contract emit
npx prisma migration plan --name add_user_password_hash
```

   Read what the planner tells you:

```
Planned migration with placeholder(s) — edit migration.ts then run `node migration.ts` to self-emit
```

   **That is not an error. It is a mandatory task.** Open the file it just wrote,
   `migrations/app/<timestamp>_add_user_password_hash/migration.ts`, and you will find three
   operations and two holes:

```ts
this.addColumn({ /* passwordHash, nullable */ }),
this.dataTransform(endContract, 'backfill-user-passwordHash', {
  check: () => placeholder('backfill-user-passwordHash:check'),
  run:   () => placeholder('backfill-user-passwordHash:run'),
}),
this.setNotNull({ schema: 'public', table: 'user', column: 'passwordHash' }),
```

> **&#9888; You cannot add a NOT NULL column to a table that already has rows.** There are four users
> in your database and none of them has a password hash. PostgreSQL will not invent one, so the planner splits the change into the only three steps that can work: 
> **add the column empty, fill it, then lock it down.** 
> That middle step is yours to write.
>
> Expect this every time you add a required column to a table with data in it.

2. Fill the two holes. Replace the whole `migration.ts` the planner wrote with this — the operations
   are unchanged, only the two `placeholder(...)` arrows become real queries:

```ts
#!/usr/bin/env -S node
// ...keep the import lines the planner generated, and add this one:
import postgres from '@prisma/orm-postgres/runtime';

const { sql: db, contract } = postgres<End>({ contractJson: endContract });

// The bcrypt hash of "topsecret". Use any tool to get it, for example: https://bcrypt-generator.com
const DEMO_PASSWORD_HASH = '$2b$10$Uz3U4mBwsgUKte9bQKBNX.5LGJjYw1Z9Qvhxzy4gxdZrahpUU9/N2';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      // ... this.addColumn, unchanged
      this.dataTransform(contract, 'backfill-user-passwordHash', {
        // "which rows still need work?" — the runner asks this before, to see
        // if there is anything to do, and after, to confirm there is not.
        check: () =>
          db.public.user.select('id').where((f, fns) => fns.eq(f.passwordHash, null)).limit(1),
        run: () =>
          db.public.user
            .update({ passwordHash: DEMO_PASSWORD_HASH })
            .where((f, fns) => fns.eq(f.passwordHash, null)),
      }),
      // ... this.setNotNull, unchanged
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
```

> **&#9888; In a real project, things would be different.** 
> 
> We are giving all four demo users the same known password, `topsecret`, because this is a course and we only need demo data.
>
> In a real product you would write an **unguessable random value** into that column, a different one for every row. 
> The column ends up full, so the constraint can go on, and **no account is reachable**,
> because nobody — including you — knows a password that hashes to it. 
> Every existing user is then pushed through "forgot my password" to choose a real one.


3. Self-emit the package, then apply it:

```bash
# from backend/
node migrations/app/<timestamp>_add_user_password_hash/migration.ts
npx prisma db migrate --advance-ref db
```

   Check your work: `passwordHash` should be `not null`, and every existing user should have the
   same value in it.

4. Your seed script no longer compiles — `scripts/db-populate.ts` creates users without a
   `passwordHash`, and that field is now required. Give the demo users the same password the
   migration used, and hash it at seed time rather than pasting the hash again:

```ts
import bcrypt from 'bcrypt';

const DEMO_PASSWORD = 'topsecret';

// ...then, where the users are created:
const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
await db.orm.public.User.createAll(users.map((user) => ({ ...user, passwordHash })));
```

   From here on you can log in as any demo user — `john.doe@example.com` / `topsecret` — and this will enable us to continue with user permissions and scoped resources.

---

### 3. Register and log in (~25 min)

**Goal:** two routes. One creates an account and stores the password safely. One checks a password and gives back a token.

1. Create `src/types/auth.ts`. It holds what a client may send, what we send back, what goes
   *inside* a token, and the one value both halves of authentication need:

```ts
import { z } from 'zod';

// Same shape as `types/expense.ts`: a schema, the inferred type, and a
// `parseX()` that returns the parsed value or `false`.
export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  // Length is the only password rule that evidence consistently supports.
  // "One uppercase, one symbol" is not.
  password: z.string().min(8).max(200),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

function parseWithSchema<T>(schema: z.ZodType<T>, data: unknown): T | false {
  const result = schema.safeParse(data);
  return result.success ? result.data : false;
}

export function parseRegisterInput(data: unknown): RegisterInput | false {
  return parseWithSchema(registerSchema, data);
}

export function parseLoginInput(data: unknown): LoginInput | false {
  return parseWithSchema(loginSchema, data);
}

/** What we put *inside* a token, and therefore what comes back out of one. */
export interface UserJWT {
  userId: number;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

/**
 * The secret every token is signed with — and checked against.
 *
 * It lives here because two different files need it: step 10 signs tokens with
 * it, and the service verifies them with it. Written down once, so the two can
 * never disagree.
 */
export const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use';
```

> **&#10067; Why `UserJWT` and not `User`?** Because it is not a user. It is the handful of claims
> the server signed — no name, no bank account, nothing the database holds. The field is `userId`
> rather than `id` for the same reason: so that the two can never be confused at a call site.
> `userJWT.userId` is a claim that came out of a token. `user.id` is a row that came out of the
> database. One you were told; the other you looked up.

> **&#9888; That fallback is not a default you keep.** A server signing tokens with a value printed
> in a public lesson is a server anyone can mint a token for — including one that says
> `userId: 1`. Put a real secret in your `.env`, and a **different** one in Render's environment
> variables.

2. Create `src/services/auth.service.ts`. `register` is given in full; **`login` you write
   yourself** — it is `register` read backwards, and only one call in it is new to you.
```ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../prisma/db.ts';
import { userFromDBO } from '../types/user.ts';
import { JWT_SECRET } from '../types/auth.ts';
import type { LoginInput, RegisterInput } from '../types/auth.ts';
import type { User } from '../types/user.ts';

const SALT_ROUNDS = 10;

export class AuthService {
  static async register(input: RegisterInput): Promise<User> {
    // Check if user already exists
    const existingUser = await db.orm.public.User.where({ email: input.email }).first();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash the password. `bcrypt.hash` is deliberately slow — that is the whole
    // point of it. The plain password never leaves this function.
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create user
    const userDbo = await db.orm.public.User.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });
    const user =  userFromDBO(userDbo);
    return user;
  }

  static async login(input: LoginInput): Promise<User> {
    // 1. find the user by email
    // 2. no such user -> throw (read the warning below before choosing the message)
    // 3. compare input.password with the stored hash:
    //    await bcrypt.compare(plain, hash) resolves to a boolean
    // 4. no match -> throw, with the SAME message as step 2
    // 5. return userFromDBO(...)
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

> **&#9888; Steps 2 and 4 must give the same message.** "No such user" and "wrong password" are two
> different facts. If your error messages let them be told apart, anyone can type an email into your
> login form and learn whether that person has an account. Say `Invalid email or password` for both.
> Being vaguer than you could be is the whole point.

> **&#10067; Before you move on.** `register` throws when the email **already exists**. `login`
> throws when it **does not**. Why is only one of those safe to say out loud?


3. Create a function `authResponseFromUser` in `types/auth.ts` for easily mapping a user into an
    `AuthResponse`. This is where the JWT is created.

```ts
// src/types/auth.ts — add to the file you wrote in step 8
import jwt from 'jsonwebtoken';
import type { User } from './user.ts';

// How long a token stays valid. After this the server stops accepting it.
const TOKEN_LIFETIME = '7d';

export function authResponseFromUser(user: User): AuthResponse {
  // The payload is readable by anyone holding the token — it is signed, not
  // hidden. Put in it only what the server needs to recognise the caller again.
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_LIFETIME,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  };
}
```

> **&#9888; Look at what the mapper does *not* copy.** A `User` has a `bankAccount`. Logging in is
> not a reason to hand it over, so it is not in the response. This is only true because the mapper lists its fields one by one. Write
> `user: { ...user }` instead and the bank account goes out with it — **and so does every field you
> add to `User` next month**.


4. Create REST endpoints for auth in `src/routes/auth.router.ts`:
```ts
import { Router, type Request, type Response } from 'express';
import { AuthService } from '../services/auth.service.ts';
import { authResponseFromUser, parseLoginInput, parseRegisterInput } from '../types/auth.ts';
import type { AuthResponse } from '../types/auth.ts';

const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const input = parseRegisterInput(req.body);
    if (input === false) {
      return res.status(400).json({ error: 'Invalid registration details' });
    }

    const user = await AuthService.register(input);
    const authResponse: AuthResponse = authResponseFromUser(user);
    res.status(201).json(authResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(409).json({ error: message });
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const input = parseLoginInput(req.body);
    if (input === false) {
      // Deliberately not "that email is not valid": a login endpoint should not
      // explain to a stranger which half of their guess was wrong.
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = await AuthService.login(input);
    const authResponse: AuthResponse = authResponseFromUser(user);
    res.status(200).json(authResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});

export default authRouter;
```

5. Register the auth router in `app.ts`:

```ts
import authRouter from './src/routes/auth.router.ts';
// ...
app.use('/api/auth', authRouter);
```

6. Test your API with an `auth.http` file

Create a new user route test and a login route test.

---

### 4. Who is calling? The GraphQL context (~20 min)

**Goal:** read the token on every GraphQL request and check that it is real. Every resolver will then know which user is asking.

1. Create `src/types/GraphQLContext.ts`. It holds one type, and nothing else:

```ts
import type { UserJWT } from './auth.ts';

export interface GraphQLContext {
  userJWT?: UserJWT;
}
```

> **&#9888; `userJWT` is optional, and that is deliberate.** A request with no token is not an error  at this layer. The context answers one question — "who is asking?" — and "nobody" is a valid answer. Whether nobody is good enough is each resolver's decision.

2. Create `src/graphql/yoga.ts` for the GraphQL server itself. Until now it has been built inline in
   `app.ts`; move it out, so `app.ts` goes back to being a readable list of what this server exposes.
   The function that turns a request into a context goes here too:

```ts
import { createYoga } from 'graphql-yoga';

import { schema } from './schema.ts';
import { AuthService } from '../services/auth.service.ts';
import type { GraphQLContext } from '../types/GraphQLContext.ts';

function graphQLContextFromRequest(request: Request): GraphQLContext {
  // Yoga speaks the Web `Request` API, so headers are read with
  // `request.headers.get(...)` — not Node's `req.headers` object.
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

  if (!token) {
    return {};
  }

  try {
    const jwt = AuthService.verifyToken(token);
    return { userJWT:  jwt };
  } catch {
    // A bad or expired token is not a crash. The request carries on as
    // anonymous, and the resolvers refuse it a moment later.
    return {};
  }
}

export const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  cors: false,
  maskedErrors: process.env.NODE_ENV === 'production',
  context: ({ request }): GraphQLContext => graphQLContextFromRequest(request),
});
```

   In `app.ts`, delete the whole `createYoga({ ... })` block and import it instead:

```ts
import { yoga } from './src/graphql/yoga.ts';
// ...
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

   That one word is enough to make TypeScript aware of `ctx.userJWT` inside every resolver.

4. You have just written fifteen minutes of code that changes **nothing you can see**. Every query
   still answers exactly what it answered before, with a token or without one. So before going
   further, add the smallest possible resolver that reads the context — one field, no arguments,
   no database filter:

```graphql
    type Query {
      me: User
      # ...the rest, unchanged
    }
```

```ts
    Query: {
      me: (_parent, _args, ctx) =>
        ctx.userJWT ? UsersService.getById(ctx.userJWT.userId) : null,
      // ...the rest, unchanged
    },
```

5. Now test it. Log in to get a token, open GraphiQL, and run:

```graphql
{
  me {
    id
    name
    email
  }
}
```

   With no token you should get `{ "data": { "me": null } }`. Then open GraphiQL's **Headers** tab,
   add your token, and run it again:

```json
{ "Authorization": "Bearer YOUR_JWT_TOKEN_HERE" }
```

```json
{ "data": { "me": { "id": 1, "name": "John Doe", "email": "john.doe@example.com" } } }
```

> **&#10067; Why build this before the guards?** Because otherwise you cannot tell a working context
> from a broken one. 
> 
> `me` is the only query whose answer comes entirely out of the context. That splits your debugging
> in half for the rest of the morning. **If `me` is `null` while you are sending a token, the bug is
> in the context function — not in a resolver.**
> Reach for it every time something refuses you and you do not know why.
>
> `me` is also a real convention, not a debugging toy. GitHub's API calls it `viewer`; many others call it `me` or `my`. 
> It is how a client asks "and who am I?" or "What are my resources?"

---

### 5. Guard the resolvers (~30 min)

**Goal:** a user may create an expense only if they paid for it, and may open one only if they are involved in it.

1. **Write this one yourself.** It is four lines, and it is the most-used function in the lesson —
   every guarded resolver starts with it. Create `src/graphql/authHelpers.ts`:

```ts
import { GraphQLError } from 'graphql';
import type { UserJWT } from '../types/auth.ts';
import type { GraphQLContext } from '../types/GraphQLContext.ts';

export function requireAuth(context: GraphQLContext): UserJWT {
  // 1. no userJWT on the context? throw a GraphQLError with
  //    extensions: { code: 'UNAUTHENTICATED' }
  // 2. otherwise return the claims
}
```

> **&#10067; Why does it return the claims instead of `true`/`false`?** Look at the shape of the
> callers you are about to write: every one of them needs the caller's id on the very next line. A
> function that answers "yes" forces each caller to then reach into the context again — and a caller
> that forgets the check still compiles. Returning `UserJWT` makes the check the *only* way to get
> the id. Say that out loud before you write it; it is a pattern you will reuse for years.

2. Update `src/graphql/schema.ts` to add authorization checks to the resolvers:
```ts
// ... other imports
import { requireAuth } from './authHelpers.ts';

// ...
export const schema = createSchema<GraphQLContext>({
  // ... typedefs, unchanged
  resolvers: {
    // ... Expense and User resolvers, unchanged
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
          expense.payer?.id === user.userId ||
          expense.participants.some(p => p.id === user.userId);

        if (!isInvolved) {
          throw new GraphQLError("You don't have permission to view this expense", {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        return expense;
      },

      // Same question, same answer. `users` hands out names, emails and bank
      // accounts; `categories` is harmless, but a stranger has no business
      // enumerating either.
      users: (_parent, _args, ctx) => {
        requireAuth(ctx);
        return UsersService.getUsers();
      },
      categories: (_parent, _args, ctx) => {
        requireAuth(ctx);
        return CategoriesService.getCategories();
      },
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
   - Query an expense with no `Authorization` header → `UNAUTHENTICATED`
   - Create an expense with a `payerId` that is not yours → `FORBIDDEN`
   - Do both with your own token → both work

4. Now run Exercise 0's second command again — the one that asked for every bank account:

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ users { id name email bankAccount } }"}'
```

   Refused. But try the REST route next door, and it is not:

```bash
curl http://localhost:3000/api/users
```

> **&#9888; You guarded the resolvers. You did not guard the server.** GraphQL is one way into your
> services; the REST routes you wrote in lessons 1 to 4 are another, and they are still wide open.
> Both doors lead to the same `UsersService`. A permission that lives on only one of them is not a
> permission.

5. Guard the REST routes too. This is Express middleware rather than a check inside each handler,
   because every route below it needs the same answer — including the ones you add next year.
   Create `src/middleware/requireAuth.ts`:

```ts
import type { NextFunction, Request, Response } from 'express';

import { AuthService } from '../services/auth.service.ts';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';

  if (!token) {
    return res.status(401).json({ error: 'You must be logged in' });
  }

  try {
    AuthService.verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

   Mount it in `app.ts`, on everything except the routes that hand out tokens:

```ts
import { requireAuth } from './src/middleware/requireAuth.ts';

// `/api/auth` is deliberately open — it is where tokens come from.
app.use('/api/auth', authRouter);

app.use('/api/expenses', requireAuth, expensesRouter);
app.use('/api/users', requireAuth, usersRouter);
app.use('/api/categories', requireAuth, categoriesRouter);
```

   Re-run both commands. `curl http://localhost:3000/api/users` now answers `401`, and so does the
   GraphQL query. **That is the second half of Exercise 0 closed.**

> **&#10067; Two guards, one rule.** You have now written the same check twice — once as
> `requireAuth(ctx)` for resolvers, once as Express middleware for routes. They cannot share code:
> one receives a GraphQL context, the other a `Request`, and they refuse in different ways (a thrown
> `GraphQLError` versus a `res.status(401)`). What they share is the *decision*, and that lives in
> `AuthService.verifyToken` — which is why both call it. **The transport differs; the rule does
> not.** That is the same lesson as `parseNewExpense` in lesson 5, arriving from the other side.

---

### 6. Whose expenses? Scope with `me` (~25 min)

**Goal:** say in the schema **whose** data a query returns — and find out why that is a naming problem, not a resolver problem.

1. Now look at the `expenses` query you just guarded, and count. Log in as `john.doe@example.com`
   and run `{ expenses { id description } }`. Then log in as `jane.doe@example.com` and run it
   again. **Same list.** Being logged in is not the same as being allowed.

   That is not a bug in your resolver. It is a **naming** problem, and it is worth fixing properly
   because every GraphQL API you write will have it.

> **&#10067; Whose expenses does `expenses` return?** Read the name. `expenses` says *the expenses* —
> all of them, belonging to anybody. That is a perfectly reasonable thing for an API to offer: an
> accountant, an admin screen or a monthly report all need it. What it needs is a **permission**, and
> deciding who holds that permission is beyond this lesson. We leave it open, and we leave the name honest.
>
> What the list screen wants is a different question: *my* expenses. So ask a different question.

2. The GraphQL convention for "the data of whoever is asking" is to hang it off the current user.
   You already have `me` from Exercise 4 — give it an `expenses` field:

```graphql
    type User {
      id: Int!
      name: String!
      email: String!
      bankAccount: String

      # The expenses this user paid for or took part in.
      expenses(filter: ExpenseFilter): [Expense!]!
    }
```

   Now the two questions read differently, and you can tell them apart at a glance:

```graphql
{ expenses { id } }              # every expense in the system
{ me { expenses { id } } }       # the expenses of whoever is asking
```

> **&#10067; Stop and look at what you just declared.** Open `src/types/user.ts` and read the `User`
> your application actually has:
>
> ```ts
> { id, name, email, bankAccount }
> ```
>
> There is no `expenses` on it. There is no `expenses` column on the `user` table either. You have
> just added a field to the schema that **does not exist on the thing behind it**.
>
> That is allowed, and it is not a trick. A GraphQL type is not a picture of a row. A field is a
> *question the client may ask about this thing*, and the server answers it however it likes — by
> reading a column, by running another query, by calling a different service, by calculating. The
> next step writes the function that answers this one.
>
> You have written a **field resolver** before: `Expense.date` in lesson 5, which turned a `Date`
> into a string. This one is a different kind. `date` *reshaped* a field that was already there;
> `expenses` **invents** one.
>
> **This is the moment the "graph" in GraphQL stops being a brand name.** Your schema is not a list of tables. It is a set of **nodes** joined by **edges**, and a
> field like this one *is* an edge. Look at what you can now walk:
>
> ```graphql
> {
>   me {                      # a User
>     expenses {              # ...to the Expenses it is connected to
>       payer {               # ...and from each one, back to a User
>         name
>       }
>     }
>   }
> }
> ```
>
> `User → Expense → User`. You went round a loop, in one request, without a single new endpoint —
> because you did not ask for *resources*, you asked for a **path through a graph**. REST cannot do
> that: `/users/me/expenses/payers` would have to be a route somebody wrote on purpose.
>
> Two things follow from this, and they are worth carrying into every GraphQL API you write.
> **The schema is an API design, not a database dump** — you choose what to expose and what to call
> it, and nothing forces it to look like your tables. And **every edge costs something**: each hop
> is a function somebody has to run, once per node it is asked about. That is the N+1 problem from
> lesson 5's first optional challenge, and adding edges is how you buy it.

> **&#10067; Why `me` and not `my`?** Both conventions exist. `myExpenses` reads naturally in English,
> but it forces a new top-level field for every resource you scope — `myExpenses`, `myTransfers`,
> `myCategories` — and the schema fills up with near-duplicates. Hanging everything off one `me`
> gives you **one place** that means "the current user", and every scoped field lives under it.
> That is why GitHub's API has `viewer { repositories }` rather than `myRepositories`.

3. First the service method: the expenses a user is involved in, as payer **or** as participant.
   That is an `or` across a plain column and a relation, so here is the shape — the ORM syntax is
   not the point of this exercise:

```ts
// backend/src/services/expenses.service.ts
public static async getExpensesOfUser(
  userId: number,
  filter: ExpenseFilter = {}
): Promise<Expense[]> {
  const all = await ExpensesService.getExpenses(filter);
  return all.filter(
    (expense) =>
      expense.payerId === userId ||
      expense.participants.some((participant) => participant.id === userId)
  );
}
```

> **&#10067; Why filter in JavaScript instead of in the query?** Because it is honest about what it
> costs. This reads every expense and throws most of them away — fine for a demo database, wrong for
> a real one. Doing it properly means an `or(...)` across a scalar column and a `.some(...)`
> relation predicate, which is a database lesson rather than a security one. Note the debt and move
> on; you will meet it again the first time a table gets big.

4. Now the resolver. It is a **field resolver on `User`**, so its first argument is the user it is
   being asked about:

```ts
    User: {
      expenses: (user, args, ctx) => {
        requireAuth(ctx);
        return ExpensesService.getExpensesOfUser(user.id, args.filter ?? {});
      },
    },
```

   Restart, log in, and check `{ me { expenses { id description } } }` returns your own expenses.

5. **Now predict, then run.** `me` is not the only way to reach a `User`. So is `expense.payer`. So
   is `users`. Write down what you expect this to return, then run it:

```graphql
{ expenses { payer { name expenses { id description amount } } } }
```

   It hands you **every other user's entire expense history**. Your resolver checked that *somebody*
   is logged in; it never checked that the `User` being asked about is *you*.

6. Fix it. One line, at the top of the field resolver:

```ts
      expenses: (user, args, ctx) => {
        const current = requireAuth(ctx);
        // ...refuse unless user.id is the caller's own id
        return ExpensesService.getExpensesOfUser(user.id, args.filter ?? {});
      },
```

   Throw a `GraphQLError` with `extensions: { code: 'FORBIDDEN' }`. Re-run the query above; it
   should now be refused. (In Exercise 7 you will replace that throw with a named error class.)

> **&#9888; This is the idea to carry out of the lesson.** **A field is reachable by every path that
> leads to its type**, not only the path you had in mind when you wrote it. `expenses` is a field on
> `User`, and *every* route to a `User` can ask for it. That is why the permission lives on the
> **field**, not on the query you expected it to be used from.

7. Point the list page at the new query. In `ExpenseList.loader.ts`, wrap the selection in `me`:

```graphql
  query MyExpenses($filter: ExpenseFilter) {
    me {
      expenses(filter: $filter) {
        id
        description
        amount
        date
        payer { name }
        category { name colour }
      }
    }
  }
```

   and read the result like this, rather than `data.me?.expenses ?? []`:

```ts
  // `me` answers null for an anonymous caller — and a caller whose token no
  // longer verifies *is* anonymous, as far as the server is concerned.
  if (!data.me) {
    clearToken();
    throw redirect('/login');
  }

  return data.me.expenses;
```

> **&#9888; `?? []` would have been a bug.** It turns "your token is no longer valid" into "you have
> no expenses" — the same empty screen, with no way to tell the two apart. Swallowing a null is how
> an app ends up silently logged out.

   Log in as two different users and compare the lists. They should finally differ — and the page
   title, "Your expenses", is finally telling the truth.

---

### 7. Errors that know their own status (~15 min)

**Goal:** make an error carry its own HTTP status code. Right now every route has to guess whether a failure is a 400, a 401 or a 500.

1. Create `src/errors/app.error.ts`:
```ts
export class AppError extends Error {
  public statusCode = 500;
  public code = 'INTERNAL_SERVER_ERROR';
  constructor(
    message: string,
     statusCode: number = 500,
     code: string = 'INTERNAL_SERVER_ERROR'
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
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
import { AuthenticationError, ConflictError } from '../errors/app.error.ts';
// ...

static async register(input: RegisterInput): Promise<User> {
  const existingUser = await db.orm.public.User.where({ email: input.email }).first();

  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }
  // ... rest of code
}

static async login(input: LoginInput): Promise<User> {
  const user = await db.orm.public.User.where({ email: input.email }).first();

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);

  if (!validPassword) {
    throw new AuthenticationError('Invalid email or password');
  }
  // ... rest of code
}
```

3. Create error formatter for GraphQL in `src/graphql/errorFormatter.ts`:

> **Note:** Yoga calls this function with three values — the error as your code threw it, the
> message to fall back on, and whether we are in development. You want the first one, because only
> it still knows which of your classes it is.

```ts
import { GraphQLError } from 'graphql';
import { AppError } from '../errors/app.error.ts';

export function maskError(error: unknown, message: string, isDev?: boolean): Error {
  const originalError = (error as any)?.originalError ?? error;

  if (originalError instanceof AppError) {
    return new GraphQLError(originalError.message, {
      extensions: {
        code: originalError.code,
        statusCode: originalError.statusCode,
      },
    });
  }

  if (isDev) {
    return error as Error;
  }

  return new Error(message);
}
```

4. Point Yoga at it. This lives in `src/graphql/yoga.ts` now — Exercise 4 moved it there:
```ts
import { maskError } from './src/graphql/errorFormatter.ts';
// ...

const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  cors: false,
  maskedErrors: {
    maskError,
    isDev: process.env.NODE_ENV !== 'production',
  },
  context: async ({ request }) => {
    // ... same context extraction as before
  },
});
```

> **&#10067; Before you move on.** `AppError` carries **two** things: a `statusCode` and a `code`.
> Who reads which, and why does it need both? (Hint: one of your two ways into the server speaks
> HTTP status codes; the other always answers `200 OK` and puts the real answer somewhere else.)

5. Update `src/graphql/authHelpers.ts` to use custom errors:
```ts
import { AuthenticationError, AuthorizationError } from '../errors/app.error.ts';
import type { UserJWT } from '../types/auth.ts';
import type { GraphQLContext } from '../types/GraphQLContext.ts';

export function requireAuth(context: GraphQLContext): UserJWT {
  if (!context.userJWT) {
    throw new AuthenticationError('You must be logged in to perform this action');
  }
  return context.userJWT;
}
```

---

### 8. Hold the session in React (~20 min)

**Goal:** keep the token and the signed-in user in one place the whole app can read.

1. Before anything else, install **Tailwind CSS**. From `frontend/`:

```bash
npm install tailwindcss @tailwindcss/vite
```

   Add the plugin in `vite.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

   And replace the contents of `src/index.css` with:

```css
@import 'tailwindcss';

@layer base {
  body {
    @apply bg-slate-50 text-slate-800 antialiased;
  }
}
```

   That is the whole setup: one import, no config file, no list of files to scan.

   **One catch:** replacing `index.css` deletes the styles lesson 5 was using, and four components
   still reference them — `ExpenseAdd`, `ExpenseItem`, `ExpenseList` and `ExpenseSearch`. Restyle
   them now with Tailwind classes, or your Add form will be unstyled text for the rest of the
   lesson. The pattern is the same everywhere: a card is
   `rounded-lg border border-slate-200 bg-white p-4`, a primary button is
   `rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700`, an input is
   `rounded border border-slate-300 px-3 py-2 text-sm`.

> **&#10067; Why now, and why no explanation?** You are about to add a login page, a header that
> changes when you sign in, and error messages. That is more interface than this app has needed so
> far, and hand-written CSS would quietly eat your morning.
>
> Tailwind is a set of small class names that each do one thing — `p-4` is padding, `text-sm` is a
> font size, `rounded` is a border radius. You put them straight on the element. There is no separate
> stylesheet to keep in sync, which is the whole point.
>
> **There is no styling lesson in this course.** Copy the classes from the examples, change the ones
> you want to change, and look the rest up in the Tailwind docs when you care. Nothing in this lesson
> is assessed on how it looks — the classes are here so your screens are readable while you work on
> the parts that are assessed.

2. Create `src/lib/token.ts`. Two lines of storage, and one name for the key:

```ts
const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
```

> **&#10067; Why a whole file for three one-line functions?** Because of who needs them. The API
> client in `lib/` needs to read the token, and so does the route guard in Exercise 10 — and neither
> of those is a React file. If the token lived in your auth context, `lib/graphql.ts` would have to
> import from `contexts/`, and a plain TypeScript module that works in a loader or a test would
> suddenly depend on React.
>
> Keeping it here also means the string `'auth_token'` is written **once**. A typo in a second copy
> is a bug where the app silently acts logged out, and nothing points at the cause.

3. Create `src/contexts/AuthContext.tsx`:
```tsx
import { createContext, useContext, useState, type ReactNode } from 'react';

import { clearToken, getToken, setToken } from '../lib/token';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = 'auth_user';

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // The initialiser runs once, on the first render. Reading storage here rather
  // than in a useEffect is what stops the app flashing "logged out" for one
  // frame every time you refresh.
  const [token, setTokenState] = useState<string | null>(getToken);
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const login = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setTokenState(newToken);
    setUser(newUser);
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setTokenState(null);
    setUser(null);
  };

  // There is deliberately no expiry timer here. See the note below.
  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!user && !!token }}
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

> **&#10067; Why store the user, instead of reading it out of the token?** You could: the token's
> payload is base64 and a library like `jwt-decode` will unpack it for you. But your login response
> already *told* you the user — `{ token, user }` — so decoding is work you have already been given
> the answer to, plus a dependency.
>
> **And there is no expiry timer.** The browser's clock is the user's clock. A token's expiry is
> checked by the server, on every single request, and that is the only check that counts. When the
> server refuses, Exercise 10's client clears the token and sends them to the login page — that *is*
> your expiry handling, and it is the only one you can trust.

4. Wrap your app with `AuthProvider` in `src/main.tsx`:
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

---

### 9. Log in from the browser (~25 min)

**Goal:** a login page, a header that knows who you are, and an add-form that no longer asks who paid.

1. Create the login page at `src/pages/auth/Login.tsx` — folders mirror the URL and files are named
   `<Resource><Action>`, exactly as in lesson 5. It uses react-hook-form and `zodResolver`, like
   every other form you have written since lesson 3:

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import * as z from 'zod';

import { useAuth, type AuthUser } from '../../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const LoginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

const inputClass =
  'mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  // This error comes back from the server, so react-hook-form cannot know about
  // it — react-hook-form validates the form before the request is ever made.
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? 'Login failed');
      }

      login(body.token, body.user as AuthUser);
      navigate('/expenses');
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  return (
    <div className="mx-auto max-w-sm rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold text-slate-900">Log in</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
          <input id="email" type="email" autoComplete="username" className={inputClass}
                 {...register('email')} />
          {errors.email && (
            <span className="mt-1 block text-sm text-red-600">{errors.email.message}</span>
          )}
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
          <input id="password" type="password" autoComplete="current-password" className={inputClass}
                 {...register('password')} />
          {errors.password && (
            <span className="mt-1 block text-sm text-red-600">{errors.password.message}</span>
          )}
        </div>

        {serverError && (
          <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </p>
        )}

        <button type="submit" disabled={isSubmitting}
                className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-slate-400">
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}

export default Login;
```

> **&#9888; Note `serverError`, and why it is separate.** react-hook-form and Zod check the form
> *before* it is sent: is this an email, is the password non-empty. They cannot tell you that the
> password is wrong, because only the server knows that. Two kinds of error, two places to keep
> them, and a form that only shows the first kind leaves the user staring at a button that did
> nothing. You will see the same split again whenever a server rejects a form.

   Log in as `john.doe@example.com` with `topsecret`. Then try a wrong password and check that you
   see the message rather than silence.

> **&#10067; Before you move on.** `zodResolver` already validates this form. So what is
> `serverError` for — and why can react-hook-form never produce it?

2. Add route for login page in your router configuration.

3. Update `src/pages/Layout.tsx` so the navigation bar reflects who is signed in. You already have
   this file from lesson 5 — you are adding the right-hand side of the bar, not rewriting it.

```tsx
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'rounded px-3 py-1.5 text-sm font-semibold text-indigo-700 bg-indigo-50'
    : 'rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100';

function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      <nav className="flex items-center gap-1 border-b border-slate-200 bg-white px-6 py-3">
        <NavLink to="/" end className={linkClass}>Home</NavLink>

        {/* Hiding these is a convenience, not a protection — see exercise 8. */}
        {isAuthenticated && (
          <>
            <NavLink to="/expenses" end className={linkClass}>Expenses</NavLink>
            <NavLink to="/expenses/new" className={linkClass}>Add an expense</NavLink>
          </>
        )}

        <div className="ml-auto flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-slate-500">Signed in as {user?.name}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
              >
                Log out
              </button>
            </>
          ) : (
            <NavLink to="/login" className={linkClass}>Log in</NavLink>
          )}
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
```

4. Your add-expense form still asks **who paid**. It must not. Open
   `src/components/ExpenseAdd.tsx` and delete the payer `<select>`, its `useUsers()` call, and
   `payerId` from `ExpenseFormSchema`. Nobody chooses the payer any more: the payer is whoever is
   logged in.

   The page supplies it instead, from the auth context — `src/pages/expenses/ExpenseNew.tsx`:

```tsx
const { user } = useAuth();

const createExpense = async (expense: NewExpenseFormOutput) => {
  // We still send a payerId, because the mutation takes one. But sending it no
  // longer *decides* anything: the resolver compares it against the id in the
  // token and refuses the request if they differ. Try putting another user's id
  // here and watch the server say no.
  await graphqlRequest(CREATE_EXPENSE, {
    input: { ...expense, payerId: user!.id },
  });
  navigate('/expenses');
};
```

---

### 10. Send the token, and keep strangers out (~20 min)

**Goal:** send the token with every request from one place, and send a logged-out visitor to the login page before anything is fetched.

1. Update `src/lib/graphql.ts`:
```ts
import { clearToken, getToken } from './token';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Only when there is one. A header reading "Bearer null" is worse than no
      // header at all: the server will try to verify it and fail.
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const { data, errors } = await response.json();

  if (errors?.length) {
    // The token is gone, expired, or was never any good. The server is the
    // authority on that, so this is where we find out.
    if (errors[0]?.extensions?.code === 'UNAUTHENTICATED') {
      clearToken();
      window.location.href = '/login';
    }

    // Use the status the server chose. `AppError` put it there precisely so the
    // client would not have to guess — a deliberate 403 should not reach the
    // user disguised as a 500.
    const status = Number(errors[0]?.extensions?.statusCode) || 500;
    throw new Response(errors[0].message, { status });
  }

  return data as T;
}
```

   Do the same two lines in `src/lib/rest.ts` — `useUsers` and `useCategories` go through it, and
   those endpoints need a token now too.

> **Count the files you just edited: one each.** Every loader, every mutation, every page in the app
> now sends the token, and not one of them had to be told. In lesson 5 we built these two files and
> said they were "the one place every request passes through, so it is where you will later add an
> `Authorization` header". This is later.

2. Test by creating an expense — the `Authorization: Bearer …` header should now appear in the Network tab of your browser's dev tools.



3. The instinct is a `<ProtectedRoute>` component: read the token, render `<Navigate to="/login" />`
   or render the page. It is the first thing most tutorials show, and **in this app it does not
   work**. Before you write anything, predict why.

> **&#10067; When does a route's loader run?** Before its component renders. That is the whole point
> of loaders — lesson 5 built the list page around it.
>
> So a guard that lives in a *component* is always too late. By the time it runs, the loader has
> fetched, the server has answered `UNAUTHENTICATED`, and the error has already reached React
> Router's error screen. The visitor does end up on `/login`, which is why this bug is easy to miss —
> but the trip went through your backend to get there.
>
> The guard has to run **before** the loader. React Router has a place for exactly that.

4. **Middleware.** A route can carry a `middleware` array. React Router runs it on the way *down* to
   the route — parent middleware first, then child, then the loaders, then the components. Create
   `src/lib/requireAuth.ts`:

```ts
import { redirect, type MiddlewareFunction } from 'react-router';

import { getToken } from './token';

export const requireAuth: MiddlewareFunction = ({ request }) => {
  if (!getToken()) {
    // Remember where they were going, so login can send them back there.
    const from = new URL(request.url).pathname;
    // Thrown, not returned: this abandons the navigation and starts a new one.
    // Same move as the `throw new Response(...)` you wrote in lesson 5.
    throw redirect(`/login?from=${encodeURIComponent(from)}`);
  }
};
```

5. Hang it on a route that wraps the private pages, in `src/main.tsx`. One line protects everything
   nested under it — you do not repeat yourself per route:

```tsx
const router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      { index: true, Component: Welcome },
      // Login stays open: a logged-out visitor must be able to reach one page.
      { path: 'login', Component: Login },
      {
        // Everything nested here needs an account. The middleware runs before
        // any of these loaders, so a logged-out visitor never reaches them.
        middleware: [requireAuth],
        children: [
          { path: 'expenses', Component: ExpenseList, loader: expenseListLoader },
          { path: 'expenses/new', Component: ExpenseNew },
          { path: 'expenses/:id', Component: ExpenseShow, loader: expenseShowLoader },
        ],
      },
    ],
  },
]);
```

   Nothing else in the route table changes: same `Component:`, same loaders, no `element:`. The
   indentation now shows which pages need an account, which is the readable part everyone wants from
   a `<ProtectedRoute>` — without the broken part.

6. Send the user back where they were going. In `Login.tsx`:

```tsx
const [searchParams] = useSearchParams();
const from = searchParams.get('from') ?? '/expenses';

// ...after a successful login
navigate(from, { replace: true });
```

   `replace` keeps the login page out of the history, so Back from `/expenses` goes where they were
   before, not round in a loop.

7. Check it with the **Network tab open**. Log out, then type `/expenses` in the address bar.

   - You land on `/login?from=%2Fexpenses`
   - **No request reached your backend at all** — the middleware ran before the loader
   - No error screen, no full page reload
   - Log in, and you arrive on `/expenses`

   Try `/expenses/:id` too, then log in as a user who is not on that expense. The middleware lets
   you through — you *are* logged in — and the resolver refuses you. Two different guards answering
   two different questions.

> **&#9888; This is still not security.** It is good behaviour for an honest user who is not logged
> in. It stops no attacker: anyone can edit the JavaScript running in their own browser, and the
> `curl` you ran this morning never loaded your JavaScript in the first place. The protection is
> `requireAuth` in your resolvers, and it is the only one. What you built here is the difference
> between an app that is rude when you are logged out and one that is not.

---

### 11. Security headers with Helmet (~10 min)

**Goal:** add Helmet. It sets a group of response headers that turn off risky browser behaviour. Then understand why exactly one of your routes needs a different setting from all the others.

Then understand why exactly one of your routes needs a different setting from all the others.

1. Install Helmet:
```bash
npm install helmet
```

2. In `app.ts`, add it near the top, before your routes:
```ts
import helmet from 'helmet';
// ...
app.use(helmet({ contentSecurityPolicy: false }));
```

3. Reload any endpoint and open the Network tab. Compare the response headers with what you saw
   before. Helmet added several, and each one turns off something a browser used to do:

   - `X-Content-Type-Options: nosniff` — stop the browser guessing that our JSON is really a script
   - `X-Frame-Options` — stop another site putting our responses inside an invisible frame
   - `Referrer-Policy` — stop our URLs leaking to sites the user clicks through to

   Helmet can set more than this — HSTS, cross-origin policies, and others. We take its defaults and
   stop there. Tuning them properly is a security course, and this is not one.

4. Now look at what we switched **off**, because that is the interesting part.

> **&#10067; What is a Content-Security-Policy, and why is ours off?** A CSP is a header that tells a
> browser what an **HTML page** is allowed to load: which origins it may take scripts from, styles
> from, images from. It is a powerful defence against cross-site scripting — and it only ever governs
> an HTML document.
>
> **This server does not serve HTML.** Every route you have written answers JSON. A CSP on
> `/api/expenses` has nothing to govern. The CSP that protects your users is the one on whatever
> serves your React app — Vite in development, your static host in production — and that is a
> different server from this one.
>
> So why mention it at all? Because there is exactly one exception.

5. `/graphql` is the one route that answers with an HTML page: **GraphiQL**, the query IDE you have
   been using since lesson 5. GraphiQL loads its editor from a CDN (`unpkg.com`), which means a
   default CSP — anything with `default-src 'self'` — blocks it. The page stays blank, the console
   fills with CSP errors, and nothing tells you that a header you added is the cause.

   Give that one route the policy it needs, and leave every other route alone:

```ts
app.use(
  yoga.graphqlEndpoint,
  helmet.contentSecurityPolicy({
    directives: {
      'style-src': ["'self'", 'unpkg.com', "'unsafe-inline'"],
      'script-src': ["'self'", 'unpkg.com', "'unsafe-inline'"],
      'img-src': ["'self'", 'raw.githubusercontent.com'],
    },
  }),
  yoga
);
```

   Those are the directives [GraphQL Yoga documents](https://the-guild.dev/graphql/yoga-server/docs/integrations/integration-with-express),
   plus `'unsafe-inline'` on `style-src` — without it the editor loads but loses its syntax
   colouring, because the editor sets those colours with inline styles.

   Note **where** it is applied: on this route, as middleware, not on the whole app. That is the
   shape to remember. A policy that only one page needs belongs on that one page, not on everything.

6. Check both halves:
   - `GET /api/users` — a `Content-Security-Policy` header should **not** be there
   - `GET /graphql` in a browser — GraphiQL should render, in colour, with no CSP errors in the console

> **&#9888; Do not skip step 5, and do not "tidy up" by moving the CSP to the whole app.** A CSP tight
> enough to be worth having will blank GraphiQL; one loose enough for GraphiQL is not worth having.
> They genuinely want different settings, which is why they get different settings.

---

**That is the hole from Exercise 0, closed.** You started the morning able to post a 900&nbsp;€
dinner in somebody else's name, from a terminal, with no account at all. You finish with a server that asks for a token, reads a name out of it, and refuses the
request when the name does not match. The frontend carries that token everywhere, and not one
component knows it exists. That is real access control, and you built it in a morning. Well done.

---

## Summary

### First, without looking

Close the editor. Answer these five out loud or on paper — properly, in sentences, not "yeah,
tokens". Then read the bullets below and see how you did.

1. In Exercise 0 you created an expense in somebody else's name from a terminal. **Run that same
   `curl` now.** It fails. Name the exact function that refuses it, and say what would happen if you
   deleted that one line.
2. Your token sits in `localStorage`, where anyone can read it and anyone can edit it. **So why can
   a user not simply change the `userId` inside their own token and become somebody else?**
3. Your `Login` component calls `login(token, user)`. Your `ExpenseList` loader sends an
   `Authorization` header. **Neither one knows about the other.** Explain how the token got from the
   first to the second, and name every file it passed through.
4. `{ expenses { id } }` and `{ me { expenses { id } } }` both work, and both need a login. **What
   is the difference, and why is it a naming decision rather than a bug?**
5. Your `login` says `Invalid email or password` when the email is unknown, and the same sentence
   when the password is wrong. It knows the difference. **Why does it refuse to tell?**

If a question was hard, that is useful information — it points at the part to re-read, and it will
stick far better now than if you had read the answer first.

### Then, the answers in short

- **Authentication** asks *who are you*; **authorization** asks *may you do this*. Two words, two
  jobs, two different places in your code.
- A **hash is not encryption**: bcrypt has no decrypt. You never compare passwords — you hash the
  one that just arrived and compare the hashes. That is why a stolen database does not hand over
  anyone's password.
- Adding a **NOT NULL column to a table with rows in it** is three steps, not one: add it empty,
  fill it, then lock it down. Nothing can invent that middle value for you.
- A **token is readable by everyone and forgeable by nobody.** It is signed, not hidden. Never put
  anything secret inside one; always assume the user has read it.
- **The context is the border.** It is the single place where an untrusted string from a header
  becomes a trusted `ctx.userJWT`. Everything above it is a claim; everything below it is a fact.
- A resolver that calls `requireAuth` knows *who*. A resolver that compares `userJWT.userId` to
  `args.input.payerId` decides *whether*. You need both, and the second cannot be written once and
  reused — it is different for every operation.
- **A field is reachable by every path that leads to its type**, not only the path you had in mind.
  That is why the permission on `User.expenses` lives on the field.
- **The schema is an API design, not a database dump.** `expenses` means everybody's and
  `me { expenses }` means yours, because that is what you named them.
- **Frontend checks are user experience, never security.** The dropdown, the hidden button and the
  route middleware make the app pleasant. `curl` ignores all three.
- **One API client means one place to change.** Lesson 5 built `graphql.ts` with no auth in sight;
  this week "send a token with every request in the app" was two lines in one file.
- An **error that carries its own status code and `code`** stops every route from guessing. The REST
  route reads the status; the GraphQL client reads the `code` and sends the user back to login.
- **Error messages leak.** Telling an attacker that an email exists is a decision, not an accident.
  Be less specific than you could be, on purpose.

---

## Optional challenges

### A. Put a permission on `expenses`

`{ expenses { id } }` still returns everybody's expenses to any signed-in user. That was a
deliberate decision, not an oversight — some caller genuinely needs it. The question we skipped is
*which* caller.

Add a `role` to `User` (`'member'` or `'admin'` is enough), default everyone to `member`, and refuse
the `expenses` query unless the caller is an admin. Two things are worth noticing while you do it:

- The check belongs next to `requireAuth`, as a `requireAdmin` — the shape is the same, and so is
  the reason for returning the user rather than a boolean.
- Your REST route `GET /api/expenses` calls the same service, and it has no user at all. Decide what
  should happen to it. You cannot answer that until you decide whether that route still has a reason
  to exist, and that is the real cost of having two ways into one service.

### B. Get the token out of `localStorage`

Your token sits in `localStorage` for seven days, where **any** JavaScript running on your page can
read it — including a script that arrived through a library you installed. One `fetch` to an
attacker's server and they are you, for a week.

The usual answer is to stop letting JavaScript touch it: the server sets the token as an `httpOnly`
cookie, which the browser attaches automatically and no script can read.

Try it. It is not a big change, and that is exactly why it is worth doing — almost everything that
makes it hard is somewhere else:

- Your login route sets a cookie instead of returning the token in the body.
- Your `graphqlRequest` stops setting a header and starts sending `credentials: 'include'`.
- Your `cors()` options need `credentials: true` and a **single explicit origin**.
- Your GraphQL context reads the cookie instead of the `Authorization` header.
- And your frontend no longer has the token, so it no longer knows who is logged in. Decide how it
  finds out. (A `me` query is one answer. There are others. Say why you picked yours.)

Then read what you have just enabled: because the browser now attaches that cookie to *every*
request to your server, including ones started by another website, you have traded an XSS risk for a
CSRF risk. Look up **SameSite** and decide which value your cookie needs.

There is no clean win here. Choosing between two imperfect options, and being able to say out loud
what you gave up, is most of what security work actually is.
