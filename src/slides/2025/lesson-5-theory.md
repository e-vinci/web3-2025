---
marp: true
theme: default
class: lead
paginate: true
header: 'Web 3 2025 - Lesson 5'
footer: 'Web 3 2025 - Vinci'
backgroundColor: #fff
backgroundImage: url('https://marp.app/assets/hero-background.svg')
---

# Lesson 5: GraphQL

**A Modern Approach to API Design**

<!--
Speaker Notes:
• Welcome to Lesson 5 - GraphQL
• Moving beyond traditional REST APIs
• Learning industry-standard query language
• Building flexible, efficient APIs
-->

---

## The Problem with REST APIs

**Scenario:** Display expense details with payer and participant names

**REST API:**

```
GET /api/expenses/1          → Returns: id, description, amount, date, payerId
GET /api/users/2             → Returns: id, name, email, bankAccount, ...
GET /api/users/3             → Returns: id, name, email, bankAccount, ...
GET /api/users/4             → Returns: id, name, email, bankAccount, ...
```

**Problems:**

- ❌ Multiple HTTP requests (N+1 problem)
- ❌ Over-fetching: Getting data we don't need (bankAccount, etc.)
- ❌ Under-fetching: Need multiple requests to get related data

<!--
Speaker Notes:
• REST forces us to make multiple round trips
• Each request has latency overhead
• We get all user fields even though we only need names
• N+1 problem: 1 query for expense + N queries for participants
• This becomes worse with nested data
-->

---

## The GraphQL Solution

**Same scenario with GraphQL:**

```graphql
query {
  expense(id: 1) {
    id
    description
    amount
    date
    payer {
      name
    }
    participants {
      name
    }
  }
}
```

**One request. Exactly the data you need. Nothing more, nothing less.**

<!--
Speaker Notes:
• Single HTTP request to get everything
• Client specifies exactly what fields it needs
• No over-fetching - only name, not email or bankAccount
• Server knows relationships and fetches efficiently
• Solves both over-fetching and under-fetching
-->

---

# Today's Topics

1. **GraphQL Fundamentals** - What is GraphQL?
2. **Query Language** - How to ask for data
3. **Queries vs Mutations** - Read vs Write operations
4. **Apollo** - GraphQL implementation for Node.js and React
5. **Pothos** - Type-safe schema builder
6. **Tooling** - Ruru playground and development tools

<!--
Speaker Notes:
• Comprehensive introduction to GraphQL
• Theory and practical implementation
• Industry-standard tools and libraries
• Building production-ready GraphQL APIs
-->

---

# What is GraphQL?

GraphQL is a **query language for APIs** and a **runtime for executing those queries**.

**Key Characteristics:**

- 🎯 **Declarative**: Ask for exactly what you need
- 📝 **Strongly typed**: Schema defines what's possible
- 🔗 **Hierarchical**: Queries mirror the data structure
- 🎨 **Introspective**: Self-documenting API

**Created by Facebook in 2012, open-sourced in 2015**

<!--
Speaker Notes:
• GraphQL is both a specification and a runtime
• Query language lets clients describe their data needs
• Runtime executes queries against your schema
• Not tied to any specific database or programming language
• Works with your existing code and data
-->

---

# GraphQL vs REST

| Aspect             | REST                             | GraphQL                        |
| ------------------ | -------------------------------- | ------------------------------ |
| **Endpoints**      | Multiple (`/users`, `/expenses`) | Single (`/graphql`)            |
| **Data Fetching**  | Fixed responses                  | Flexible, client-specified     |
| **Over-fetching**  | Common                           | Eliminated                     |
| **Under-fetching** | Requires multiple requests       | Single request                 |
| **Versioning**     | URL versioning (`/v1`, `/v2`)    | Schema evolution               |
| **Documentation**  | Manual (OpenAPI/Swagger)         | Auto-generated (introspection) |

<!--
Speaker Notes:
• REST uses multiple endpoints, GraphQL uses one
• REST returns fixed data structure, GraphQL returns what you ask for
• REST often requires multiple requests for related data
• GraphQL schema is self-documenting through introspection
• Both have their place - not one-size-fits-all
-->

---

# When to Use GraphQL vs REST

**Use GraphQL when:**

- ✅ Complex data relationships
- ✅ Mobile apps (bandwidth matters)
- ✅ Multiple clients with different needs

**Use REST when:**

- ✅ Simple CRUD operations
- ✅ File uploads/downloads
- ✅ Legacy compatibility is critical

