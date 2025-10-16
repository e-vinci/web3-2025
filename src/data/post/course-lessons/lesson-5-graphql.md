---
title: 'Lesson 5 – GraphQL' 
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

### 5. Add Mutation to Create a New Expense

**Goal:** Allow creating expenses via GraphQL.

**Steps:**

1. Extend your graphQL schema ( typeDefs), add the `createExpense` mutation:
   ```graphql
    type Mutation {
      createExpense(
        description: String!,
        amount: Float!,
        date: String!,
        payerId: Int!,
        participantIds: [Int!]!
      ): Expense!
   }
   ```

2. Add a resolver for your Mutation:
    ```ts
    const resolvers = {
    //...
    Mutation: {
      createExpense: async (_parent: any, args: any, _context: any) => {
        const { description, amount, date, payerId, participantIds } = args;
        const parsedDate = new Date(date);
        return expenseRepository.createExpense({ description, amount, date: parsedDate, payerId, participantIds })
      }
    },
    };
    ```
3. Test mutation in ruru
   ```graphql
   mutation {
     createExpense(description: "Lunch", amount: 42.5, date: "2025-10-08", payerId: 1, participantIds: [1, 2]) {
       id
       description
     }
   }
   ```

   Notice that we cannot ask the payer or participants because our current implementation of `expenseRepository.createExpense` only return the bare expense without any relations. 

---

### 6. Use GraphQL Mutation for New Expense Form

**Goal:** Replace REST call with GraphQL mutation in the New Expense form.

**Steps:**

1. Adapt `frontend/src/pages/NewExpense/Component.tsx`, import the client and define the mutation you are going to call.

```ts
import { gql } from '@apollo/client';
import graphqlClient from '@/lib/graphql-client';
//...
const CREATE_EXPENSE_GQL = gql`
  mutation CreateExpense($description: String!, $amount: Float!, $date: DateTime!, $payerId: Int!, $participantIds: [Int!]!) {
    createExpense(description: $description, amount: $amount, date: $date, payerId: $payerId, participantIds: $participantIds) {
      id
      description
    }
  }
`;
//...
```

2. Call the mutation inside the submit handler instead of the previous call to apiClient.
   
```tsx
 try {
      await graphqlClient.mutate({
        mutation: CREATE_EXPENSE_GQL,
        variables: {
          description: data.description,
          amount: data.amount,
          date: data.date,
          payerId: Number(data.payerId),
          participantIds: data.participantIds.map(id => Number(id)),
        },
      });
      toast('Expense has been created.');
      return navigate('/transactions');
    } catch (error) {
    //...
```

Notice that we made the choice of defining the code for the mutation directly in the component, we did not create a specific function `graphqlClient.createExpense(...)` like we did for the REST API.

This choice is driven by the nature of graphQL to specify what results we want. Here we get id and description of the created expense even tough we do nothing with it. This is only useful for helping debugging. We should have asked nothing back since we are redirecting.


### 7. Organize the code correctly

**Goal:** Organize the code in order to allow easier maintenance. Colocate code related to same concepts. Leverage Pothos for building the graphQL API from multiple modules.

Everything we have done until now is working but it won't be easy to maintain. There are many type definitions spread across the app and any change would force us to change code in multiple places. This will eventually lead to errors.

Additionally, having 20 or more tables and at least as many queries and mutations would make our schema very hard to maintain.

Let's reorganize our code and integrate our graphQL schema with our prisma definition when possible.

**Steps:**

1. Let's install **pothos** a library for building our graphQL schema bit by bit, and its prisma integration plugin.

```bash
npm install --save @pothos/core @pothos/plugin-prisma

```

> Note: Pothos also has a plugin for doing validation, typically with zod, have a look at it : https://pothos-graphql.dev/docs/plugins/validation

1. Let's split our `graphql/middleware.ts` file in 3 files :
   - **graphql/server.ts** : is the file responsible for starting the server and exposing the middleware to express, it requires the schema from
   - **graphql/schema.ts** : is the file responsible for exporting the schema, it will do so by getting the builder and all the augmentation functions
   - **graphql/builder.ts** : will initiate the builder which can then be used by any augmentation functions

  We will then have augmentation functions in each of the `src/api/topic/` folders.

