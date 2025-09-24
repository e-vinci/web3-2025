---
title: 'Lesson 4 – Advanced State Management'
description: 'Expand the expense-sharing app with multiple users, transfers, and improved data flow, focusing on state management in both backend (Express + Prisma) and frontend (React Router loaders/actions and global state).'
publishDate: 2025-10-17T00:00:00Z
excerpt: 'Introduce multi-user support and money transfers to the app, using a robust Express TypeScript backend with Prisma and advanced state handling in React Router.'
tags:
  - react
  - typescript
  - express
  - prisma
  - react-router
  - tailwind
  - course
  - web3-2025
category: 'course-lesson'
---

## Course material

- [Presentation Slides](https://raw.githubusercontent.com/e-vinci/web3-2025/refs/heads/main/src/slides/lesson-4-theory.pptx)

## Introduction

Now that our application has basic features and a polished interface, we will take a big step forward by introducing **multiple users** and **money transfers** to our expense-sharing app. 
On the backend, we'll migrate to a more robust Express + TypeScript template and design a relational database schema using Prisma for users, expenses, and transfers. 
On the frontend, we'll leverage React Router’s Data APIs (loaders and actions) and global state (context) to handle more complex interactions like selecting a current user and loading combined data.

By the end of this lesson, our app will support multiple users who can owe or pay each other. We’ll have a unified **Transactions** list (combining expenses and direct transfers), the ability to record transfers of money, and a personal view for a selected user to see their own balance. This will involve significant changes: updating our API endpoints, enhancing our Prisma models with relationships, and refactoring the React app to use React Router’s recommended patterns for data loading and mutations.

> **Note:** We’re moving our backend from the simple Express generator setup to a more scalable template that uses TypeScript and best practices (including better project structure, error handling, and testing).

As always, commit your work regularly and push to your repository. Continue to deploy on Render and test there as well – any code you write only has value once it is usable by actual users.

## Recommended Reading

- [Express + TypeScript Starter Template (GitHub Repo)](https://github.com/edwinhern/express-typescript) – Familiarize yourself with the project structure and features of the template we’ll use for our backend.
- [Prisma – Relations (Official Docs)](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations) – Learn how to define relations (one-to-many, many-to-many) between models in the Prisma schema.
- [Prisma – Migrate Your Schema (Official Docs)](https://www.prisma.io/docs/orm/prisma-migrate) – Understand how to use Prisma Migrate to apply schema changes to your database safely (as opposed to `db push`).
- [React Router – Data Loading (Official Docs)](https://reactrouter.com/en/main/routers/picking-a-router#data-loading) – Review how to fetch data with route **loaders** and access it via `useLoaderData`.
- [React Router – Data Mutations with Actions (Official Docs)](https://reactrouter.com/en/main/routers/picking-a-router#data-mutations) – See how to use route **actions** and the `<Form>` component to handle form submissions and then revalidate loader data.

## Exercises

All exercises continue building on our collaborative expense-sharing app. We will start fresh with a new backend structure but will carry over and extend the functionality from lessons 1–3. Make sure you have your previous code handy for reference, but be prepared to reorganize it. The frontend will be refactored within the existing Vite React project from lesson 3.

### 1. A new Backend Template

**Goal**: Set up a new Express backend using a modern TypeScript boilerplate, then integrate Prisma for database access.

- **Clone Template**: In your `backend/` directory (you can create a new folder or replace the old one), clone the Express+TS template repository:
  ```bash
  git clone https://github.com/edwinhern/express-typescript.git backend
  ```
  This boilerplate provides a structured starting point (TypeScript, project architecture, testing, etc.). Navigate into `backend/` and run `npm install` to install dependencies.
- **Review Structure**: Open the project and briefly examine the structure. You’ll see an organized layout under `src/`: 
  - an `api` folder where we will write features (with subfolders for like `user`, and `healthcheck`)
  - an `api-docs` folder for serving the documentation of our API. We will not spend time maintaining the documentation of our API in the scope of this course, but the template is ready for it.
  - a `common` folder for middleware setup and other conveniences (logging, environment validation with Zod, etc.). 
  
  Take note of the different files under the `user` feature: Router, Model, Controller, Service, Repository – we will follow this pattern for our new features. Notice as well that each feature has its own automated tests in a `__tests__` directory. These are based on the tool [vitest](https://vitest.dev/), in the scope of this course we will not write tests, but if we did, each feature folder would have their own. tests.


- **Environment Setup**: Copy the provided `.env.template` to a new `.env` file in the backend folder. Fill in any required env vars. Set your `PORT` to `3000` and `CORS_ORIGIN` to `http://localhost:5173` (the url of your frontend) . We will add a database connection URL here later.
- 
- **Run the Template**: Try running the server in dev mode to ensure everything is working:
  ```bash
  npm run start:dev
  ```
  If you have an issue about IPV6, change these lines in `src/common/middleware/rateLimiter.ts`

  ```ts
  import { rateLimit, ipKeyGenerator } from "express-rate-limit";
  //...
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip  as string),
  //...
  ```

  You should see the backend app start, validates that you can hit `http://localhost:3000/health-check` in your browser or your REST client. You can see in your dev console that this template has a lot of security already configured, mostly via the library [helmet](https://helmetjs.github.io/)

- **Add Prisma to the Project**: Stop the server. We will now integrate Prisma into this template.
  - Install Prisma as a development dependency and initialize it:
    ```bash
    npm install prisma --save-dev
    npx prisma init
    ```
    This creates a `prisma/` directory with a `schema.prisma` file and adds a `DATABASE_URL` entry in your `.env file`. 
    The default value will allow you to work with a local Postgres server that you can run with the command `npx prisma dev`. 
    You can keep that value (and start the server) while you developer, or use the value from Lesson 2 and work directly on your hosted database.

  - We recommend that you use a local database in development and only connect the cloud hosted when you are debugging production issues. In real life, the production database will never be accessible from your own machine and using the production database during development will break the production app and drive your teammates crazy. Keep in mind that even if you are currently a solo developer working on an app without users, this is not the case in real life. Use `npx prisma dev` in development or any other way of hosting a local db. 



- **Verify DB Connection**: Run the command:
  ```bash
  npx prisma db pull
  ```
  This will check the connection and pull any existing schema (if your DB is new/empty, it will succeed with no models). If you get an error, double-check your `DATABASE_URL` and that the database exists/reachable.

- **Prepare Dev Database**: If using a fresh database with no tables, that’s fine – we’ll create tables via Prisma soon. If you had existing tables from previous exercises, consider starting with a clean slate for this lesson (you can always reseed data).
  

---

### 2. Data Models and Migration

**Goal**: Define the new Prisma data models for `User`, `Expense`, and `Transfer` with proper relations, then create and apply a migration to update the database schema.

Our app now requires understanding **who** paid or transferred money to whom. We will introduce a `User` model and link it to expenses and transfers. We’ll also modify the existing `Expense` model to reference users instead of using plain strings.

- **Define `User` Model**: Open `prisma/schema.prisma`. Under the `datasource` and `generator` blocks, define a new model for users:

  ```prisma
  model User {
    id          Int     @id @default(autoincrement())
    name        String
    email       String  @unique
    bankAccount String? // optional
    paidExpenses    Expense[] @relation("PayerExpenses")
    transfersOut Transfer[] @relation("UserTransfersSource")
    transfersIn  Transfer[] @relation("UserTransfersTarget")
    participatedExpenses    Expense[] @relation("ParticipantExpenses")
  }
  ```

  We mark email unique to simulate a real system constraint.
  Notice how we named all relation field, this is usually not necessary but we use a very dense data model with multiple relations between each model, and therefore we need to name our relations for letting Prisma know which FK relates to which relation.

- **Update `Expense` Model**: Modify the `Expense` model (you may have one from Lesson 2; if not, create it):

  ```prisma
  model Expense {
    id           Int      @id @default(autoincrement())
    description  String
    amount       Float
    date         DateTime @default(now())
    payer        User     @relation("PayerExpenses", fields: [payerId], references: [id])
    payerId      Int
    participants User[]   @relation("ParticipantExpenses")
  }
  ```

  Changes made:
  - `payer` is now a **relation** to the User model (with a foreign key `payerId`). This replaces the old `payer` string field.
  - `participants` is a many-to-many relation to `User`. This will implicitly create a join table between `Expense` and `User` behind the scenes. Look at the [documentation](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/many-to-many-relations#implicit-many-to-many-relations) for understanding how join tables can be ignored by the backend and mapped to collections.

- **Define `Transfer` Model**: Add a new model for transfers:

  ```prisma
  model Transfer {
    id        Int    @id @default(autoincrement())
    amount    Float
    date      DateTime @default(now())
    source    User   @relation("UserTransfersSource", fields: [sourceId], references: [id])
    sourceId  Int
    target    User   @relation("UserTransfersTarget", fields: [targetId], references: [id])
    targetId  Int
  }
  ```

  A `Transfer` represents money moving from one user to another:
  - `source` is the user who paid/sent the money.
  - `target` is the user who received the money.
    We include a `date` here as well for consistency (when the transfer happened) and a positive `amount` (you may want to enforce positivity with validation logic, but not via Prisma schema directly).

- **Create a Migration**: Now that the models are defined, we will use Prisma Migrate to apply these changes:
  ```bash
  npx prisma migrate dev --name add-users-and-transfers
  ```
  This command will:
  - Generate a SQL migration file (under `prisma/migrations/`) reflecting the changes (new tables for User and Transfer, updated Expense table with new columns and join table for participants).
  - Apply the migration to your database. If all goes well, your database now has three tables (plus an implicit join table for Expense <-> User many-to-many).
  - Update the Prisma Client to be in sync with the new schema (this happens automatically on migrate; alternatively you could run `npx prisma generate`).

> **Note:** In the previous lesson, we saw how the db client code is not versioned, most notably because it requires its own value of the DATABASE_URL. We had to add a step in the CI for generating the database client : `npx prisma generate`. Now we will need to add a new step after generating the client but before starting the app: executing the migrations. The command for executing migrations is `prisma migrate deploy`

- **Verify the Schema in DB**: Use Prisma Studio or a database client to inspect the tables:

  ```bash
  npx prisma studio
  ```

  Check that you have Models for `User`, `Expense`, and `Transfer`.

- **Seeding Initial Data**: Now populate the database with some mock data for development:
  - Create a few users, e.g., Alice, Bob, and Charlie. Give them distinct emails and maybe bankAccount values.
  - Create a few expenses:
  - Create a few transfers
- - **How to seed**: The easiest way is using Prisma Client in a Node script :

    ```ts
    // prisma/seed.ts
    import { PrismaClient } from '../src/generated/prisma/client';
    const prisma = new PrismaClient();
    async function main() {
      await prisma.user.createMany({
        data: [
          { name: 'Alice', email: 'alice@example.com', bankAccount: 'BE00 1111 1111 1111' },
          { name: 'Bob', email: 'bob@example.com', bankAccount: 'BE00 2222 2222 2222' },
          { name: 'Charlie', email: 'charlie@example.com', bankAccount: null },
        ],
      });
      // Create an expense: Alice pays 100 shared with Bob and Charlie
      const alice = await prisma.user.findFirst({ where: { email: 'alice@example.com' } });
      const bob = await prisma.user.findFirst({ where: { email: 'bob@example.com' } });
      const charlie = await prisma.user.findFirst({ where: { email: 'charlie@example.com' } });
      if (alice && bob && charlie) {
        const expense1 = await prisma.expense.create({
          data: {
            description: 'Dinner at La Trattoria',
            amount: 100.0,
            date: new Date(),
            payerId: alice.id,
            participants: { connect: [{ id: bob.id }, { id: charlie.id }, { id: alice.id }] },
          },
        });
        const expense2 = await prisma.expense.create({
          data: {
            description: 'Taxi from airport',
            amount: 40.0,
            date: new Date(),
            payerId: bob.id,
            participants: { connect: [{ id: alice.id }, { id: bob.id }] },
          },
        });
        await prisma.transfer.create({
          data: {
            amount: 50.0,
            date: new Date(),
            sourceId: alice.id,
            targetId: bob.id,
          },
        });
        await prisma.transfer.create({
          data: {
            amount: 20.0,
            date: new Date(),
            sourceId: charlie.id,
            targetId: alice.id,
          },
        });
      }
    }
    main()
      .catch((e) => console.error(e))
      .finally(async () => {
        await prisma.$disconnect();
      });
    ```

    This is just an example, adapt it as you wish. 
    You can run this script with `tsx prisma/seed.ts`. If you do not have `tsx` installed, you can install it with `npm install -D tsx`

    In order let prisma run your seed script whenever you reset your data ( `prisma migrate reset`) you can add a prisma configuration file with the script location. We will also use it to explicitely tell it where are the different resources it needs (the schema file, the migration files; etc.)

    Add the file `.prisma/config.ts` at the root of your `backend` folder with the following content.

    ```ts
      import path from "node:path";
      import "dotenv/config";
      import { defineConfig } from "prisma/config";

      export default defineConfig({
        schema: path.join("prisma", "schema.prisma"),
        migrations: {
          path: path.join("prisma", "migrations"),
          seed: `tsx prisma/seed.ts`,
        },
        views: {
          path: path.join("prisma", "views"),
        },
        typedSql: {
          path: path.join("prisma", "queries"),
        },

      });
    ```

     After seeding, use Prisma Studio to confirm that the data is in the tables: `npx prisma studio`
     Notice how the Exense.participants fields is an array of User. The join table is entirely hidden in this tool.

- At this point, our database state is initialized with some example data. We have successfully managed complex state on the backend: multiple models and relationships that mirror real-world connections between data. Next, we’ll expose this data via new API endpoints.

---

### 3. Backend API Changes

**Goal**: Implement new REST API endpoints for users, transfers, and combined transactions, and refactor existing routes to conform to the template’s structure and the new schema.

Our Express template uses a structure where each feature (e.g., `user`) has its own router, controller, service (or repository/model) files. We will add new feature modules for `expense` and `transfer`, and adjust the existing expense logic from prior lessons to use Prisma.

#### **Delete api documentation feature**: 

Because of the time constraint, we will not be registering our routes to the openAPI documentation. We will not be validating the request payload according to that documentation neither. In a professional project, these are necessary actions because you want to guarantee to people using your API that the documentation is up to date and enforced. You can try to do it as an additional exercice, taking inspiration from the [template](https://github.com/edwinhern/express-typescript/blob/master/src/api/user/userRouter.ts). 

You can delete the `api-docs` folder, and adapt the health-check router and server.ts

#### **Set Up Expense Module**: 

In `src/api/`, create a folder for `expense`. Inside, create:
  - `expenseRouter.ts`: The Express router defining routes and linking to controller methods. 
  
    ```ts
      import { Router } from 'express';
      import * as ExpenseController from './expenseController';
      const router = Router();
      router.get('/', ExpenseController.listExpenses);
      router.post('/', ExpenseController.createExpense);
      router.get('/:id', ExpenseController.getExpenseDetail);

      export default router;
    ```

  - `expenseController.ts`: Functions to handle incoming requests and formulate responses (calls the model/repository functions). Here is an example. Notice that we do not leverage ServiceResponse nor have a Service object, this is related to our choice of skipping input/output validation and autogeneration of documentation.

    ```ts
      import type { Request, Response } from "express";
      import * as expenseRepository from './expenseRepository';
      import { StatusCodes } from "http-status-codes/build/cjs/status-codes";

      export async function listExpenses(req: Request, res: Response) {
          const expenses = await expenseRepository.getAllExpenses();
          res.status(StatusCodes.OK).json(expenses);
      }

      export async function getExpenseDetail(req: Request, res: Response) {
          const id = Number(req.params.id);
          const expense = await expenseRepository.getExpenseById(id);
          if (!expense) {
            return res.status(StatusCodes.NOT_FOUND).json({ error: 'Expense not found' });
          }
          res.status(StatusCodes.OK).json(expense);
      }


      export async function createExpense(req: Request, res: Response) {
          const { description, amount, date, payerId, participantIds } = req.body;

          const newExpense = await expenseRepository.createExpense({
            description,
            amount: parseFloat(amount),
            date: date ? new Date(date) : new Date(),
            payerId: Number(payerId),
            participantIds: participantIds
          });
          res.status(StatusCodes.CREATED).json(newExpense);
      }
    ```
  


  - `expenseRepository.ts`: This will use Prisma Client to interact with the DB, similar to Services from previous lessons. Pay attention to the create function as it is more complex than it looks. You will need to create an expense associated with the correct participants but you will only receive their ids from the frontend. Prisma has a concept of [**connecting** records](https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries#connect-multiple-records) which will help you do that. Here is an example of the Repository: 

    ```ts
      import { PrismaClient } from '../../generated/prisma';

      const prisma = new PrismaClient();

      export async function getAllExpenses() {
        return prisma.expense.findMany({
          include: {
            payer: true,
            participants: true,
          },
        });
      }

      export async function getExpenseById(id: number) {
        return prisma.expense.findUnique({
          where: { id },
          include: {
            payer: true,
            participants: true,
          },
        });
      }

      export async function createExpense({
        description,
        amount,
        date,
        payerId,
        participantIds,
      }: {
        description: string;
        amount: number;
        date: Date;
        payerId: number;
        participantIds: number[];
      }) {

        return prisma.expense.create({
          data: {
            description,
            amount,
            date,
            payer: { connect: { id: payerId } },
            // { connect: [{id: 1}, {id: 123}, {id: 99}]}
            participants: { connect: participantIds.map((id) => ({ id })) },
          },
        });
      }
    ```

 - `expenseRequests.http`: This will help you test the the routes with your REST Client.
  
    ```http
      @hostname = localhost:3000

      ### Get all expenses
      GET http://{{hostname}}/api/expenses
      Content-Type: application/json

      ### Get expense by ID
      GET http://{{hostname}}/api/expenses/1
      Content-Type: application/json

      ### Create new expense
      POST http://{{hostname}}/api/expenses
      Content-Type: application/json

      {
        "description": "Office Supplies",
        "amount": 45.99,
        "payerId": 1,
        "participantIds": [1, 2]
      }

      ### Create new expense (Error, wrong participant ID)
      POST http://{{hostname}}/api/expenses
      Content-Type: application/json

      {
        "description": "Office Supplies",
        "amount": 45.99,
        "payerId": 1,
        "participantIds": [1, 99]
      }
    
    ```



#### **Implement User Routes**: 

The template already has a basic `userRouter` and `userController` for a sample user endpoint (check `src/api/user`). These are only present for illustrating what is a router, controller, model (which we call repository), and service. It also shows how to register the api endpoint and generate documentation for it, and how to validate and coerce input. We will not be using those features of the template because of the time constraint, but you should definitely follow a similar idea in a professional setting (documenting endpoint and validating input)
  
You can delete the `src/api/user` directory and start from scratch, or you can adapt it if you feel more comfortable. But there should be no line of code at the end of the exercice that you do not understand and own; we highly recommend that you delete the whole folder once you understand how the different files articulates.

Following a similar approach than the one used for expense, implement the following route

  - `GET /users`: return list of all users.


#### **Implement Transfer Routes**: 

Create a new `transfer` module in `src/api/transfer`: You need to list and create transfer, similar to what you did for expenses.

#### **Combined Transactions Endpoint**: 

Create an endpoint for getting all transactions (expenses and transfers). Otherwise you'll send two requests from the frontend and combine these in the frontend.

The main advantage of doing a combined endpoint is pagination but this is out of scope for this lesson.

Because Transaction is not a prisma model, you need another way of ensuring its type. Use zod for this. You can take inspiration from the [template](https://github.com/edwinhern/express-typescript/blob/master/src/api/user/userModel.ts)

Your frontend will likely want to know whether a specific transaction is an expense or a transfer, do not forget to add a `kind` field for that case.  This is similar to [discriminated unions in typescript](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions)


You will also need to transform Expense and Transfer into Transaction, the easiest approach for this is to write functions like `fromExpense` and `fromTransfer` directly into your `TransactionModel.ts` module. These functions will expect a parameter which include relations, but when you import a type from Prisma, you will NOT have any relations included. Fortunately, you can easily ask Prisma for a type including relations using `Prisma.XXXXGetPayload< ... >`, more info [here](https://medium.com/@jkc5186/understanding-typescript-types-with-prisma-e0e41a7d98f3).

Here is an example: 

```ts
type TransferWithSourceAndTarget = Prisma.TransferGetPayload<{
    include: {
        source: true,
        target: true,
    }
}>;
```


- **Test the API**: Use a REST client and your different .http files  to verify each endpoint:
  - GET `/api/users` – should list your seeded users.
  - GET `/api/expenses` – should list expenses with their payer and participants (verify that the data structure is as expected, e.g., participants is an array of user objects).
  - GET `/api/transfers` – list of transfers with source and target user info.
  - GET `/api/transactions` – combined list of both, sorted by date.
  - GET `/api/expenses/{id}` – details of a single expense (make sure it includes participants and payer info).
  - POST `/api/transfers` with a JSON body (e.g., `{ "amount": 5, "sourceId": 1, "targetId": 2 }`) – should create a new transfer.
  - POST `/api/expenses` with a new expense (e.g., `{ "description": "Coffee", "amount": 3, "payerId": 2, "participantIds": [1,2] }`) – should create expense with Bob as payer and Bob & Alice as participants.

  - Also ensure error handling middleware in the template will catch and respond with errors appropriately.


---

### 4. Better Frontend Routing

**Goal**: Refactor the React frontend to use React Router’s loader API for fetching data. Also adopt a structured routing setup (with a layout route and nested routes) as recommended by React Router docs.

We want to separate the code responsible for communicating with the API in its own module, out of react.
We’ll also introduce a **layout page** to manage common UI (like the NavBar and user selection) and share data (like the current user or language) across routes.

Some components will now be related to other pieces of code: loader functions, types and interface, constants, etc. These components will be stored in a directory of the component name, and the directory will be named after the Component. The directory will have an `index.ts` file for allowing easy import. The various files will never be imported directly, only the directory represent the module. Having different files will allow us to benefit from a better DX: autorefresh in browser, side by side files in editor, etc.

**Step-by-step:**

#### **Starting point**: 

We assume you have completed last week mandatory exercices. If not, you can use [this solution](https://github.com/e-vinci/web3-2025/tree/main/exercises/lesson-3-routing-style/frontend)

#### **Create a Router Configuration**: 

In your `frontend/src/main.tsx` (or wherever you render `<App/>`), set up a React Router provider like this: 

  ```tsx
  import ReactDOM from 'react-dom/client';
  import { createBrowserRouter, RouterProvider } from 'react-router-dom';

  import Layout, { loader as layoutLoader } from './pages/Layout';
  import Welcome from './pages/Welcome';
  import Transactions, { loader as transactionsLoader } from './pages/Transactions';
  import ExpenseDetail, { loader as expenseDetailLoader } from './pages/ExpenseDetails';
  import AddTransfer, { loader as AddTransferLoader } from './pages/AddTransfer';


  const router = createBrowserRouter([
    {
      Component: Layout,
      loader: layoutLoader,
      id: "layout",

      children: [
        { index: true, Component: Welcome },
        {
          path: 'transactions',
          Component: Transactions,
          loader: transactionsLoader,
        },
        {
          path: 'expenses/:id',
          Component: ExpenseDetail,
          loader: expenseDetailLoader,
        },
        {
          path: 'transfers/new',
          Component: AddTransfer,
          loader: AddTransferLoader,
        }
      ],
    },
  ]);


  const root = document.getElementById('root');
  if (root) {
    ReactDOM.createRoot(root).render(<RouterProvider router={router} />);
  } else {
    throw new Error('Root element not found');
  }
  ```

  Let’s break down what we did:
  - We created a root route for `'/'` with a `Layout` component and an `id: 'layout'`. We gave it a loader that will fetch the list of users from our backend (`/api/users`). This means when the app (or any nested route) loads, we will have `useLoaderData()` available in the Layout (and child components can also access it via `useRouteLoaderData('layout')` if needed).
  - We define child routes:
    - The default index route `'/'` which renders a `Welcome` component.
    - `/transactions` route to show the combined list of expenses and transfers. It uses `transactionsLoader` that we will define in `Transactions.tsx` to fetch data from `/api/transactions`.
    - `/expenses/:id` route to show an expense detail page, with its own loader to fetch `/api/expenses/{id}`.
    - `/transfers/new` route to show a form for creating a transfer. 

    - Notice how we are now using `Component`  property of the [Route Object](https://reactrouter.com/start/data/route-object) and not `element`, this simple changes means that it is now React-Router which instantiates the page component, at the time and with the props that it now controls. This allows the loader to be run **before** the page component.
  
Most of the imports do not exist yet, and therefore it won't work. Let's comment out all the children and start with the Layout component.


#### **Layout**: 

In `pages/Layout/loader.ts`, create a loader function which will be called by react router, let's also export an interface describing exactly what will be available from the loader. Here is the code, notice that it is a `.ts` and not a `.tsx` file. This is NOT a react file.

```ts
import ApiClient, { type User } from "@/lib/api";

export interface LoaderData {
    users: User[];
}

export async function loader() {
    const users = await ApiClient.getUsers();
    return { users };
}
```

In `lib/api.js`, add the required code for calling the API and returning a result. Use this file for exporting the different types received by the API or needed as payload.

You will  slowly grow this file every time you need to call one of the endpoint but here is an idea of how it should be organized. Notice that this file is under `lib` directory and is not a React file neither. We want to keep our code correctly organized.

```ts
const host = import.meta.env.VITE_API_URL;

const sendApiRequest = async (method: string = 'GET', path: string, body?: unknown) => {
  // copy from previous exercices, notice that this is NOT exported
};

// We will use the object returned by the API in several components, this API module is the best place for declaring them
export interface Transaction {
    //...
}

export interface User {
  // ...
}

export interface Expense {
  //...
}

export interface Transfer {
  //...
}

interface NewTransferPayload {
  // ;..
}


const getTransactions: () => Promise<Transaction[]> = () => sendApiRequest('GET', 'transactions') as Promise<Transaction[]>;
const getUsers: () => Promise<User[]> = () => sendApiRequest('GET', 'users') as Promise<User[]>;
const getExpenseById: (id: number) => Promise<Expense> = (id) => sendApiRequest('GET', `expenses/${id}`) as Promise<Expense>;
const createTransfer: (payload: NewTransferPayload) => Promise<Transfer> = (payload) => sendApiRequest('POST', 'transfers', payload) as Promise<Transfer>;

export const ApiClient = {
  getUsers,
  getTransactions,
  getExpenseById,
  createTransfer,
};

export default ApiClient;

```


In `pages/Layout/Component.tsx`, create a layout component that renders the NavBar and an `<Outlet />` for child pages.

The layout will be responsible for holding the current user in its state. For now, we do not have any authentication mechanism so we can simply pick any user from a select box.

Start from the code below and add the missing part about fetching the list of users from the API by implementing the file `src/lib/api.ts`. 

  ```tsx
  import { NavLink, Outlet, useLoaderData } from 'react-router-dom';
  import { useState } from 'react';
  import type { User } from '@/lib/api';
  import type { LoaderData } from './loader';



  export default function Layout() {
    const { users } = useLoaderData<LoaderData>();
    const [currentUser, setCurrentUser] = useState<null | User>(null);

    const handleUserChange = (e) => {
      const id = e.target.value;
      const newCurrentUser = users.find(user => user.id === Number(id)) ?? null;
      setCurrentUser(newCurrentUser);
    };

    const outletContext = {
      currentUser,
    }

    return (
      <div>
        <nav className="bg-teal-800 text-white p-4 flex justify-between items-center">
          <div className="text-xl font-bold">💸 Expenso</div>
          <div>
            <NavLink to="/transactions" className="mr-4">
              All Transactions
            </NavLink>
            <NavLink to="/transfers/new" className="mr-4">
              New Transfer
            </NavLink>

            <select
              value={currentUser?.id ?? 'none'}
              className="bg-white text-black rounded px-2"
              onChange={handleUserChange}
            >
              <option value="none">— No User —</option>
              {users.map((u: User) => (
                <option key={u.id} value={u.id} >
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </nav>

        <main className="p-6">
          <Outlet context={outletContext} />
        </main>
      </div>
    );
  }
  ```

  Here we:
  - Use `useLoaderData` to get the list of users loaded by the loader (the user list for the dropdown). The exported interface makes it easy for the two modules to evolve the loader if needed.
  - Manage a piece of state `currentUser` in Layout to track which user is selected (if any). We initialize it as `null` meaning "no user". We need to pay attention when comparing string with numbers.
  - Render navigation links: “All Transactions”, “New Transfer”. We use NavLink instead of <a> because we do not want full page refresh; otherwise we would lose the state (current user)
  - Render a `<select>` dropdown listing all users plus an option for "No User". Changing it updates `currentUser` state. It's a controlled component.
  - We provide `Outlet` for displaying the children, and provide the current user as context. This is using the similar technique of React Context seen in previous lesson but with a direct integration in react router because it is so common for a Layout component to provide a context, we even provide a direct hook for getting the currentUser with a very explicit name. See https://reactrouter.com/api/hooks/useOutletContext 


In `pages/Layout/hooks.ts`, export a custom hook for easily getting the currentUser from the context. This is mostly to illustrate how a component can expose custom hooks to other components but it is a great example of encapsulation. There is a high chance that other components will want to have access to the current user and by exposing a custom hook, we allow them to not care about technical details like usage of a Context or they key inside the context. This, in turn, will enable us to make easy refactorings later.

```ts
import type { User } from "@/lib/api";
import { useOutletContext } from "react-router";

export function useCurrentUser() {
  const { currentUser } =  useOutletContext<{ currentUser: User | null }>();
  return currentUser;
}
```

Finally, in `pages/Layout/index.ts`, we export the different values for allowing other modules to only import from `pages/Layout` without caring that we split code in multiple files.

```ts
export { default } from './Component';
export { useCurrentUser } from './hooks';
export { loader } from './loader';
```

#### **Transactions List Page**: 
  
In `pages/Transactions/loader.ts`, implement the loader for fetching the transactions, very similar to Layout. 
Add the required code in the api module for calling the function and exporting the Transaction type.

In `pages/Transactions/Component.tsx`, implement the component to display all transactions.

  ```tsx
import { useLoaderData } from 'react-router-dom';
import ExpenseTransactionItem from '@/components/ExpenseTransactionItem';
import TransferTransactionItem from '@/components/TransferTransactionItem';
import type { LoaderData } from './loader';


  export default function Transactions() {
    const { transactions } = useLoaderData<LoaderData>();
    return (
      <section>
        <ul>
          {transactions.map((tx) => (
            <li key={`${tx.id}`} >
                {tx.kind === 'expense' ? (
                  <ExpenseTransactionItem transaction={tx} />
                ) : (
                  <TransferTransactionItem transaction={tx} />
                )}
            </li>
          ))}
        </ul>
      </section>
    );
  }
  ```

  - For each item, check the type:
    - If it's an `expense`,  we show a sentence like “Alice paid $45.99 for 2 people on 23/09/2025 : Office Supplies”
    - If it's a `transfer`, we show a sentence like “Alice transferred €50 to Bob on 01/10/2025.”
  - For Expense, add a link which will navigate to the expense details page. Be sure to use the id of the **expense** if it is different from the id of the **transaction**.

In `pages/Transactions/index.ts`, export the component and the loader

#### **Expense Detail Page**: 

In `pages/ExpenseDetails/loader.ts`, we will fetch the specific expense according to the id of the route. The loader function receives the param object (as well as the default context and the request object, [see documentation](https://api.reactrouter.com/v7/interfaces/react_router.LoaderFunctionArgs#params)). You can get the id from that object.



In `pages/ExpenseDetails/Component.tsx`, write the component for displaying the detail of an Expense, including:
  - Payer’s name, email, and bank account (if available).
  - List of participants, each with name, email, bank (if any).
  - Each participant’s share of the expense (just total divided by number of participants). This helps illustrate who owes what for this expense.


In `pages/ExpenseDetails/index.ts`, export the component and the loader

#### **Transfer Form Page**: 

In `pages/AddTransfer/loader.ts`, we will fetch the list of users, same as we did in `Layout/loader.ts`. We could reuse the list received in Layout (and pass it via the OutletContext, as we did for the current user) but this would only bring a very small boost of performance while coupling very strongly two components who should stay decoupled. Decoupling these components is more important from a Software Architecture perspective because these two components will very likely evolve for different reasons, they are not related to the same domain.


 In `pages/AddTransfer/Component.tsx`, create a form for adding a new transfer, and leverage react hook form, as we did in Lesson 2.
 Upon success, **navigate()** to the transactions page.
 Upon error, set an error on **root**, it will be cleared with every submission ( [documentation](https://react-hook-form.com/docs/useform/seterror) )


You will need to use the custom hook `useCurrentUser()` which we created on `pages/Layout` module (and more specifically on `pages/Layout/hook.ts` file) for setting the default value of the source to the current user.

You will require the `formState` from the `useForm` hook and more specifically the `errors` and `isSubmitting` states. The `isSubmitting` state is needed for disabling the button once you've clicked on it.

You will require the `useNavigation` hook for navigating to `/transactions` upon success.

> **Important**: We are deliberately NOT using the `action` feature of react router and instead choosing to go entirely with react hook form. This is a design decision  which should be discussed in a real project because each option has pros and cons. Do not try to mix the two features, avoid `action` from react router for now.



#### **Expense Form Page**

Adapt your AddExpense form from previous week. Follow the same guidelines as the form for Transfer we just did.



#### Test

- After implementing these changes, **test the frontend** thoroughly:
  - The app should start at the home or transactions page. The NavBar should show "No User" by default and the "My Transactions" link should be disabled.
  - The All Transactions page should list all expenses and transfers from the backend.
  - The New Transfer form should allow creating a transfer. If you select a source and target and submit, check:
    - The form show an error under the field if validation fails.
    - The form display a generic message if backend fails
    - The form redirects to transactions if the form succeeded, you can see your new record on top.
  - Expense Detail page: from All Transactions, click a "details" link on an expense. It should load the detail route and display all info. Try an expense where more than one participant exists to see the list and per-person share. 
  - The browser's back button is working properly. Refresh as well (but loses current user)


---

## Optional Enhancements

Consider tackling these enhancements to further improve robustness and user experience:

### A. Form Validation with Zod

Integrate **Zod** schema validation for form data on both frontend and backend:

- Define a Zod schema for the Transfer form (and/or the Expense form if you create one). For example:
  ```ts
  import { z } from 'zod';
  const TransferSchema = z
    .object({
      amount: z.number().positive('Amount must be positive'),
      sourceId: z.number(),
      targetId: z.number(),
    })
    .refine((data) => data.sourceId !== data.targetId, {
      message: 'Source and target cannot be the same',
      path: ['targetId'],
    });
  ```
- Use this schema in the React form using `react-hook-form` with `zodResolver` (from `@hookform/resolvers/zod`). This will give you front-end validation errors automatically, which you can display under the respective fields.
- Also use the schema in your Express controller or action to validate incoming data server-side (the template’s request validation with Zod could be leveraged here, e.g., via a middleware or directly in the controller).
- Aim to provide helpful error messages to the user, both inline by each field and as a summary if the form is invalid on submit.


### B. Polishing the Data Calculations

Our balance calculation logic in My Transactions is rudimentary and assumes equal splits. Consider enhancing:

- Allow unequal split in an expense (e.g., maybe Alice paid for Charlie entirely – in that case participants might not include Alice, or a separate field could denote shares). This gets complex, but thinking about it is a good exercise.
- If unequal splits were allowed, the data model might include a separate join table with a share percentage or amount for each participant per expense. This is beyond our current scope, but it’s how real apps handle complex splits.
- For now, test more scenarios with equal splits to ensure the logic holds.

### D. Additional Routes and Features

- **Edit/Delete Transactions**: Allow editing an expense or transfer (e.g., if entered incorrectly). This would involve pre-filling a form with existing data and calling PUT/PATCH endpoints (which you’d need to implement in the backend). Similarly, a delete button could call DELETE endpoints. Be sure to handle the cascading effects (e.g., deleting an expense should maybe adjust balances).

- **Styling**: Use more Shadcn components like **Data Table** for the transactions list to allow sorting and filtering out-of-the-box. The Shadcn DataTable component tied to TanStack Table could handle a lot of this, albeit with more setup.


## Summary

- We migrated our backend to a **TypeScript Express template** for better structure, and integrated **Prisma** to manage complex state with a relational database. This introduced true relationships between data (users, expenses, transfers) instead of using simple JSON storage.
- We learned how to define **Prisma models** with relations (one-to-many for payer expenses, many-to-many for expense participants, and self-relations for transfers between users) and used **Prisma Migrate** to evolve the database schema safely.
- On the frontend, we refactored to use **React Router loaders**, moving data fetching logic out of components and into the routing layer. This makes our data flow more declarative and tied to routes, improving maintainability and performance (data is loaded before rendering).
- We utilized a **Layout route with Outlet context** to manage global state (current user selection) and to share common data (user list) across pages. This is a clean way to handle state that many components need without prop drilling.
- We implemented new UI pages: a combined **Transactions list**, a **Transfer form**, and an **Expense detail** page. Each demonstrates different aspects of state management: aggregated data, form submission with side effects, and detailed views with related records.

- The app now supports a realistic scenario of multiple users sharing expenses and settling up, showcasing how **backend state** (database) and **frontend state** (React) interact in a complex app. This lays a strong foundation for any full-stack application you'll build going forward, as you can confidently model data and manage state across the stack.


---