**Both:** It's fine to use both in the same app!

<!--
Speaker Notes:
• GraphQL excels with complex, interconnected data
• REST is simpler for basic operations
• Can use both together - GraphQL for complex queries, REST for uploads
• Consider team experience and project requirements
• Not an either/or decision
-->

---

# GraphQL Query Language Basics

## Query Structure

```graphql
{
  expense(id: 1) {
    id
    description
    amount
    payer {
      name
      email
    }
  }
}
```

---

**Components:**

- **Operation**: `expense` (the query name)
- **Arguments**: `(id: 1)` (input parameters)
- **Selection Set**: `{ id, description, ... }` (fields to return)

<!--
Speaker Notes:
• Queries look similar to JSON but without values
• Curly braces define what fields you want
• Arguments in parentheses filter or specify data
• Nested objects let you traverse relationships
• Response mirrors the query structure
-->

---

# Fields and Arguments

```graphql
{
  # Simple field
  hello

  # Field with argument
  expense(id: 1) {
    description
  }
```

---

```graphql
  # Multiple arguments
  expenses(limit: 10, offset: 0) {
    id
    description
  }

  # Nested fields
  expense(id: 1) {
    payer {
      name
      email
    }
  }
}
```

<!--
Speaker Notes:
• Fields are the basic unit - properties you want to fetch
• Arguments filter or customize the query
• Can have multiple arguments (limit, offset, etc.)
• Nested fields traverse relationships
• Server resolves each field independently
-->

---

# Query Response

**Query:**

```graphql
{
  expense(id: 1) {
    description
    amount
    payer {
      name
    }
  }
}
```

---

**Response:**

```json
{
  "data": {
    "expense": {
      "description": "Team Lunch",
      "amount": 42.5,
      "payer": {
        "name": "Alice"
      }
    }
  }
}
```

**Response mirrors query structure exactly!**

<!--
Speaker Notes:
• Response JSON structure matches query structure
• Only requested fields are included
• Null if field doesn't exist or is null
• Errors separate from data in errors array
• Predictable response format
-->

---

# Query vs Mutation

## Query: Read Operations

```graphql
query GetExpense {
  expense(id: 1) {
    description
    amount
  }
}
```

---

## Mutation: Write Operations

```graphql
mutation CreateExpense {
  createExpense(description: "Lunch", amount: 42.5, payerId: 1) {
    id
    description
  }
}
```

<!--
Speaker Notes:
• Queries are for reading data (like GET in REST)
• Mutations are for changing data (like POST, PUT, DELETE)
• Semantic distinction helps with caching and optimization
• Mutations run sequentially, queries can run in parallel
• Both can return data - mutations often return created/updated object
-->

---

# Query vs Mutation Principles

**Query:**

- 🔍 Read-only operations, No side effects
- ⚡ Can be executed in parallel
- 💾 Cacheable

**Mutation:**

- ✏️ Create, update, delete operations
- 🔄 Executed sequentially
- 🚫 Not cacheable

**Both return data!**

<!--
Speaker Notes:
• Clear semantic distinction
• Queries should be side-effect free
• Mutations change state
• GraphQL guarantees mutations run one after another
• Queries can be optimized and cached
• Return data helps avoid additional queries
-->

---

# Variables in GraphQL

**Without variables:**

```graphql
mutation {
  createExpense(description: "Lunch", amount: 42.5, payerId: 1) {
    id
  }
}
```

---

**With variables (better):**

```graphql
mutation CreateExpense($description: String!, $amount: Float!, $payerId: Int!) {
  createExpense(description: $description, amount: $amount, payerId: $payerId) {
    id
    description
  }
}
```

**Variables (sent separately):**

```json
{
  "description": "Lunch",
  "amount": 42.5,
  "payerId": 1
}
```

<!--
Speaker Notes:
• Variables separate query structure from values
• Reusable queries with different inputs
• Better for client-side code
• Type-safe with validation
• $ prefix denotes variables
• ! suffix means required (non-nullable)
-->

---

# Apollo: The GraphQL Ecosystem

**Apollo** is the most popular GraphQL implementation for JavaScript.

**Two main components:**

1. **Apollo Server** (Backend)
   - GraphQL server for Node.js
   - Works with Express, Fastify, etc.
   - Schema-first or code-first approach

---

2. **Apollo Client** (Frontend)
   - GraphQL client for React, Vue, Angular
   - Intelligent caching
   - State management

