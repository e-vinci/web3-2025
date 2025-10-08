---
title: '<WIP>Lesson 5 – GraphQL' 
description: 'Integrate GraphQL into your existing expense-sharing application using Apollo Server and Apollo Client, and explore the benefits of flexible data fetching compared to REST.' 
publishDate: 2025-10-24T00:00:00Z
excerpt: 'Learn how to set up GraphQL in your fullstack app, write queries and mutations, and compare GraphQL with REST through practical exercises.' 
tags:
- graphql
- apollo
- express
- prisma
- react
- typescript
- course
- web3-2025

category: 'course-lesson'
---
## Course material

- [Presentation Slides](https://raw.githubusercontent.com/e-vinci/web3-2025/refs/heads/main/src/slides/lesson-5-theory.pptx)
  

## Introduction

In this lesson, we will extend our collaborative **expense-sharing app** with **GraphQL**. 

You’ll use **Apollo Server** on the backend and **Apollo Client** on the frontend to run **GraphQL queries** and **mutations**. The main goal is to understand how GraphQL allows clients to fetch exactly the data they need and how it compares to REST.

---

## Recommended Reading

- [GraphQL Official Website](https://graphql.org/)
- [GraphQL Schema and Types](https://graphql.org/learn/schema/)
- [GraphQL Queries](https://graphql.org/learn/queries/)
- [GraphQL Mutations](https://graphql.org/learn/mutations/)
- [Apollo Server Docs](https://www.apollographql.com/docs/apollo-server/)
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)

---

## Exercises

### 1. Add Apollo Server to Your Backend

**Goal:** Add a GraphQL endpoint to your existing Express server while keeping your REST API intact.

**Steps:**

1. Install required packages:
```bash
npm install @apollo/server @as-integrations/express5 graphql ruru
```

2. In a new file `src/graphql/middleware.ts`, start an Apollo Server, and export it as a middleware

```ts
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";

const typeDefs = `#graphql
     type Query { hello: String }
   `;

const resolvers = {
  Query: { hello: () => "Hello GraphQL!" },
};

const server = new ApolloServer({ typeDefs, resolvers });
await server.start();

const graphqlMiddleware = expressMiddleware(server);

export default graphqlMiddleware;
```

Then load it in your `server.ts` middleware stack. At the beginning of your file (before loading `helmet()` middleware), you can conditionally load ruru: an interface for easily playing with your graphQL API.


```ts
import graphqlMiddleware from "./graphql/middleware";
//...
const app: Express = express();

if (env.isDevelopment) {
    const config = { endpoint: "/graphql" };
    // Serve Ruru HTML
    app.get("/ruru", (req, res) => {
    res.format({
        html: () => res.status(200).send(ruruHTML(config)),
        default: () => res.status(406).send("Not Acceptable"),
    });
});
// ...
app.use("/graphql", graphqlMiddleware);
}
```
> Express middlewares are added in sequence. By adding ruru before helmet, we ensure that we do not need to configure CSP for ruru.

Now is also a good time for adding [graphQL extension](https://marketplace.visualstudio.com/items?itemName=GraphQL.vscode-graphql) to VSCode and help it understand your graphQL schema by adding these lines to your package.json.

```json
"graphql": {
  "schema": "https://localhost:3000/graphql",
  "documents": "**/*.{graphql,js,ts,jsx,tsx}"
},
```


3. Start your backend and open [http://localhost:3000/ruru](http://localhost:3000/ruru). You should see an editor.


Important: If you encounter an issue about top level await being unsupported with cjs modules, ensure your `package.json` has the line `"type": "module","`
   
4. Test your first query and observe the result
```graphql
{
  hello
}
```

---

### 2. Define Schema and Query for Expense Details

**Goal:** Create a schema for expenses and users, and a query to fetch an expense with payer and participants.

**Steps:**

1. Update your graphQL types definitions:
```graphql
type User {
  id: ID!
  name: String!
  email: String
}

type Expense {
  id: ID!
  description: String!
  amount: Float!
  date: String!
  payer: User!
  participants: [User!]!
}

type Query {
  expense(id: Int!): Expense
}
```


2. Implement the resolver by reusing our repository.:
```ts
import * as expenseRepository from "@/api/expense/expenseRepository";
//...
const resolvers = {
  Query: { 
    expense: async (_parent : any, args : any, _context : any) => expenseRepository.getExpenseById(args.id)
  }
};
```

3. Test with ruru:
```graphql
{
  expense(id: 1) {
    description
    amount
    payer { name email }
    participants { name }
  }
}
```

> 💡 **Tip:** GraphQL only returns the fields you ask for — try removing or adding fields in the query to see the difference.

---


### 3. Add Apollo Client to the Frontend

**Goal:** Configure Apollo Client to connect React to your GraphQL endpoint.

**Steps:**

1. Install:
   ```bash
   npm install @apollo/client graphql
   ```

2. Add a new environment variable with the graphQL endpoint in .env and on Render.
   
   ```dotenv
      VITE_GRAPHQL_URL=http://localhost:3000/graphql
   ```

3. Create `src/lib/graphql-client.ts`:
```ts
import { ApolloClient, HttpLink, InMemoryCache, gql } from "@apollo/client";

const API_HOST = import.meta.env.VITE_GRAPHQL_URL;

const client = new ApolloClient({
  link: new HttpLink({ uri: API_HOST }),
  cache: new InMemoryCache(),
});

export default client;
```

4. Wrap your app with `ApolloProvider` in `App.tsx`:
```tsx
import { ApolloProvider } from '@apollo/client/react';
import client from './lib/graphql-client';
//...
function App() {
  return (
    <ApolloProvider client={client}>
      <RouterProvider router={router} />
    </ApolloProvider>
  );
}
```

---

### 4. Query Expense Details with Apollo Client

**Goal:** Fetch expense details using GraphQL in your existing `ExpenseDetails` loader.

**Steps:**

1. In `ExpenseDetails/loader.ts`:
```ts
import type { Expense } from "@/types/Expense";
import type { LoaderFunctionArgs } from "react-router";
import { gql } from "@apollo/client";
import graphqlClient from "@/lib/graphql-client";

const EXPENSE_QUERY = gql`
  query ExpenseDetail($id: ID!) {
    expense(id: $id) {
      id
      description
      amount
      payer {
        name
      }
      participants {
        name
      }
    }
  }
`;

export interface LoaderData {
  expense: Expense;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { data, error } = await graphqlClient.query<{ expense: Expense }>({
    query: EXPENSE_QUERY,
    variables: { id: params.id },
  });

  if (!data?.expense || error) {
    throw new Error(
      "Error while retrieving expense details from the server: " + error
    );
  }

  return { expense: data.expense };
}   
```
2. Thanks to our separation of concerns, the component does not need to change. `useLoaderData()` works exactly the same.

3. Notice how we forgot to get the `bankAccount` of the payer. 

- Add it to the type definition of User (in backend) 
- and in the query (in frontend)

Look how easy it was to get the bank account only for the payer and not for the participants. This is a good illustration of the main strength of graphQL, the frontend can specify exactly which field it needs in the response.

Adding a field to a type definition in backend makes it **available** for the frontend, but it will only be sent on demand.
---


------------------------------------------------------
Resume review here
------------------------------------------------------

### 3. Add Mutation to Create a New Expense

**Goal:** Allow creating expenses via GraphQL.

**Steps:**

1. Extend schema:
   ```graphql
   type Mutation {
     createExpense(
       description: String!,
       amount: Float!,
       date: String!,
       payerId: ID!,
       participantIds: [ID!]!
     ): Expense!
   }
   ```
2. Add resolver:
   ```ts
   Mutation: {
     createExpense: async (_p, args, { prisma }) => {
       const { description, amount, date, payerId, participantIds } = args;
       return prisma.expense.create({
         data: {
           description,
           amount: parseFloat(amount),
           date: new Date(date),
           payer: { connect: { id: Number(payerId) } },
           participants: { connect: participantIds.map((id) => ({ id: Number(id) })) }
         }
       });
     }
   }
   ```
3. Test mutation in Apollo Sandbox:
   ```graphql
   mutation {
     createExpense(description: "Lunch", amount: 42.5, date: "2025-10-08", payerId: "1", participantIds: ["1", "2"]) {
       id
       description
       payer { name }
       participants { name }
     }
   }
   ```

---

### 6. Use GraphQL Mutation for New Expense Form

**Goal:** Replace REST call with GraphQL mutation in the New Expense form.

**Steps:**

1. Import `apolloClient` and use a mutation similar to:
   ```ts
   const CREATE_EXPENSE = gql`
     mutation CreateExpense($description: String!, $amount: Float!, $date: String!, $payerId: ID!, $participantIds: [ID!]!) {
       createExpense(description: $description, amount: $amount, date: $date, payerId: $payerId, participantIds: $participantIds) {
         id
         description
       }
     }
   `;
   ```
2. Call the mutation inside the submit handler.


### 7. Organize the code correctly

**Goal:** Organize the code in order to allow easier maintenance. Colocate code related to same concepts. Leverage Pothos for building the graphQL API from multiple modules.

Idea : 
- split code related to expense, user, transaction in their own folder under a normalized name : <topic>/graphql-builder.ts or something similar
- Follow guidelines of https://pothos-graphql.dev/docs/guide/app-layout 
-  Do not try to make it too complicated, the point is mostly code organisation, not Pothos advanced techniques

References : 
- https://pothos-graphql.dev/docs/plugins/prisma
- https://pothos-graphql.dev/docs/guide/app-layout

---

### (Bonus) Add Cursor-Based Pagination to Transactions

**Goal:** Replace the REST-based transaction list with a paginated GraphQL query loading 10 items at a time.

**Steps:**

1. Update schema:
   ```graphql
   type TransactionConnection {
     edges: [Expense!]!
     cursor: String!
     hasMore: Boolean!
   }

   extend type Query {
     transactions(after: String, limit: Int = 10): TransactionConnection!
   }
   ```
2. Resolver example (simplified):
   ```ts
   Query: {
     transactions: async (_p, { after, limit }, { prisma }) => {
       const cursor = after ? { id: Number(after) } : undefined;
       const expenses = await prisma.expense.findMany({
         take: limit + 1,
         skip: cursor ? 1 : 0,
         cursor,
         orderBy: { id: 'desc' },
         include: { payer: true, participants: true }
       });

       const hasMore = expenses.length > limit;
       const items = hasMore ? expenses.slice(0, -1) : expenses;

       return {
         edges: items,
         cursor: items.at(-1)?.id.toString(),
         hasMore,
       };
     }
   }
   ```
3. In the frontend, use Apollo’s `fetchMore()` to load additional pages when clicking **“Load More”**.
4. Display the new transactions below the existing ones.

> 🔗 **Reference:** [Apollo Client – Pagination Guide](https://www.apollographql.com/docs/react/pagination/core-api/)

---

## Final Discussion: REST vs GraphQL

Reflect on the following:

- When is GraphQL more efficient than REST?
- How does GraphQL reduce overfetching?
- What are the trade-offs in complexity and caching?
- Which parts of your app benefit most from GraphQL?

> 💬 **Prompt:** “Would you use GraphQL for the whole project, or a hybrid with REST? Why?”

---

## Summary

- Added Apollo Server to Express backend.
- Defined GraphQL types, queries, and mutations.
- Connected Apollo Client on the frontend.
- Replaced REST endpoints for selected features.
- Implemented cursor-based pagination.
- Compared GraphQL vs REST in terms of flexibility and complexity.

> ✅ You now have a working GraphQL API integrated into your expense-sharing app!

