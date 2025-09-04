---
title: '<WIP> Lesson 4 – Advanced State Management'
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

## Introduction

Now that our application has basic features and a polished interface, we will take a big step forward by introducing **multiple users** and **money transfers** to our expense-sharing app (think Splitwise-like features). This lesson focuses on **advanced state management** across the stack – refining how we manage data on the backend and how the frontend interacts with it. On the backend, we'll migrate to a more robust Express + TypeScript template and design a relational database schema using Prisma for users, expenses, and transfers. On the frontend, we'll leverage React Router’s Data APIs (loaders and actions) and global state (context) to handle more complex interactions like selecting a current user and loading combined data.

By the end of this lesson, our app will support multiple users who can owe or pay each other. We’ll have a unified **Transactions** list (combining expenses and direct transfers), the ability to record transfers of money, and a personal view for a selected user to see their own balance. This will involve significant changes: updating our API endpoints, enhancing our Prisma models with relationships, and refactoring the React app to use React Router’s recommended patterns for data loading and mutations.

> **Note:** We’re moving our backend from the simple Express generator setup to a more scalable template that uses TypeScript and best practices (including better project structure, error handling, and testing). Don’t worry – we’ll guide you through integrating our existing functionality into this new structure. This is a valuable exercise in _state management_ at an application level: maintaining consistency across multiple models (Users, Expenses, Transfers) and keeping frontend UI state in sync with the backend.

As always, commit your work regularly and push to your repository. If you’ve set up deployment (Render) in previous lessons, continue to deploy and test there as well – our new features should eventually run in production too!

## Recommended Reading

