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

### 1. A new Backend Template

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

---

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

---

### 4. Better Frontend Routing

**Goal**: Refactor the React frontend to use React Router’s data API (loaders and actions) for fetching data and handling form submissions. Also adopt a structured routing setup (with a layout route and nested routes) as recommended by React Router docs.

Until now, our frontend likely used explicit `fetch` calls inside components (e.g., in `useEffect`) to get data, and `useNavigate` for programmatic navigation. 

- **Loaders** to fetch data _before_ rendering a route, providing data via `useLoaderData`.
- **Actions** to handle form submissions declaratively via `<Form>` components.
- A central route configuration instead of manually managing navigation state or using a context for pages.

We’ll also introduce a **layout page** to manage common UI (like the NavBar and user selection) and share data (like the user list) across routes.

**Step-by-step:**


- **Create a Router Configuration**: In your `frontend/src/main.tsx` (or wherever you render `<App/>`), set up a React Router provider. For example:

  ```tsx
  import { createBrowserRouter, RouterProvider } from 'react-router-dom';
  import Layout { loader as layoutLoader } from './pages/Layout';
  import Home from './pages/Home';
  import Transactions, { loader as transactionsLoader } from './pages/Transactions';
  import ExpenseDetail, { loader as expenseDetailLoader } from './pages/ExpenseDetail';
  import TransferForm, { action as transferAction } from './pages/TransferForm';
  import MyTransactions { loader as myTransactionsLoader } from './pages/MyTransactions';

  const router = createBrowserRouter([
    {
      Component: Layout,
      loader: layoutLoader,
      id: "layout"

      children: [
        { index: true, Component: Home },
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
          Component: TransferForm,
          action: transferAction,
        },
        {
          path: 'my-transactions',
          Component: MyTransactions,
          loader: myTransactionsLoader,
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
  - We created a root route for `'/'` with a `Layout` component and an `id: 'layout'`. We gave it a loader that fetches the list of users from our backend (`/api/users`). This means when the app (or any nested route) loads, we will have `useLoaderData()` available in the Layout (and child components can also access it via `useRouteLoaderData('layout')` if needed).
  - We define child routes:
    - The default index route `'/'` which renders a `Home` component (a welcome or summary page).
    - `/transactions` route to show the combined list of expenses and transfers. It uses `transactionsLoader` that we will define in `Transactions.tsx` to fetch data from `/api/transactions`.
    - `/expenses/:id` route to show an expense detail page, with its own loader to fetch `/api/expenses/{id}`.
    - `/transfers/new` route to show a form for creating a transfer. This uses an **action** (`transferAction`) to handle the form submission.
    - `/my-transactions` route for the current user’s personal transactions. We might not need a separate loader here if we reuse the data from `/transactions` and filter it on the client side, or we could call a specialized endpoint. We’ll decide when implementing it (likely filtering the already loaded transactions or calling `/api/transactions` again).
    - Notice how we are now using `Component`  property of the [Route Object](https://reactrouter.com/start/data/route-object) and not `element`, this simple changes means that it is now React-Router which instantiates the page component, at the time and with the props that it now controls.

- **Layout and NavBar**: In `Layout.tsx`, create a layout component that renders the NavBar and an `<Outlet />` for child pages:

  ```tsx
  import { Outlet, useLoaderData, useNavigate } from 'react-router-dom';
  import { useState } from 'react';

  export async function loader()  {
        // ...
        return { users };
  }

  export default function Layout() {
    const { users } = useLoaderData();
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<null | number>(null);

    const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const userId = e.target.value === 'none' ? null : Number(e.target.value);
      setCurrentUser(userId);
    };

    const outletContext = {
      currentUser,
    }

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
          <Outlet context={outletContext}/>
        </main>
      </div>
    );
  }

  type ContextType = { currentUser: User | null };
 
  export function useCurrentUser() {
    const { currentUser } =  useOutletContext<ContextType>();
    return currentUser;
  }
  ```

  Here we:
  - Use `useLoaderData` to get the list of users loaded by the root loader (the user list for the dropdown).
  - Manage a piece of state `currentUser` in Layout to track which user is selected (if any). We initialize it as `null` meaning "no user".
  - Render navigation links: “All Transactions”, “New Transfer”, “My Transactions”. We disable (grey out) the "My Transactions" link if no user is selected (so users understand they must choose someone).
  - Render a `<select>` dropdown listing all users plus an option for "No User". Changing it updates `currentUser` state.
  - We provide `Outlet` for displaying the children, and provide the current user as context. This is using the similar technique of React Context seen in previous lesson but with a direct integration in react router because it is so common for a Layout component to provide a context, we even provide a direct hook for getting the currentUser with a very explicit name. See https://reactrouter.com/api/hooks/useOutletContext 


- **Transactions List Page**: In `Transactions.tsx`, implement the loader and component to display all transactions:

  ```tsx
  import { useLoaderData, Link } from 'react-router-dom';

  interface Transaction {
    //...
  }

  // Loader function to fetch combined transactions
  export async function loader() {
    // load data from api
    return data as Transaction[];
  }

  export default function Transactions() {
    const transactions = useLoaderData() as Transaction[];
    return (
      <section>
        // ...
          {transactions.map((tx) => (
            <li key={`${tx.type}-${tx.id}`} ...>
              // Conditionally render an ExpenseTransactionItem or a TransferTransactionItem.
              // they must be defined in their own file, in the components/ subdir
              // these are NOT pages and therefore do not have loaders.
              // The component for rendering expense must have a NavLink
            </li>
          ))}
        </ul>
      </section>
    );
  }
  ```

  What’s happening:
  - The loader fetches `/api/transactions` and returns the array of transactions. We imagine each item having a field for easily differentiating expenses and transfers
  - The component uses `useLoaderData()` to get that array and then displays each transaction in a list item.
  - For each item, we check the type:
    - If it's an `expense`, we display its description, who paid (payer name), amount, and how many participants shared it. If `participants.length > 1`, we show “for X people”; if it equals 1 (meaning only payer themselves), we say “for themselves”.
    - If it's a `transfer`, we show a sentence like “Alice transferred €50 to Bob on 01/10/2025.”


- **Expense Detail Page**: In `ExpenseDetail.tsx`, we will fetch and display detailed info for one expense:

  ```tsx
  import { useLoaderData } from 'react-router-dom';

  interface Expense {
      //...
  }

  export async function loader({ params }: { params: any }) {
    const expenseId = params.id;
    // get from API
    return expense as Expense;
  }

  export default function ExpenseDetail() {
    const expense = useLoaderData() as Expense;
    return (
      <section>
        <h2 className="text-2xl font-bold mb-4">Expense Details</h2>
        // ...
      </section>
    );
  }
  ```

  Explanation:
  - The loader uses the `id` param from the route and fetches that expense. We expect our backend to include the related payer and participant details.
  - We display all the key info, including:
    - Payer’s name, email, and bank account (if available).
    - List of participants, each with name, email, bank (if any).
  - We also compute and display each participant’s share of the expense (just total divided by number of participants). This helps illustrate who owes what for this expense.

- **Transfer Form Page**: In `TransferForm.tsx`, create a form for adding a new transfer:

  ```tsx
  import { useState } from 'react';
  import { Form, useActionData, useNavigation } from 'react-router-dom';
  import { useCurrentUser } from 'src/pages/Layout';

  interface TransferFormData {
    amount: number;
    sourceId: number;
    targetId: number;
  }
  interface ActionResponse {
    error?: string;
    success?: boolean;
  }


  export async function action({ request }: { request: Request }) {
    const formData = await request.formData();
    const amount = formData.get('amount');
    const sourceId = formData.get('sourceId');
    const targetId = formData.get('targetId');
   
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
    const currentUser  = useCurrentUser();
    const actionData = useActionData() as ActionResponse;
    const navigation = useNavigation();
  
    const isSubmitting = navigation.state === 'submitting';

    return (
      <section>
        <h2 className="text-2xl font-bold mb-4">New Transfer</h2>
        // adapt the form with what we have seen last lesson about react hook form
        <Form method="post" className="max-w-sm space-y-4"  >
          {actionData?.error && <p className="text-red-600">{actionData.error}</p>}
          {actionData?.success && <p className="text-green-600">Transfer recorded successfully!</p>}
          
          {/* Populate options from users list */}
          {/* You can either load the user list in loader, or try to pass it from the list received in the layout */}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Add Transfer'}
          </button>
        </Form>
      </section>
    );
  }
  ```

  Let’s unpack this:
  - We use `<Form method="post">` from react-router-dom. This will automatically trigger our `action` on the route when submitted.
  - The `action` function (above the component) reads form data and calls the backend POST `/api/transfers`. If something is missing or invalid (like source == target), we return an `{ error: ... }` object. If successful, we return `{ success: true }`. These return values become `actionData` accessible via `useActionData()` in the component. Notice that we do not redo form validation here, this was already done by react-hook-form before this function was called.
  - In the component:
    - We use `useCurrentUser` to get `currentUser` from Layout. 
    - We use `useNavigation()` to get the navigation state; this lets us disable the submit button and show "Submitting..." text while the form is in flight.
    - We display any `actionData.error` or success message if present.
    - The options for the select dropdowns: to populate them, we need the list of users. We have it in the root loader (`users` data). We have two ways:
      1. Use `useRouteLoaderData('layout')` to get the users from the root route loader.
      2. Or pass the users list through context as well. We already pass currentUser; we could pass the whole users array in context too.
      3. Or we fetch the list of users again (this might be needed if there is a different logic than: all users are possible participants)


    - When the action returns success, we show a success message. You might also want to redirect the user or reset the form. For example, on success, you could navigate to `/transactions` or `/my-transactions`. However, since we didn't explicitly call `redirect()` in the action, the page will not navigate by itself. Perhaps as an improvement, if `actionData?.success` is true, you could use `useNavigate` to redirect after a short delay or on the next render. We keep it simple: show a message and the user can manually go back or use nav links.

- **Expense Form Page**: In `ExpenseForm.tsx`, create a form for adding a new expense. This is very similar to the previous page.

- **My Transactions Page**: In `MyTransactions.tsx`, display the transactions relevant to the currently selected user (from context):


This page is very similar to previous ones. It does not have an action but it has a loader.
Try to compute the balance for current user, but do not spend too much time on it. This is an interesting problem but out of the scope of this course.
If there is no current user, use the loader to navigate to Home page.


- **Recommended Folder/Module Structure**: Notice how we structured route components and co-located their loaders/actions. This follows React Router’s recommended approach of keeping route concerns together. 
  
  - We also used an `id` on the layout route to identify and access its loader data from children (via `useRouteLoaderData('layout')`). This is a common convention to share data like the user list to many parts of the app (NavBar, forms, etc.) without passing props down long chains.
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
- On the frontend, we refactored to use **React Router loaders and actions**, moving data fetching logic out of components and into the routing layer. This makes our data flow more declarative and tied to routes, improving maintainability and performance (data is loaded before rendering).
- We utilized a **Layout route with Outlet context** to manage global state (current user selection) and to share common data (user list) across pages. This is a clean way to handle state that many components need without prop drilling.
- We implemented new UI pages: a combined **Transactions list**, a **Transfer form**, a **My Transactions** (personal view) page, and an **Expense detail** page. Each demonstrates different aspects of state management: aggregated data, form submission with side effects, filtered views based on context, and detailed views with related records.

- The app now supports a realistic scenario of multiple users sharing expenses and settling up, showcasing how **backend state** (database) and **frontend state** (React) interact in a complex app. This lays a strong foundation for any full-stack application you'll build going forward, as you can confidently model data and manage state across the stack.


---