<!--
Speaker Notes:
• Apollo is to GraphQL what Express is to REST
• Not the only implementation but most popular
• Server and client work together but can be used separately
• Production-ready with great documentation
• Active community and ecosystem
-->

---

# Apollo Server

```typescript
const typeDefs = `#graphql
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello GraphQL!',
  },
};

const server = new ApolloServer({ typeDefs, resolvers });
await server.start();

const graphqlMiddleware = expressMiddleware(server);
app.use('/graphql', graphqlMiddleware);
```

<!--
Speaker Notes:
• Apollo Server integrates with Express as middleware
• typeDefs define the schema (what's possible)
• resolvers implement the logic (how to fetch data)
• Single /graphql endpoint handles all queries
• Works alongside existing REST routes
-->

---

# Apollo Server Components

**Type Definitions (typeDefs):**

- GraphQL schema definition language
- Defines types, queries, mutations
- The "contract" between client and server

**Resolvers:**

- Functions that fetch the data
- Map to each field in the schema
- Can call databases, APIs, other services

---

```typescript
const resolvers = {
  Query: {
    expense: (_parent, args, context) => {
      return expenseRepository.getExpenseById(args.id);
    },
  },
};
```

<!--
Speaker Notes:
• Schema defines what's possible
• Resolvers define how to get the data
• Each field can have its own resolver
• Resolvers receive parent, args, context, info
• Can call existing code - no need to rewrite everything
-->

---

# Apollo Client

```typescript
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
const client = new ApolloClient({
  link: new HttpLink({ uri: 'http://localhost:3000/graphql' }),
  cache: new InMemoryCache(),
});
```

**In React:**

```tsx
import { ApolloProvider } from '@apollo/client/react';
function App() {
  return (
    <ApolloProvider client={client}>
      <RouterProvider router={router} />
    </ApolloProvider>
  );
}
```

<!--
Speaker Notes:
• Apollo Client handles GraphQL requests
• Intelligent caching reduces requests
• Works with React hooks
• Similar to React Query but GraphQL-specific
• Provider makes client available to all components
-->

---

# Querying with Apollo Client

```typescript
const EXPENSE_QUERY = gql`
  query ExpenseDetail($id: Int!) {
    expense(id: $id) {
      id
      description
      amount
      payer {
        name
      }
    }
  }
`;
export async function loader({ params }) {
  const { data } = await graphqlClient.query({
    query: EXPENSE_QUERY,
    variables: { id: Number(params.id) },
  });
  return { expense: data.expense };
}
```

<!--
Speaker Notes:
• gql tag parses GraphQL strings at build time
• Type-safe with TypeScript
• Integrates with React Router loaders
• Cache automatically manages results
• Same data from cache if queried again
-->

---

# Mutations with Apollo Client

```typescript
const CREATE_EXPENSE_GQL = gql`
  mutation CreateExpense($description: String!, $amount: Float!) {
    createExpense(description: $description, amount: $amount) {
      id
      description
    }
  }
`;
const onSubmit = async (data) => {
  await graphqlClient.mutate({
    mutation: CREATE_EXPENSE_GQL,
    variables: {
      description: data.description,
      amount: data.amount,
    },
  });
};
```

<!--
Speaker Notes:
• Mutations similar to queries but use mutate method
• Returns created/updated object
• Can specify what fields to return
• Cache automatically updates with results
• Consistent pattern across app
-->

---

# Ruru: GraphQL Playground

**Ruru** is a modern GraphQL IDE for testing and exploring your API.

```typescript
import { ruruHTML } from 'ruru/server';

if (env.isDevelopment) {
  app.get('/ruru', (req, res) => {
    res.send(ruruHTML({ endpoint: '/graphql' }));
  });
}
```

---

**Features:**

- 🎨 Syntax highlighting and autocomplete
- 📚 Schema documentation
- 📝 Query history
- 🔍 Schema explorer

**Visit: http://localhost:3000/ruru**

<!--
Speaker Notes:
• Essential development tool
• Interactive query editor with autocomplete
• Explore schema and types
• Test queries before implementing in code
• Like Postman but for GraphQL
• Only enable in development!
-->

---

# Pothos: Type-Safe Schema Builder

**The Problem:**

```typescript
// typeDefs as string - no TypeScript validation
const typeDefs = `#graphql
  type User {
    id: ID!
    name: Strnig  # Typo! No error until runtime
  }
`;
```

---

**The Solution: Pothos**

```typescript
builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'), // TypeScript catches typos!
  }),
});
```

<!--
Speaker Notes:
• Raw GraphQL schema is strings - no type safety
• Pothos builds schema with TypeScript
• Catch errors at compile time, not runtime
• Better IDE support with autocomplete
• Integrates with Prisma for automatic types
-->

---

# Why Pothos?

**Benefits:**

- ✅ **Type Safety**: Catch errors at compile time
- 🔗 **Prisma Integration**: Auto-generate from database schema
- 🧩 **Modular**: Build schema piece by piece
- 🎯 **Code-First**: Define schema in TypeScript, not strings
- 📦 **Plugin Ecosystem**: Validation, auth, complexity, etc.

---

```typescript
import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';