Here is the code you will need for this split (it's mostly boilerplate)

```ts
//server.ts
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import schema from "./schema";

const server = new ApolloServer({schema: schema});
await server.start();

const graphqlMiddleware = expressMiddleware(server);

export default graphqlMiddleware;
```

```ts
//schema.ts
import builder from "./builder";
// import augmentExpenseSchema from "../api/expense/augmentGraphqlSchema";
// import augmentUserSchema from "../api/user/augmentGraphqlSchema";

// augmentExpenseSchema(builder);
// augmentUserSchema(builder);

const schema = builder.toSchema();
export default schema;
```

```ts
//builder.ts
import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import type PrismaTypes from "../../generated/pothos-prisma-types";
import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();

const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
  },
});

export default builder;
```

Notice how some lines are commented out in `schema.ts`. This is because the actual augmentation will happen in files stored under the `src/api/topic/` folder.

1. Let's augment our schema with everything related to expenses:
   
create the file `backend/src/api/expense/augmentGraphqlSchema.ts`

```ts
import SchemaBuilder from "../../graphql/builder";
import * as expenseRepository from "./expenseRepository";

const augmentSchema = (builder : typeof SchemaBuilder) => {
  //...
}


export default augmentSchema;

```

3. Declare a new type for Expense and map it to Expense objects received from Figma

```ts
    const ExpenseRef = builder.prismaObject('Expense', {
        fields: (t) => ({
            id: t.exposeID('id'),
            description: t.exposeString('description'),
            amount: t.exposeFloat('amount'),
            date: t.string({ 
                resolve: (parent: object) => parent.date.toISOString() 
            }),
            payer: t.relation('payer'),
            participants: t.relation('participants')
        }),
    });
```

With pothos, we can declare the type of our graphQL object and how it relates to our javascript object. Currently they are very similar, but we could add fields which exist on graphQL but not on the prisma object.

```ts
    const ExpenseRef = builder.prismaObject('Expense', {
        fields: (t) => ({
            //...
            isForSelf: t.boolean({
              resolve: (parent) => {
                return [parent.payerId] == parent.participants.map(p => p.id )
              },
            }),
        }),
    });
```

`parent` is the object we want to manipulate in the backend, currently it is the object we get from prisma. This object usually has some specific fields and methods that we do not want to expose. Pothos enables us to easily manipulate both. Pothos calls the business objects "backing models" : https://pothos-graphql.dev/docs/guide/schema-builder


4. Add the query for easily getting an expense by id.

```ts
    builder.queryType({
        fields: (t) => ({
            expense: t.field({
                type: ExpenseRef,
                args: { 
                    id: t.arg.int({ required: true })
                },
                resolve: async (_root, args, _ctx, _info) => {
                    return expenseRepository.getExpenseById(args.id as number)
                }
            }),
        }),
    });
``` 

5. Add the mutation for easily creating an expense.

```ts
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
                resolve: async (_parent, args, _context, _info) => {
                    const { description , amount, date, payerId, participantIds } = args;
                    return expenseRepository.createExpense({ description, amount, date, payerId, participantIds })
                }
            }),
        }),
    });
```

6. Create the file `backend/src/api/user/augmentGraphqlSchema.ts`, follow the same logic for exposing the `User` type

7. Check with ruru that everything is still working properly.

You're done ! You now have a full blown application with both a REST api a GraphQL API and organized in a way which allows for clean maintenance and growth.

### (Bonus) Add Cursor-Based Pagination to Transactions

**Goal:** Replace the REST-based transaction list with a paginated GraphQL query loading 10 items at a time.

---

## Summary

- Added Apollo Server to Express backend.
- Defined GraphQL types, queries, and mutations.
- Connected Apollo Client on the frontend.
- Replaced REST endpoints for selected features.
- Implemented cursor-based pagination.
- Compared GraphQL vs REST in terms of flexibility and complexity.

> ✅ You now have a working GraphQL API integrated into your expense-sharing app!