- [Express + TypeScript Starter Template (GitHub Repo)](https://github.com/edwinhern/express-typescript) – Familiarize yourself with the project structure and features of the template we’ll use for our backend.
- [Prisma – Relations (Official Docs)](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations) – Learn how to define relations (one-to-many, many-to-many) between models in the Prisma schema.
- [Prisma – Migrate Your Schema (Official Docs)](https://www.prisma.io/docs/orm/prisma-migrate) – Understand how to use Prisma Migrate to apply schema changes to your database safely (as opposed to `db push`).
- [React Router – Data Loading (Official Docs)](https://reactrouter.com/en/main/routers/picking-a-router#data-loading) – Review how to fetch data with route **loaders** and access it via `useLoaderData`.
- [React Router – Data Mutations with Actions (Official Docs)](https://reactrouter.com/en/main/routers/picking-a-router#data-mutations) – See how to use route **actions** and the `<Form>` component to handle form submissions and then revalidate loader data.

## Exercises

All exercises continue building on our collaborative expense-sharing app. We will start fresh with a new backend structure but will carry over and extend the functionality from lessons 1–3. Make sure you have your previous code handy for reference, but be prepared to reorganize it. The frontend will be refactored within the existing Vite React project from lesson 3.

### 1. Bootstrapping the Backend with a TypeScript Template

**Goal**: Set up a new Express backend using a modern TypeScript boilerplate, then integrate Prisma for database access.

- **Clone Template**: In your `backend/` directory (you can create a new folder or replace the old one), clone the Express+TS template repository:
  ```bash
  git clone https://github.com/edwinhern/express-typescript.git backend
  ```
  This boilerplate provides a structured starting point (TypeScript, project architecture, testing, etc.). Navigate into `backend/` and run `npm install` (or `pnpm install` as the repo suggests) to install dependencies.
- **Review Structure**: Open the project and briefly examine the structure. You’ll see an organized layout under `src/api` (with subfolders for features like `user`), middleware setup (Helmet, CORS, etc.), and other conveniences (logging, environment validation with Zod, etc.). Take note of how routes and controllers are defined (e.g., `src/api/user/userRouter.ts` and related files) – we will follow this pattern for our new features.
- **Environment Setup**: Copy the provided `.env.template` to a new `.env` file in the backend folder. Fill in any required env vars. At minimum, ensure you have a `PORT` defined (if not provided) and set `NODE_ENV` to `"development"` for now. We will add a database connection URL here once we create one.
- **Run the Template**: Try running the server in dev mode to ensure everything is working:
  ```bash
  npm run start:dev
  ```
  You should see the template app start (it includes a health check endpoint at `/api/healthCheck`). If it fails, check that you installed all dependencies and set up the env file.
- **Add Prisma to the Project**: Stop the server. We will now integrate Prisma into this template.
  - Install Prisma as a development dependency and initialize it:
    ```bash
    npm install prisma --save-dev
    npx prisma init
    ```
    This creates a `prisma/` directory with a `schema.prisma` file and a `.env` entry for `DATABASE_URL`. Update the `.env` file’s `DATABASE_URL` to point to your development database. For example, you can use a local SQLite file for simplicity or a PostgreSQL URL if you set one up in Lesson 2. (For SQLite, use `file:dev.db`).
  - If you don’t have a database from before: you can quickly use SQLite by setting `DATABASE_URL="file:./dev.db"` in the env and ensuring `provider = "sqlite"` in `schema.prisma`. Otherwise, use the Postgres connection string from your Render or local DB (e.g., `postgresql://user:password@host/dbname`).
- **Verify DB Connection**: Run the command:
  ```bash
  npx prisma db pull
  ```
  This will check the connection and pull any existing schema (if your DB is new/empty, it will succeed with no models). If you get an error, double-check your `DATABASE_URL` and that the database exists/reachable.
- **Prepare Dev Database**: If using a fresh database with no tables, that’s fine – we’ll create tables via Prisma soon. If you had existing tables from previous exercises, consider starting with a clean slate for this lesson (you can always reseed data).
- **Plan for Seeding Data**: We want some initial data to work with. Plan to create a **seed script** using Prisma or use Prisma’s built-in seeding capabilities. We will seed 2–3 users, a few expenses, and a few transfers for testing.

Create a script `prisma/seed.ts` (or a standalone TypeScript file) where you instantiate a PrismaClient and create initial records with `prisma.user.createMany`, `prisma.expense.createMany`, etc. You can then run `npx prisma db seed` (after configuring the seed path in `package.json` or `schema.prisma`).

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

  Check that you have tables for `User`, `Expense`, `Transfer`, and an `_ExpenseToUser` join table.

- **Seeding Initial Data**: Now populate the database with some mock data for development:
  - Create a few users, e.g., Alice, Bob, and Charlie. Give them distinct emails and maybe bankAccount values.
  - Create a few expenses:
  - Create a few transfers
- - **How to seed**: The easiest way is using Prisma Client in a Node script:

    ```ts
    // prisma/seed.ts (if not already created by npx prisma init -- and configured)
    import { PrismaClient } from '@prisma/client';
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

    This is just an example. You can run this script with `ts-node` or set it up as the Prisma seed (adjust your `package.json` `"prisma": { "seed": "ts-node prisma/seed.ts" }` and run `npx prisma db seed`). After seeding, use Prisma Studio to confirm that the data is in the tables.

- At this point, our database state is initialized with some example data. We have successfully managed complex state on the backend: multiple models and relationships that mirror real-world connections between data. Next, we’ll expose this data via new API endpoints.

### 3. Backend API Changes

**Goal**: Implement new REST API endpoints for users, transfers, and combined transactions, and refactor existing routes to conform to the template’s structure and the new schema.

Our Express template uses a structure where each feature (e.g., `user`) has its own router, controller, service (or repository/model) files. We will add new feature modules for `expense` and `transfer`, and adjust the existing expense logic from prior lessons to use Prisma.

- **Set Up Expense Module**: In `src/api/`, create a folder for `expense` (if one doesn’t exist from the template). Inside, create:
  - `expenseRepository.ts`: This will use Prisma Client to interact with the DB, similar to Services from previous lessons.
  - `expenseController.ts`: Functions to handle incoming requests and formulate responses (calls the model/repository functions).
  - `expenseRouter.ts`: The Express router defining routes and linking to controller methods.

- **Implement Expense Routes**: We need to cover:
  - `GET /expenses`: Return list of all expenses (with related data).
  - `POST /expenses`: Create a new expense (we had this in lesson 1/2). For now, ensure it handles the new structure (e.g., expects a `payerId` and an array of participant user IDs in the request body).
  - `GET /expenses/:id`: Return detailed info for a single expense by ID.

  - In `expenseController.ts`, define handlers that call repository functions and send appropriate JSON responses (and error handling). For example:
    ```ts
    import * as expenseRepository from './expenseRepository';
    export async function listExpenses(req, res, next) {
      try {
        const expenses = await expenseRepository.getAllExpenses();
        res.json(expenses);
      } catch (err) {
        next(err);
      }
    }
    export async function getExpenseDetail(req, res, next) {
      try {
        const id = Number(req.params.id);
        const expense = await expenseRepository.getExpenseById(id);
        if (!expense) {
          return res.status(404).json({ error: 'Expense not found' });
        }
        res.json(expense);
      } catch (err) {
        next(err);
      }
    }
    export async function createExpense(req, res, next) {
      try {
        const { description, amount, date, payerId, participants } = req.body;
        // Assume participants is an array of user IDs
        const newExp = await expenseRepository.createExpense({
          description,
          amount: parseFloat(amount),
          date: date ? new Date(date) : new Date(),
          payerId: Number(payerId),
          participantIds: participants || [], // if omitted, we'll handle default to all users later
        });
        res.status(201).json(newExp);
      } catch (err) {
        next(err);
      }
    }
    ```
  - In `expenseRouter.ts`, set up the routes:

    ```ts
    import { Router } from 'express';
    import * as ExpenseController from './expenseController';
    const router = Router();
    router.get('/expenses', ExpenseController.listExpenses);
    router.post('/expenses', ExpenseController.createExpense);
    router.get('/expenses/:id', ExpenseController.getExpenseDetail);

    export default router;
    ```

- **Implement User Routes**: The template already has a basic `userRouter` and `userController` for a sample user endpoint (check `src/api/user`). These are only present for illustrating what is a router, controller, model (which we call repository), and service. You can delete them all and start from scratch, or you can adapt them if you feel more comfortable. But there should be no line of code at the end of the exercice that you do not understand and own; we highly recommend that you delete the whole folder once you understand how the different files articulates.
  - `GET /users`: return list of all users. (We’ll need this for populating the user dropdown on the frontend.)

  - Implement these by using Prisma `prisma.user.findMany({})`
  - Wire up the routes in `userRouter.ts` and mount it in the main server

-
- **Implement Transfer Routes**: Create a new `transfer` module in `src/api/transfer`: You need to list and create transfer, similar to what you did for expenses.

- **Combined Transactions Endpoint**: If you want, you can create an endpoint for getting all transactions (expenses and transfers). Otherwise you'll send two requestes from the frontend and combine these in the frontend.

The main advantage of doing a combined endpoint would be pagination but this is out of scope for this lesson.

- **Integrate Routers in App**: Make sure to mount these new routers in your main `src/server.ts`.

  ```ts
  import expenseRouter from './api/expense/expenseRouter';
  import transferRouter from './api/transfer/transferRouter';
  import userRouter from './api/user/userRouter';
  // ...
  app.use('/api', expenseRouter);
  app.use('/api', transferRouter);
  app.use('/api', userRouter);
  ```

- **Test the API**: Use a REST client (like VSCode REST Client or Postman) to verify each endpoint:
  - GET `/api/users` – should list your seeded users.
  - GET `/api/expenses` – should list expenses with their payer and participants (verify that the data structure is as expected, e.g., participants is an array of user objects).
  - GET `/api/transfers` – list of transfers with source and target user info.
  - (Optionally) GET `/api/transactions` – combined list of both, sorted by date.
  - GET `/api/expenses/{id}` – details of a single expense (make sure it includes participants and payer info).
  - POST `/api/transfers` with a JSON body (e.g., `{ "amount": 5, "sourceId": 1, "targetId": 2 }`) – should create a new transfer.
  - POST `/api/expenses` with a new expense (e.g., `{ "description": "Coffee", "amount": 3, "payerId": 2, "participants": [1,2] }`) – should create expense with Bob as payer and Bob & Alice as participants.
  - If any issues arise, fix them now. The template has CORS enabled for a default origin (`CORS_ORIGIN` in .env file ) – ensure it allows your frontend’s origin.
  - Also ensure error handling middleware in the template will catch and respond with errors appropriately.

- With the backend API ready, we can focus on the frontend changes. Our state management on the backend is now more complex (multiple tables, relationships), but Prisma simplifies retrieving related data, and our organized structure makes it easier to maintain. Keep your server running as you proceed to frontend tasks.

### 4. Frontend Routing with Loaders and Actions

**Goal**: Refactor the React frontend to use React Router’s data API (loaders and actions) for fetching data and handling form submissions. Also adopt a structured routing setup (with a layout route and nested routes) as recommended by React Router docs.

Until now, our frontend likely used explicit `fetch` calls inside components (e.g., in `useEffect`) to get data, and `useNavigate` for programmatic navigation. We will now leverage React Router v6.4+ features:

- **Loaders** to fetch data _before_ rendering a route, providing data via `useLoaderData`.
- **Actions** to handle form submissions declaratively via `<Form>` components.
- A central route configuration instead of manually managing navigation state or using a context for pages.

We’ll also introduce a **layout route** to manage common UI (like the NavBar and user selection) and share data (like the user list) across routes.

**Step-by-step:**

- **Install React Router (if not already)**: If you haven’t already set up React Router in lesson 3, install it:
  ```bash
  npm install react-router-dom
  ```
  Ensure you are on at least v6.14 (the latest as of writing) or any 6.4+ which supports data APIs.
- **Restructure Pages into Routes**: In lesson 3, you might have had separate page components (Welcome, List, Add, etc.) and used a manual context or later integrated React Router without loaders. Now, create a file structure for route components, for example:
  ```
  frontend/src/routes/
    ├── Layout.tsx        (layout component wrapping pages, includes NavBar and Outlet)
    ├── Home.tsx          (maybe a welcome or landing page component)
    ├── Transactions.tsx  (list of all expenses+transfers)
    ├── ExpenseDetail.tsx (detail view for expense)
    ├── TransferForm.tsx  (page with form to create a new transfer)
    ├── MyTransactions.tsx (personal transactions for current user)
  ```
  Alternatively, you can keep components in `pages/` but the key is to have distinct components for each route's content.
- **Create a Router Configuration**: In your `frontend/src/main.tsx` (or wherever you render `<App/>`), set up a React Router provider. For example:

  ```tsx
  import { createBrowserRouter, RouterProvider } from 'react-router-dom';
  import Layout from './routes/Layout';
  import Home from './routes/Home';
  import Transactions, { loader as transactionsLoader } from './routes/Transactions';
  import ExpenseDetail, { loader as expenseDetailLoader } from './routes/ExpenseDetail';
  import TransferForm, { action as transferAction } from './routes/TransferForm';
  import MyTransactions from './routes/MyTransactions';

  const router = createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      id: 'root', // give an id to reference this route’s loader data
      loader: async () => {
        // Loader for root layout: fetch all users for NavBar dropdown
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
        if (!res.ok) throw new Error('Failed to load users');
        const users = await res.json();
        return { users };
      },
      children: [
        { index: true, element: <Home /> }, // or redirect to /transactions
        {
          path: 'transactions',
          element: <Transactions />,
          loader: transactionsLoader,
        },
        {
          path: 'expenses/:id',
          element: <ExpenseDetail />,
          loader: expenseDetailLoader,
        },
        {
          path: 'transfers/new',
          element: <TransferForm />,
          action: transferAction,
        },
        {
          path: 'my-transactions',
          element: <MyTransactions />,
          // We'll filter data on the client side for current user, so no loader needed or reuse transactionsLoader
        },
      ],
    },
  ]);

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
  ```

  Let’s break down what we did:
  - We created a root route for `'/'` with a `Layout` component and an `id: 'root'`. We gave it a loader that fetches the list of users from our backend (`/api/users`). This means when the app (or any nested route) loads, we will have `useLoaderData()` available in the Layout (and child components can also access it via `useRouteLoaderData('root')` if needed).
  - We define child routes:
    - The default index route `'/'` which renders a `Home` component (could be a welcome or summary page).
    - `/transactions` route to show the combined list of expenses and transfers. It uses `transactionsLoader` that we will define in `Transactions.tsx` to fetch data from `/api/transactions`.
    - `/expenses/:id` route to show an expense detail page, with its own loader to fetch `/api/expenses/{id}`.
    - `/transfers/new` route to show a form for creating a transfer. This uses an **action** (`transferAction`) to handle the form submission.
    - `/my-transactions` route for the current user’s personal transactions. We might not need a separate loader here if we reuse the data from `/transactions` and filter it on the client side, or we could call a specialized endpoint. We’ll decide when implementing it (likely filtering the already loaded transactions or calling `/api/transactions` again).

- **Layout and NavBar**: In `Layout.tsx`, create a layout component that renders the NavBar and an `<Outlet />` for child pages:

  ```tsx
  import { Outlet, useLoaderData, useNavigate } from 'react-router-dom';
  import { useState } from 'react';

  interface RootLoaderData {
    users: Array<{ id: number; name: string }>;
  }

  export default function Layout() {
    const { users } = useLoaderData() as RootLoaderData;
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<null | number>(null);

    const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const userId = e.target.value === 'none' ? null : Number(e.target.value);
      setCurrentUser(userId);
      // Optionally, navigate to either the home or my-transactions page:
      if (userId) {
        navigate('/my-transactions');
      } else {
        navigate('/transactions');
      }
    };

    return (
      <div>
        {/* NavBar */}
        <nav className="bg-teal-800 text-white p-4 flex justify-between items-center">
          <div className="text-xl font-bold">💸 Expenso</div>
          <div>
            <a href="/transactions" className="mr-4">
              All Transactions
            </a>
            <a href="/transfers/new" className="mr-4">
              New Transfer
            </a>
            <a href="/my-transactions" className={currentUser ? 'mr-4' : 'mr-4 text-gray-400 pointer-events-none'}>
              My Transactions
            </a>
            {/* User Switcher */}
            <select
              onChange={handleUserChange}
              value={currentUser ?? 'none'}
              className="bg-white text-black rounded px-2"
            >
              <option value="none">— No User —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </nav>
        {/* Page content */}
        <main className="p-6">
          <Outlet context={{ currentUser }} />
        </main>
      </div>
    );
  }
  ```

  Here we:
  - Use `useLoaderData` to get the list of users loaded by the root loader (the user list for the dropdown).
  - Manage a piece of state `currentUser` in Layout to track which user is selected (if any). We initialize it as `null` meaning "no user".
  - Render navigation links: “All Transactions”, “New Transfer”, “My Transactions”. We disable (grey out) the "My Transactions" link if no user is selected (so users understand they must choose someone).
  - Render a `<select>` dropdown listing all users plus an option for "No User". Changing it updates `currentUser` state and navigates accordingly:
    - If a user is selected, we navigate to the "/my-transactions" page to show their personal view.
    - If "no user" is selected (null), we navigate to the general transactions list.
  - We provide `Outlet` with an extra context containing `currentUser`. This allows child components to access the selected user if needed via `useOutletContext`.
  - _Styling_: We used some Tailwind classes for basic styling of the nav. Feel free to adjust and incorporate Shadcn components (for example, Shadcn’s Select component for the dropdown could enhance UX).

- **Transactions List Page**: In `Transactions.tsx`, implement the loader and component to display all transactions:

  ```tsx
  import { useLoaderData, Link } from 'react-router-dom';

  interface Transaction {
    id: number;
    description?: string;
    amount: number;
    date: string;
    type: 'expense' | 'transfer';
    // For expenses:
    payer?: { id: number; name: string };
    participants?: Array<{ id: number; name: string }>;
    // For transfers:
    source?: { id: number; name: string };
    target?: { id: number; name: string };
  }

  // Loader function to fetch combined transactions
  export async function loader() {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transactions`);
    if (!res.ok) throw new Response('Failed to load transactions', { status: res.status });
    const data = await res.json();
    return data as Transaction[];
  }

  export default function Transactions() {
    const transactions = useLoaderData() as Transaction[];
    return (
      <section>
        <h2 className="text-2xl font-bold mb-4">All Transactions</h2>
        <ul>
          {transactions.map((tx) => (
            <li key={`${tx.type}-${tx.id}`} className="border-b py-2">
              {tx.type === 'expense' ? (
                <>
                  <span className="font-medium">{tx.description}</span> –
                  <span>
                    {' '}
                    {tx.payer?.name} paid €{tx.amount.toFixed(2)}
                  </span>
                  {tx.participants && tx.participants.length > 1 ? (
                    <span> for {tx.participants.length} people</span>
                  ) : (
                    <span> for themselves</span>
                  )}{' '}
                  on {new Date(tx.date).toLocaleDateString()} (
                  <Link to={`/expenses/${tx.id}`} className="text-blue-600">
                    details
                  </Link>
                  )
                </>
              ) : (
                <>
                  <span>
                    {tx.source?.name} transferred €{tx.amount.toFixed(2)} to {tx.target?.name}
                  </span>{' '}
                  on {new Date(tx.date).toLocaleDateString()}.
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    );
  }
  ```

  What’s happening:
  - The loader fetches `/api/transactions` and returns the array of transactions (each already labeled with `type` as we implemented).
  - The component uses `useLoaderData()` to get that array and then displays each transaction in a list item.
  - For each item, we check `tx.type`:
    - If it's an `expense`, we display its description, who paid (payer name), amount, and how many participants shared it. If `participants.length > 1`, we show “for X people”; if it equals 1 (meaning only payer themselves), we say “for themselves”.
    - We also include a **Link** to the expense detail page for more info.
    - If it's a `transfer`, we show a sentence like “Alice transferred €50 to Bob on 01/10/2025.”
  - This provides a unified list. It’s not sorted in the component because we sorted on the server already. If you find it not sorted (maybe the server returned unsorted), we could sort here too for safety.
  - Add some basic styling (we used a border and spacing classes).

- **Expense Detail Page**: In `ExpenseDetail.tsx`, we will fetch and display detailed info for one expense:

  ```tsx
  import { useLoaderData } from 'react-router-dom';

  interface Expense {
    id: number;
    description: string;
    amount: number;
    date: string;
    payer: { id: number; name: string; email: string; bankAccount: string | null };
    participants: Array<{ id: number; name: string; email: string; bankAccount: string | null }>;
  }

  export async function loader({ params }: { params: any }) {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/expenses/${params.id}`);
    if (!res.ok) {
      throw new Response('Failed to load expense detail', { status: res.status });
    }
    const expense = await res.json();
    return expense as Expense;
  }

  export default function ExpenseDetail() {
    const expense = useLoaderData() as Expense;
    return (
      <section>
        <h2 className="text-2xl font-bold mb-4">Expense Details</h2>
        <p>
          <strong>Description:</strong> {expense.description}
        </p>
        <p>
          <strong>Amount:</strong> €{expense.amount.toFixed(2)}
        </p>
        <p>
          <strong>Date:</strong> {new Date(expense.date).toLocaleString()}
        </p>
        <p>
          <strong>Payer:</strong> {expense.payer.name} – {expense.payer.email}{' '}
          {expense.payer.bankAccount && `(Bank: ${expense.payer.bankAccount})`}
        </p>
        <p>
          <strong>Participants ({expense.participants.length}):</strong>
        </p>
        <ul className="ml-4 list-disc">
          {expense.participants.map((user) => (
            <li key={user.id}>
              {user.name} – {user.email} {user.bankAccount && `(Bank: ${user.bankAccount})`}
            </li>
          ))}
        </ul>
        <p className="mt-4">
          <em>Each participant's share: </em>
          {expense.participants.length > 0
            ? `€${(expense.amount / expense.participants.length).toFixed(2)} each`
            : 'N/A'}
        </p>
      </section>
    );
  }
  ```

  Explanation:
  - The loader uses the `id` param from the route and fetches that expense. We expect our backend to include the related payer and participant details (because we used `include` in our getExpenseById).
  - We display all the key info, including:
    - Payer’s name, email, and bank account (if available).
    - List of participants, each with name, email, bank (if any).
  - We also compute and display each participant’s share of the expense (just total divided by number of participants). This helps illustrate who owes what for this expense.
  - Notice the use of `.toFixed(2)` to format currency values.

- **Transfer Form Page**: In `TransferForm.tsx`, create a form for adding a new transfer:

  ```tsx
  import { useState } from 'react';
  import { Form, useActionData, useNavigation } from 'react-router-dom';
  import { useOutletContext } from 'react-router-dom';

  interface TransferFormData {
    amount: number;
    sourceId: number;
    targetId: number;
  }
  interface ActionResponse {
    error?: string;
    success?: boolean;
  }
  interface LayoutContext {
    currentUser: number | null;
  }

  export async function action({ request }: { request: Request }) {
    const formData = await request.formData();
    const amount = formData.get('amount');
    const sourceId = formData.get('sourceId');
    const targetId = formData.get('targetId');
    // Simple validation on server side
    if (!amount || !sourceId || !targetId) {
      return { error: 'All fields are required.' };
    }
    if (sourceId === targetId) {
      return { error: 'Source and target must be different users.' };
    }
    // Call backend API
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseFloat(amount.toString()),
        sourceId: Number(sourceId),
        targetId: Number(targetId),
      }),
    });
    if (!res.ok) {
      return { error: 'Failed to create transfer.' };
    }
    return { success: true };
  }

  export default function TransferForm() {
    const { currentUser } = useOutletContext<LayoutContext>();
    const actionData = useActionData() as ActionResponse;
    const navigation = useNavigation();
    const [formState, setFormState] = useState<TransferFormData>({
      amount: 0,
      sourceId: currentUser || 0,
      targetId: 0,
    });

    const isSubmitting = navigation.state === 'submitting';

    return (
      <section>
        <h2 className="text-2xl font-bold mb-4">New Transfer</h2>
        <Form method="post" className="max-w-sm space-y-4">
          {actionData?.error && <p className="text-red-600">{actionData.error}</p>}
          {actionData?.success && <p className="text-green-600">Transfer recorded successfully!</p>}
          <div>
            <label className="block font-medium mb-1">Amount (€)</label>
            <input
              type="number"
              step="0.01"
              name="amount"
              required
              className="border px-2 py-1 w-full"
              onChange={(e) => setFormState({ ...formState, amount: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">From (Source)</label>
            <select
              name="sourceId"
              required
              className="border px-2 py-1 w-full"
              defaultValue={formState.sourceId || ''}
              onChange={(e) => setFormState({ ...formState, sourceId: Number(e.target.value) })}
            >
              <option value="" disabled>
                Select a payer
              </option>
              {/* Populate options from users list */}
              {/* We'll get the user list from the root loader via context or directly using useRouteLoaderData */}
              {/* Alternatively, we could fetch user list here as we did in NavBar, but to keep it simple, assume the nav's loader already fetched users and currentUser is one of them. */}
              {/* (For brevity, not repeating user list code; you might want to retrieve users similar to NavBar or pass them in context as well.) */}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">To (Target)</label>
            <select
              name="targetId"
              required
              className="border px-2 py-1 w-full"
              defaultValue={formState.targetId || ''}
              onChange={(e) => setFormState({ ...formState, targetId: Number(e.target.value) })}
            >
              <option value="" disabled>
                Select a recipient
              </option>
              {/* Populate with users similarly */}
            </select>
          </div>
          <button type="submit" className="bg-teal-700 text-white px 4 py-2 rounded" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Add Transfer'}
          </button>
        </Form>
      </section>
    );
  }
  ```

  Let’s unpack this:
  - We use `<Form method="post">` from react-router-dom. This will automatically trigger our `action` on the route when submitted.
  - The `action` function (above the component) reads form data and calls the backend POST `/api/transfers`. If something is missing or invalid (like source == target), we return an `{ error: ... }` object. If successful, we return `{ success: true }`. These return values become `actionData` accessible via `useActionData()` in the component.
  - In the component:
    - We use `useOutletContext` to get `currentUser` from Layout. We pre-select the "From (Source)" user to currentUser if available (so if the user has chosen themselves in the nav, the form defaults the source to that user).
    - We manage local form state mainly to handle default values and potential UI feedback. (Though for a simple form we could rely on uncontrolled form values via defaultValue, we included a controlled state to illustrate how you might integrate with React state if needed.)
    - We use `useNavigation()` to get the navigation state; this lets us disable the submit button and show "Submitting..." text while the form is in flight.
    - We display any `actionData.error` or success message if present.
    - The options for the select dropdowns: to populate them, we need the list of users. We have it in the root loader (`users` data). We have two ways:
      1. Use `useRouteLoaderData('root')` to get the users from the root route loader.
      2. Or pass the users list through context as well. We already pass currentUser; we could pass the whole users array in context too.
    - For brevity, the above code leaves a comment indicating where to insert user options. You can obtain the user list with:
      ```tsx
      import { useRouteLoaderData } from 'react-router-dom';
      const rootData = useRouteLoaderData('root') as { users: Array<{ id: number; name: string }> };
      const users = rootData.users;
      ```
      and then map over `users` for the options. Ensure to exclude the same user from the "To" list if you want to avoid sending to self (though our validation catches it too).
    - When the action returns success, we show a success message. You might also want to redirect the user or reset the form. For example, on success, you could navigate to `/transactions` or `/my-transactions`. However, since we didn't explicitly call `redirect()` in the action, the page will not navigate by itself. Perhaps as an improvement, if `actionData?.success` is true, you could use `useNavigate` to redirect after a short delay or on the next render. We keep it simple: show a message and the user can manually go back or use nav links.
  - **Using React Hook Form**: We manually managed form data here for illustration. In practice, you could integrate **React Hook Form** for more convenient form handling and validation. That was introduced in Lesson 2, and you can continue to use it to register inputs and handle submission (then call `fetch` or even call `navigate('/transfers/new', { method: 'post', ... })` programmatically with the form data). However, using `<Form>` with an action as above is straightforward and aligns with React Router’s data API. You can choose either approach, but ensure you provide user feedback and validation.

- **My Transactions Page**: In `MyTransactions.tsx`, display the transactions relevant to the currently selected user (from context):

  ```tsx
  import { useOutletContext } from 'react-router-dom';
  import { useRouteLoaderData } from 'react-router-dom';
  import type { LayoutContext } from './TransferForm'; // or redefine LayoutContext here

  export default function MyTransactions() {
    const { currentUser } = useOutletContext<LayoutContext>();
    const rootData = useRouteLoaderData('root') as { users: Array<{ id: number; name: string }> };
    const user = rootData.users.find((u) => u.id === currentUser);
    const allTransactions = useRouteLoaderData('root') as any; // Actually, we didn't load transactions in root. We might need to reuse the Transactions loader.
    // Simpler: we can fetch transactions here too, but to avoid double-fetch, let's assume the user navigated from All Transactions which was already loaded.
    // For robustness, you might call the /transactions API again or even better, have a context/store to cache it.
    // Here, we'll call the API again for simplicity:
    const [transactions, setTransactions] = useState<Transaction[] | null>(null);

    useEffect(() => {
      if (currentUser) {
        fetch(`${import.meta.env.VITE_API_URL}/api/transactions`)
          .then((res) => res.json())
          .then((data) => setTransactions(data));
      }
    }, [currentUser]);

    if (!currentUser || !user) {
      return <p>Please select a user to view their transactions.</p>;
    }
    if (!transactions) {
      return <p>Loading...</p>;
    }
    // Filter transactions for this user:
    const personalTx = transactions.filter((tx) => {
      if (tx.type === 'expense') {
        // if user was payer or is in participants
        return tx.payer?.id === currentUser || tx.participants?.some((p) => p.id === currentUser);
      } else {
        // transfer
        return tx.source?.id === currentUser || tx.target?.id === currentUser;
      }
    });

    // Calculate balance:
    let balance = 0;
    personalTx.forEach((tx) => {
      if (tx.type === 'expense') {
        const share = tx.participants && tx.participants.length > 0 ? tx.amount / tx.participants.length : 0;
        if (tx.payer?.id === currentUser) {
          // current user paid, others owe them their shares
          const othersCount = tx.participants ? tx.participants.length - 1 : 0;
          balance += share * othersCount;
        }
        if (tx.payer?.id !== currentUser) {
          // current user was a participant who owes the payer
          balance -= share;
        }
      } else if (tx.type === 'transfer') {
        if (tx.source?.id === currentUser) {
          balance -= tx.amount;
        }
        if (tx.target?.id === currentUser) {
          balance += tx.amount;
        }
      }
    });

    return (
      <section>
        <h2 className="text-2xl font-bold mb-4">My Transactions – {user.name}</h2>
        <p className="mb-4">
          <strong>Current Balance: </strong>
          {balance >= 0 ? `You are owed €${balance.toFixed(2)}` : `You owe €${Math.abs(balance).toFixed(2)}`}
        </p>
        <ul>
          {personalTx.map((tx) => (
            <li key={`${tx.type}-${tx.id}`} className="border-b py-2">
              {tx.type === 'expense' ? (
                <>
                  <span className="font-medium">{tx.description}</span> – €{tx.amount.toFixed(2)}
                  {tx.payer?.id === currentUser ? ' paid by you' : ` paid by ${tx.payer?.name}`}
                  (participants: {tx.participants?.map((p) => p.name).join(', ')})
                </>
              ) : (
                <>
                  {tx.source?.id === currentUser ? (
                    <>
                      You transferred €{tx.amount.toFixed(2)} to {tx.target?.name}
                    </>
                  ) : (
                    <>
                      {tx.source?.name} transferred €{tx.amount.toFixed(2)} to you
                    </>
                  )}
                </>
              )}{' '}
              on {new Date(tx.date).toLocaleDateString()}
            </li>
          ))}
        </ul>
      </section>
    );
  }
  ```

  This page:
  - Uses `currentUser` from context and finds that user’s details (for display).
  - It needs the transactions data. Ideally, we could reuse the already fetched transactions from the Transactions page if we came from there. But if the user directly navigates to /my-transactions, we need data. For simplicity, the code above fetches `/api/transactions` again in a `useEffect` whenever `currentUser` changes. This duplicates the data fetching, but ensures we have fresh data. (An alternative would be to lift the transactions into a context or a higher loader so it can be reused, but that’s an optimization.)
  - Filters the combined transactions to those involving the current user:
    - For each expense, include it if the user was the payer or one of the participants.
    - For each transfer, include if the user was source or target.
  - Computes the user’s balance:
    - For each expense:
      - If the user is the payer, we add the shares of others (they should get that money back).
      - If the user is a participant (not payer), subtract their share (they owe that amount).
    - For each transfer:
      - If the user sent money, subtract that amount (they gave money away).
      - If the user received money, add that amount (they got money).
    - Sum of these gives a balance. Positive balance means others owe this user money; negative means this user owes money.
  - Displays the balance with appropriate messaging ("You are owed X" vs "You owe X").
  - Lists each personal transaction with a description:
    - For expenses, we note who paid and list participants.
    - For transfers, we mention whether the user sent or received money and with whom.
  - This personal list allows the user to see just the transactions relevant to them.
  - _Note_: This logic assumes all expenses split equally. For more complex splits, the logic would differ. But equal split is a reasonable assumption here.

- **Wire Up Data with UI**: Ensure that the NavBar, Transactions page, etc., all work together:
  - When a user selects themselves in the dropdown, we navigate to `/my-transactions`. The MyTransactions component uses context’s `currentUser` to filter and display relevant data.
  - If the user then navigates back to "All Transactions", they’ll see the full list again.
  - The "New Transfer" page can be accessed anytime. If a currentUser is selected, it pre-fills the source (and if not, user must pick both source and target from the dropdowns).
  - After adding a transfer, the success message appears; the user can navigate to "All Transactions" or "My Transactions" to see the updated list (or refresh the page). You might notice the new transfer doesn’t automatically show up in the list because we aren’t reloading the data in those pages on action success. To handle that more seamlessly, we could:
    - Use `navigate('/transactions')` in the action after successful creation, which would trigger the transactions loader to refresh (since navigation to that route occurs). Or,
    - Use React Router’s `useRevalidator()` to manually trigger revalidation of loaders.
    - For now, it’s fine to instruct students to check their lists manually after adding.
- **Recommended Folder/Module Structure**: Notice how we structured route components and co-located their loaders/actions. This follows React Router’s recommended approach of keeping route concerns together. Another approach is to use file-based routing (like Remix or Next.js style), but in our simple setup we manually created the route array.
  - We also used an `id` on the root route to identify and access its loader data from children (via `useRouteLoaderData('root')`). This is a common convention to share data like the user list to many parts of the app (NavBar, forms, etc.) without passing props down long chains.
  - We passed the current user via context to demonstrate global state sharing (any child can `useOutletContext` to get it). This is simpler than using a separate context provider since React Router Outlet provides this pattern out of the box.
- After implementing these changes, **test the frontend** thoroughly:
  - The app should start at the home or transactions page. The NavBar should show "No User" by default and the "My Transactions" link should be disabled.
  - The All Transactions page should list all expenses and transfers from the backend.
  - Selecting a user from the dropdown should navigate to My Transactions. There, you should see only those transactions involving that user, and the computed balance.
  - Try selecting each user and verifying the balance calculation makes sense (e.g., if Alice paid more than she owed, the balance should show she’s owed money).
  - The New Transfer form should allow creating a transfer. If you select a source and target and submit, check:
    - The form should show a success message (or error if something was wrong).
    - The backend should indeed have a new transfer record (check via API or Prisma Studio).
    - If you then go to All Transactions, you might need to refresh or re-navigate to see it (depending on caching). A full page refresh will definitely fetch fresh data. In a real app, we’d improve this by revalidating loaders after actions (React Router can do this automatically for loaders on the same page, but since our form route is separate, we manually handle it).
  - Expense Detail page: from All Transactions, click a "details" link on an expense. It should load the detail route and display all info. Try an expense where more than one participant exists to see the list and per-person share. Use the browser's back button or nav links to return.

At this point, our frontend state management is much more advanced: data is fetched through dedicated loaders, global state (current user selection) is handled via context at the layout level, and page navigation and data loading are tightly integrated thanks to React Router’s framework-style approach. We’ve reduced a lot of manual `useEffect` and prop-drilling by using these patterns.

### 5. UI Features and Enhancements

**Goal**: Polish the user interface to accommodate the new features – user selection in the navbar, combined transactions list, transfer form, and personal transactions page – using our existing styling tools (Tailwind, Shadcn components) for a clean UX.

Now that the core functionality is in place, we should refine the UI and UX:

- **Navbar User Switcher**: Ensure the dropdown is prominently placed. Consider using a Shadcn UI component for a nicer look:
  - Shadcn’s `<Select>` component can replace the `<select>` element. You would need to import the pre-built Select from Shadcn (if you installed the forms components in Lesson 3). Using it can give you a styled dropdown with consistent design.
  - If using Shadcn Select, you would set up a state for selected user and update on selection, similar to our current logic.
  - The NavBar could also display the current user’s name or avatar (if we had one) as a label.
- **Nav Links and Routing**: We used anchor `<a>` tags for navigation in the NavBar for simplicity. In a single-page app, it’s better to use React Router’s `<NavLink>` or `<Link>` to avoid full page reloads. For example:
  ```jsx
  <NavLink to="/transactions" className={({ isActive }) => (isActive ? 'font-bold underline mr-4' : 'mr-4')}>
    All Transactions
  </NavLink>
  ```
  Using `<NavLink>` allows you to style the active link (e.g., bold/underline the link corresponding to the current page).
- **Responsive Design**: If desired, adjust the layout to be responsive. Tailwind classes can help make the navbar a column on small screens, etc. Given time constraints, focus on desktop view first.
- **Transaction List**:
  - Add headings or labels to differentiate expenses vs transfers, if needed. Currently, our combined list items have slightly different wording but all are in one list. You could group them or use icons (e.g., 💰 for expenses, 🔁 for transfers) to visually distinguish.
  - Ensure the date format is consistent (we used `toLocaleDateString`; you can refine formatting).
  - Possibly sort or filter options: maybe allow sorting by amount or date, or filtering to only expenses or transfers. This can be an extension if time allows (similar to the optional challenge from Lesson 1 about sorting).
- **Transfer Form**:
  - The form currently doesn’t populate the `<select>` options for users (we left a comment). Implement that by retrieving the user list:
    ```tsx
    const rootData = useRouteLoaderData('root') as { users: Array<{ id: number; name: string }> };
    const users = rootData.users;
    ```
    Then:
    ```jsx
    {
      users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name}
        </option>
      ));
    }
    ```
    Do this for both source and target selects. You might want to exclude the currently selected user from the target list to prevent obvious mistakes.
  - Add client-side validation: for instance, use an `onSubmit` handler to check that sourceId != targetId and show an immediate error message instead of waiting for server response.
  - If using **React Hook Form + Zod**, you could define a Zod schema for TransferFormData (amount positive, sourceId and targetId required and different) and integrate it with RHF to get errors easily. This would be a great enhancement if time permits (see optional section below).
  - Use Shadcn form components (inputs, select) for a more polished look and built-in styling/validation states.
  - Consider resetting the form upon successful submission (`success` in actionData) to allow entering another transfer easily.
  - Show a success notification (maybe a toast) upon success instead of just a text message.
- **Expense Detail**:
  - If the detail page looks plain, style it with tables or cards. For instance, display participants in a table with columns for Name, Email, Bank Account.
  - If there is sensitive info (like actual bank accounts), you might hide those from the UI or only show for certain users. But since this is a demo, showing it is fine.
  - Add a back button (`<Link to="/transactions">Back to list</Link>`) for convenience.
- **My Transactions**:
  - Maybe split the transactions by category: show a subheading "Expenses:" then list of expenses involving user, and "Transfers:" then list of transfers involving user. This can help organize the information.
  - Ensure the balance calculation is correct. Test scenarios:
    - If the user is involved in no transactions, balance should be €0 (and maybe say "You are settled up!").
    - If they only paid for others and never received anything back, the balance should be positive (others owe them).
    - If they only participated in others’ expenses and never paid, balance negative (they owe others).
    - If transfers have happened, those directly impact the balance accordingly.
  - Display the balance prominently. Perhaps use a colored badge: green if they are in credit (owed money), red if they are in debt (owe money).
  - This page currently fetches all transactions independently. If performance becomes an issue or to avoid duplication, consider having `/transactions` loader fetch data and then share it via context or Redux or a Query library. But given moderate data, it’s fine.
- **General Styling**: Use Tailwind to improve the visual hierarchy:
  - Use consistent spacing and font sizing for headings (`text-2xl` for main titles, etc.).
  - Use tables or flexbox to align multi-column data (like listing participants or transactions in a grid).
  - Highlight important elements (like the current balance or error messages) with appropriate colors (Tailwind utility classes like `text-green-700`, `bg-yellow-100`, etc.).
  - Ensure the app’s new pages match the style of earlier pages (for example, if Lesson 3 added a fancy welcome page with a carousel, keep that style consistent).
- **Testing UX**: Simulate a mini-user flow:
  1. On All Transactions, verify all data is visible.
  2. Select a user, see My Transactions update and balance calculation.
  3. Add a transfer from that user to another. On success, go back to My Transactions and confirm the balance changed and the transfer appears.
  4. Try adding an expense via API or a simple form (we didn’t build a new expense form page in the UI, only transfer form – adding expenses could remain via an API or you could optionally create a quick page to add expense too).
  5. Use the Reset endpoint if you implemented it (or reseed via script) to test the app with fresh data or different scenarios.
  6. Ensure no console errors occur and handle any edge cases (e.g., what if an expense has 0 participants – our code would divide by zero; we assume at least 1 participant).

At this stage, you have a fully functional multi-user expense sharing app with a sophisticated state management approach. The backend uses a relational database with Prisma to maintain state (expenses, users, transfers), and the frontend cleanly loads and updates state through React Router’s data layer. The app should feel more robust and scalable, and the patterns learned here (loader/actions, context for global state, Prisma relations) are widely applicable to real-world projects.

---

## Optional Enhancements

If you have additional time or for homework, consider tackling these enhancements to further improve robustness and user experience:

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

### B. Toast Notifications for User Feedback

Leverage the Shadcn UI’s **sonner** (toast) component to show notifications:

- Install sonner if not already (`npm install sonner`) and wrap your app in the `<Toaster />` provider as per Shadcn docs.
- Whenever a new expense or transfer is added (or any significant action), trigger a toast notification. For example, on successful form submission, show a toast: “Transfer of €X from Alice to Bob added!”.
- Also show error toasts for failures (e.g., “Failed to load data” or validation errors) – though for validation it’s better to show inline messages.
- Using toast notifications enhances UX by giving quick feedback without requiring the user to find messages on the page.

### C. Polishing the Data Calculations

Our balance calculation logic in My Transactions is rudimentary and assumes equal splits. Consider enhancing:

- Allow unequal split in an expense (e.g., maybe Alice paid for Charlie entirely – in that case participants might not include Alice, or a separate field could denote shares). This gets complex, but thinking about it is a good exercise.
- If unequal splits were allowed, the data model might include a separate join table with a share percentage or amount for each participant per expense. This is beyond our current scope, but it’s how real apps handle complex splits.
- For now, test more scenarios with equal splits to ensure the logic holds.

### D. Additional Routes and Features

- **Add Expense Form**: Create a page to add a new Expense via the UI (similar to how we did for transfers). This would involve a form to input description, amount, select a payer, and select multiple participants (perhaps with checkboxes or a multi-select). You can use react-hook-form’s `<Controller>` to manage multi-select or a creative UI for participant picking. The action would POST to `/api/expenses` and on success redirect or show toast.
- **Edit/Delete Transactions**: Allow editing an expense or transfer (e.g., if entered incorrectly). This would involve pre-filling a form with existing data and calling PUT/PATCH endpoints (which you’d need to implement in the backend). Similarly, a delete button could call DELETE endpoints. Be sure to handle the cascading effects (e.g., deleting an expense should maybe adjust balances).
- **UX Improvements**: Add a confirmation dialog (using a Shadcn Dialog component) when switching the current user if there are unsaved changes on a form. Or confirm before deleting a transaction.
- **Styling**: Use more Shadcn components like **Data Table** for the transactions list to allow sorting and filtering out-of-the-box. The Shadcn DataTable component tied to TanStack Table could handle a lot of this, albeit with more setup.

By implementing these optional enhancements, you’ll further align the app with production-grade features. Even without them, you’ve accomplished a lot in this lesson: setting up a multi-model database, using an advanced backend template, and mastering React Router’s data flow for state management. These patterns and skills are very much what professional web developers use daily.

## Summary

- We migrated our backend to a **TypeScript Express template** for better structure, and integrated **Prisma** to manage complex state with a relational database. This introduced true relationships between data (users, expenses, transfers) instead of using simple JSON storage.
- We learned how to define **Prisma models** with relations (one-to-many for payer expenses, many-to-many for expense participants, and self-relations for transfers between users) and used **Prisma Migrate** to evolve the database schema safely.
- On the frontend, we refactored to use **React Router loaders and actions**, moving data fetching logic out of components and into the routing layer. This makes our data flow more declarative and tied to routes, improving maintainability and performance (data is loaded before rendering).
- We utilized a **Layout route with Outlet context** to manage global state (current user selection) and to share common data (user list) across pages. This is a clean way to handle state that many components need without prop drilling.
- We implemented new UI pages: a combined **Transactions list**, a **Transfer form**, a **My Transactions** (personal view) page, and an **Expense detail** page. Each demonstrates different aspects of state management: aggregated data, form submission with side effects, filtered views based on context, and detailed views with related records.
- Through optional tasks, we identified ways to further improve state management and user experience: incorporating schema validation (Zod) to ensure our app’s state remains valid, and using toast notifications to keep users informed of state changes (like successful operations).
- The app now supports a realistic scenario of multiple users sharing expenses and settling up, showcasing how **backend state** (database) and **frontend state** (React) interact in a complex app. This lays a strong foundation for any full-stack application you'll build going forward, as you can confidently model data and manage state across the stack.

Continue to experiment with these patterns. In future lessons or projects, you might explore even more state management techniques (like Redux or context for more global state, or libraries like React Query for data fetching). But the principles remain the same: keeping state updates predictable, centralizing data logic, and providing a great user experience through timely data loading and feedback. Well done on reaching this advanced stage of the project!

---