const builder = new SchemaBuilder({
  plugins: [PrismaPlugin],
  prisma: { client: prisma },
});
```

<!--
Speaker Notes:
• Pothos is code-first vs schema-first approach
• Better developer experience with TypeScript
• Catches errors early in development
• Plugins add powerful features
• Prisma plugin generates types from database
-->

---

# Pothos + Prisma Integration

**Prisma Schema:**

```prisma
model User {
  id    Int    @id @default(autoincrement())
  name  String
  email String @unique
}
```

**Pothos Schema (auto-typed!):**

```typescript
builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'), // TypeScript knows 'id' exists
    name: t.exposeString('name'), // and knows 'name' is a string
    email: t.exposeString('email'),
  }),
});
```

**Pothos knows all Prisma types automatically!**

<!--
Speaker Notes:
• Prisma generates TypeScript types from database
• Pothos uses those types for GraphQL schema
• End-to-end type safety: Database → API → Frontend
• Change database schema, TypeScript catches GraphQL issues
• No manual type duplication
-->

---

# Pothos Schema Builder

```typescript
// builder.ts
import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import type PrismaTypes from '../generated/pothos-prisma-types';

const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
}>({
  plugins: [PrismaPlugin],
  prisma: { client: prisma },
});

export default builder;
```

**Single builder instance shared across all schema definitions**

<!--
Speaker Notes:
• Builder is central to Pothos
• Configure once, use everywhere
• PrismaTypes generated automatically
• Plugins extend functionality
• Export and reuse in all schema files
-->

---

# Defining Types with Pothos

```typescript
const ExpenseRef = builder.prismaObject('Expense', {
  fields: (t) => ({
    id: t.exposeID('id'),
    description: t.exposeString('description'),
    amount: t.exposeFloat('amount'),
    date: t.string({ resolve: (parent) => parent.date.toISOString() }),
    payer: t.relation('payer'),
    participants: t.relation('participants'),
  }),
});
```

**Exposes:**

- Prisma fields directly (`exposeID`, `exposeString`, etc.)
- Relations automatically (`t.relation`)

<!--
Speaker Notes:
• prismaObject maps GraphQL type to Prisma model
• t.expose methods for simple fields
• t.relation for relationships - Pothos handles joins
• Type parameter ensures type safety
• Can add computed fields not in database
-->

---

# Adding Queries with Pothos

```typescript
builder.queryType({
  fields: (t) => ({
    expense: t.field({
      type: ExpenseRef,
      args: {
        id: t.arg.int({ required: true }),
      },
      resolve: async (_root, args, _ctx) => {
        return expenseRepository.getExpenseById(args.id);
      },
    }),
  }),
});
```

---

**Creates:**

```graphql
type Query {
  expense(id: Int!): Expense
}
```

<!--
Speaker Notes:
• queryType adds to Query type
• t.field defines individual query
• args define input parameters with types
• resolve function fetches the data
• Can call existing repository code
-->

---

# Adding Mutations with Pothos

```typescript
builder.mutationType({
  fields: (t) => ({
    createExpense: t.field({
      type: ExpenseRef,
      args: {
        description: t.arg.string({ required: true }),
        amount: t.arg.float({ required: true }),
        date: t.arg({ type: 'DateTime', required: true }),
        payerId: t.arg.int({ required: true }),
      },
      resolve: async (_parent, args) => {
        return expenseRepository.createExpense(args);
      },
    }),
  }),
});
```

<!--
Speaker Notes:
• mutationType adds to Mutation type
• Same pattern as queries
• Multiple arguments with types
• Returns created object
• Type-safe args object
-->

---

# Schema Organization

## Feature-Based Structure

```
backend/src/
├── graphql/
│   ├── builder.ts        # Shared builder instance
│   ├── schema.ts         # Combines all schemas
│   └── server.ts         # Apollo Server setup
└── api/
    ├── expense/
    │   ├── expenseRepository.ts
    │   ├── expenseController.ts
    │   └── augmentGraphqlSchema.ts  # Expense GraphQL types
    └── user/
        ├── userRepository.ts
        └── augmentGraphqlSchema.ts   # User GraphQL types
```

<!--
Speaker Notes:
• Organize by feature, not by layer
• Each feature defines its own GraphQL types
• Keeps related code together
• Easy to find and modify
• Scales better than one large schema file
-->

---

# GraphQL + Prisma Relations

**Prisma handles the joins automatically!**

```typescript
builder.prismaObject('Expense', {
  fields: (t) => ({
    id: t.exposeID('id'),
    description: t.exposeString('description'),
    // Relations - Pothos + Prisma handle the joins!
    payer: t.relation('payer'),
    participants: t.relation('participants'),
  }),
});
```

---

**Query:**

```graphql
{
  expense(id: 1) {
    description
    payer {
      name
    }
    participants {
      name
    }
  }
}
```

**Pothos automatically includes relations when queried!**
(except if you integrate it properly ... which we don't)

<!--
Speaker Notes:
• t.relation leverages Prisma relationships
• Pothos generates efficient database queries
• Only fetches relations when requested in query
• Includes necessary joins automatically
• No N+1 queries - optimized by default
-->

---

# GraphQL Best Practices

✅ **DO:**

- Use variables instead of inline values
- Keep resolvers thin - call repository/service layer
- Organize schema by feature/domain
- Use Pothos or similar for type safety

---

❌ **DON'T:**

- Put business logic in resolvers
- Return too much data by default
- Ignore N+1 query problems

<!--
Speaker Notes:
• Resolvers should delegate to business logic
• Schema organization matters as it grows
• Type safety prevents entire classes of bugs
• Documentation helps frontend developers
• Security and performance are ongoing concerns
-->

---

# GraphQL + REST Together

**You don't have to choose!**

```typescript
// REST endpoints
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);

// GraphQL endpoint
app.use('/graphql', graphqlMiddleware);
```

**Use each for what it does best:**

- GraphQL: Complex queries, related data
- REST: File uploads, simple CRUD, webhooks

<!--
Speaker Notes:
• Both can coexist in same application
• Use GraphQL for complex data fetching
• Keep REST for file uploads, downloads, webhooks
• Gradual migration possible
• Start with GraphQL for new features
• No need to rewrite everything at once
-->

---

# Common GraphQL Patterns

**Pagination:**

```graphql
expenses(first: 10, after: "cursor") {
  edges {
    node { id, description }
    cursor
  }
  pageInfo {
    hasNextPage
    endCursor
  }
}
```

---

**Filtering:**

```graphql
expenses(where: { amount: { gt: 10 } }) {
  id
  description
}
```

<!--
Speaker Notes:
• Cursor-based pagination for large datasets
• Relay-style connections common pattern
• Filtering through where argument
• Can build complex query capabilities
• GraphQL specification doesn't mandate these
• Community conventions for consistency
-->

---

# Key Takeaways

1. **GraphQL eliminates over/under-fetching** - Ask for exactly what you need
2. **Single endpoint, flexible queries** - Client controls response shape
3. **Strong typing** - Schema defines API contract
4. **Apollo** - Industry-standard implementation
5. **Pothos + Prisma** - End-to-end type safety
6. **Queries vs Mutations** - Semantic distinction for read vs write
7. **Coexist with REST** - Use both where appropriate

<!--
Speaker Notes:
• GraphQL solves real problems with REST
• Not a replacement but a complement
• Type safety from database to frontend
• Tools and ecosystem are mature
• Production-ready for most use cases
• Consider team experience and project needs
-->

---

# When GraphQL Shines

**Perfect for:**

- 📱 Mobile apps with limited bandwidth
- 🚀 Internal API (between server & mobile or web app)
- 🔗 Complex, interconnected data

**The flexibility pays off as your application grows**

<!--
Speaker Notes:
• Mobile benefits from reduced data transfer
• Different clients can request different fields
• Natural fit for graph-like data structures
• Frontend can evolve without backend changes
• GraphQL can aggregate multiple services
• Initial setup overhead worth it for complex apps
-->
