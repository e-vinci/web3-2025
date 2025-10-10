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
On the frontend, we'll leverage React Router’s Data APIs loaders and global state (context) to handle more complex interactions.

By the end of this lesson, our app will support multiple users who can owe or pay each other. We’ll have a unified **Transactions** list (combining expenses and direct transfers), the ability to record transfers of money. 

This will involve significant changes: updating our API endpoints, enhancing our Prisma models with relationships, and refactoring the React app to use React Router’s recommended patterns for data loading and mutations.

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

#### **Clone Template**:

Backup your current backend `directrory` for easily accessing your code, and clone the Express+TS template repository as your new backend directory.
  ```bash
  mv backend backend.backup
  git clone https://github.com/edwinhern/express-typescript.git backend
  ```
  This boilerplate provides a structured starting point (TypeScript, project architecture, testing, etc.). Navigate into `backend/` and run `npm install` to install dependencies.

#### **Delete .git folder**:

When you cloned the template repository, you created a local `.git` subfolder in your `backend` folder. This will confuse github, as it will interpret your backend directory as a git submodule. Delete that file.

```bash
rm -rf backend/.git
```


#### **Review Structure**: 

Open the project and briefly examine the structure. You’ll see an organized layout under `src/`: 
  - an `api` folder where we will write features (with subfolders for like `user`, and `healthcheck`)
  - an `api-docs` folder for serving the documentation of our API. We will not spend time maintaining the documentation of our API in the scope of this course, but the template is ready for it.
  - a `common` folder for middleware setup and other conveniences (logging, environment validation with Zod, etc.). 
  
  Take note of the different files under the `user` feature: Router, Model, Controller, Service, Repository – we will follow this pattern for our new features. 
  
> Notice as well that each feature has its own automated tests in a `__tests__` directory. These are based on the tool [vitest](https://vitest.dev/).
> In the scope of this course we will not write tests, but if we did, each feature folder would have their own. tests.


#### **Environment Setup**: 

Copy the provided `.env.template` to a new `.env` file in the backend folder. Fill in any required env vars. Set your `PORT` to `3000` and `CORS_ORIGIN` to `http://localhost:5173` (the url of your frontend) . We will add a database connection URL here later.


#### **Run the Template**: 

Try running the server in dev mode to ensure everything is working:
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

#### **Add Prisma to the Project**: 

Stop the server. We will now integrate Prisma into this template.

Install Prisma as a development dependency:

```bash
npm install prisma --save-dev
```

Copy your `prisma/schema.prisma` file from your `backend.backup` directory, and add `DATABASE_URL` to your .env file with the same value from your backend directory.
Copy the files we used for checking the connection to database and proper prisma configuration as well: `db-read.js` and `db-populate.js`

Generate your prisma client code: `npx prisma generate` and run `node db-read.js` for validating that your prisma is working correctly.

> Note: Last week we had issues related to the option `--no-engine` of `prisma generate`. This option skips installing some prisma modules because they are not needed when running a prisma-flavoured database, like the one we get when running `npx prisma dev`. But these engines ARE necessary when using a normal database, like the one we use in production. The differences between the two are out of scope of this course, and we recommend using always `npx prisma generate` and accept the warning locally.

You should always use a local database in development and only connect the cloud hosted when you are debugging production issues. In real life, the production database will never be accessible from your own machine and using the production database during development will break the production app and drive your teammates crazy. 

Keep in mind that even if you are currently a solo developer working on an app without users, this is not the case in real life. 
  

---

### 2. Data Models and Migration

**Goal**: Define the new Prisma data models for `User`, `Expense`, and `Transfer` with proper relations, then create and apply a migration to update the database schema.

Our app now requires understanding **who** paid or transferred money to whom. We will introduce a `User` model and link it to expenses and transfers. We’ll also modify the existing `Expense` model to reference users instead of using plain strings.

#### Initial migration

In the previous lesson, we had to call `npx prisma db push` on render before starting the app. This was necessary to ensure the database was indeed in the expected state described in the schema file. This is a very simple and dangerous way to keep a database "in sync" with the schema, what we actually want to do is running migration(s) we have carefully prepared for controlling how the database evolves. 

In order to run with migrations, we need a second database in development, it's called the "shadow database" and it's a temporary database which purpose is protecting the dev database from dangerous change. More info [here](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/shadow-database). If you use `npx prisma dev` for starting your database, you get that shadow database automatically. If you use a more conventional setup, you will need to add a new connection string to your `.env` file: `SHADOW_DATABASE_URL="postgres://<...>"`.

First of all, we want to have an initial migration describing the current db state. We already have a table in the database and we need a migration describing this. Having this initial migration will allow us in the future to start from an empty database and simply run all migrations to reach the current state.

We will follow the process described in the [prisma documentation](https://www.prisma.io/docs/orm/prisma-migrate/getting-started#create-a-baseline-migration)

```bash
mkdir -p prisma/migrations/0_init
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql
```

You can look at the file `prisma/migrations/0_init/migration.sql` and see that it simply contains a `CREATE TABLE` for the table we used las week. This is what `npx prisma db push` did when we executed it with the schema from last week.

Mark this migration as resolved :

```bash
npx prisma migrate resolve --applied 0_init
```

You also need to mark this migration as already applied in production.
Change your `DATABASE_URL` in your `.env` to the value you use in production and run the above command again. 
Then restore your `.env` file with your local value.

> **Important** It is not "normal" to manipulate the production database from your local environment, and most of the time this will not even be allowed by the configuration of your database. We are doing it here because we started the project with a prototyping mindset (using prisma db push) and we are now in a more future proof mindset.

#### **Define `User` Model**: 

Open `prisma/schema.prisma`. Under the `datasource` and `generator` blocks, define a new model for users:

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

#### **Update `Expense` Model**: 

Modify the `Expense` model:

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

#### **Define `Transfer` Model**: 

Add a new model for transfers:

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

#### **Create a Migration**: 

Now that the models are defined, we will use Prisma Migrate to apply these changes:


```bash
npx prisma migrate dev --name add-users-and-transfers
```

This should do the following, but it will fail:
- Generate a SQL migration file (under `prisma/migrations/`) reflecting the changes (new tables for User and Transfer, updated Expense table with new columns and join table for participants).
- Apply the migration to your database. If all goes well, your database now has three tables (plus an implicit join table for Expense <-> User many-to-many).
- Update the Prisma Client to be in sync with the new schema (this happens automatically on migrate; alternatively you could run `npx prisma generate`).

The command failed because there is already data in the database and it cannot enforce a default value for required column Expense.payerId.
This is exactly why we want to have control over migrations, we need to do something smarter for evolving the database while preserving data.

Let's instead create the migration and customize it before applying it. There is documentation about this process [here](https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations)

```bash
npx prisma migrate dev --name add-users-and-transfers --create-only
```

Now open the file `prisma/migrations/<timestamp>_add_users_and_transfers/migration.sql` and adapt it for creating the required data and sequencing the changes in a relevant order.

Since the point of this course is not SQL, here is a working code, read it and observe how we generate data, how we make a column temporarily nullabe then non-nullable, how we add a foreign key only when data is available, etc.

```sql
/*
  Warnings:

  - You are about to drop the column `payer` on the `Expense` table. All the data in the column will be lost.
  - Added the required column `payerId` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "bankAccount" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" SERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceId" INTEGER NOT NULL,
    "targetId" INTEGER NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ParticipantExpenses" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ParticipantExpenses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "_ParticipantExpenses_B_index" ON "_ParticipantExpenses"("B");

-- Insert User records from existing Expense.payer data
INSERT INTO "User" ("name", "email")
SELECT DISTINCT 
    "payer" as "name",
    LOWER(REGEXP_REPLACE("payer", '[^a-zA-Z0-9]', '.', 'g')) || '@expenso.dev' as "email"
FROM "Expense"
WHERE "payer" IS NOT NULL;

-- Add payerId column as nullable first
ALTER TABLE "Expense" ADD COLUMN "payerId" INTEGER;

-- Update payerId with corresponding User IDs
UPDATE "Expense" 
SET "payerId" = "User"."id"
FROM "User"
WHERE "User"."email" = LOWER(REGEXP_REPLACE("Expense"."payer", '[^a-zA-Z0-9]', '.', 'g')) || '@expenso.dev';

-- Make payerId NOT NULL after setting values
ALTER TABLE "Expense" ALTER COLUMN "payerId" SET NOT NULL;

-- Drop the old payer column
ALTER TABLE "Expense" DROP COLUMN "payer";

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParticipantExpenses" ADD CONSTRAINT "_ParticipantExpenses_A_fkey" FOREIGN KEY ("A") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ParticipantExpenses" ADD CONSTRAINT "_ParticipantExpenses_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

```

Now run the migration 

```bash
npx prisma migrate dev

```

this will try to run all the missing migration, and this time it will succeed.

#### **Verify the Schema in DB**: Use Prisma Studio or a database client to inspect the tables:

```bash
npx prisma studio
```

Check that you have Models for `User`, `Expense`, and `Transfer`. 
Look how you migration properly created the User records and connected them to the Expense records.


#### **Run the migration on production**

Now we will need to add a new step after generating the client but before starting the app: executing the migrations. 
The command for executing migrations is `npx prisma migrate deploy`

Notice how it is a different command than the one we ran in development, this is because this command :

- Does not look for drift in the database or changes in the Prisma schema
- Does not reset the database or generate artifacts
- Does not rely on a shadow database

We also need to change how we build and start the app on Render.

The command for building is : `npm install && npm run build`. This will transpile the code and bundle it in "dist/" directory.
The command for starting is : `npx prisma migrate deploy && npm run start:prod `. 


#### **Seeding Initial Data**: 

Usually we want to have some initial data when working in development, this is the purpose of the script `db-populate.js`. We may also need initial data for our app to work correctly, like a list of countries, or a list of currencies, this is called "seed" data. 

Prisma has a tool for inserting seed data any time you reset your database, and you can read more about it [here](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding). For our project, we will simply keep and adapt our `db-populate.js` script, it's a simpler alternative, even if less powerful. Making this kind of choice - choosing to stop at what is good enough and will be easy to improve later - is a very important skill for software engineers, because we always work under time constraints. 

Adapt your script `db-populate.js` for creating a few users, expenses, and transactions.


#### **Delete your backup backend directory**

We won't need it anymore and it will make it harder for you to navigate your files.

---

### 3. Backend API Changes

**Goal**: Implement new REST API endpoints for users, transfers, and combined transactions, and refactor existing routes to conform to the template’s structure and the new schema.

Our Express template uses a structure where each feature (e.g., `user`) has its own router, controller, service (or repository/model) files. We will add new feature modules for `expense` and `transfer`, and adjust the existing expense logic from prior lessons to use Prisma.

#### **Delete api documentation feature**: 

Because of the time constraint, we will not be registering our routes to the openAPI documentation. We will not be validating the request payload according to that documentation neither. In a professional project, these are necessary actions because you want to guarantee to people using your API that the documentation is up to date and enforced. You can try to do it as an additional exercice, taking inspiration from the [template](https://github.com/edwinhern/express-typescript/blob/master/src/api/user/userRouter.ts). 

You can delete the `api-docs` folder, and adapt all routers to not use the documentation registry anymore. You can also delete the swagger route from server.ts

Confirm that everything is till working by opening your health check page.

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
  


  - `expenseRepository.ts`: This will use Prisma Client to interact with the DB, similar to Services from previous lessons. Pay attention to the create function as it is more complex than it looks. You will need to create an expense associated with the correct participants but you will only receive their ids from the frontend. Prisma has a concept of [**connecting** records](https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries#connect-multiple-records) which will help you do that. 

    Notice as well how we do not await for prisma response, we return a Promise, and therefore our functions are async.

    Here is an example of the Repository: 

    ```ts
      import { PrismaClient } from '../../../generated/prisma';

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

  - Add the router to your server : 
    
    ```server.ts
    //...
    app.use("/api/expenses", expenseRouter);
 

 - Add the file `src/api/expense/expenseRequests.http`: This will help you test the the routes with your REST Client.
  
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

Check your requests are working correctly


#### **Implement User Routes**: 

The template already has a basic `userRouter` and `userController` for a sample user endpoint (check `src/api/user`). These are only present for illustrating what is a router, controller, model (which we call repository), and service.
  
Delete the `src/api/user` directory and start a new one from scratch.
You can adapt it if you feel more comfortable, but there should be no line of code at the end of the exercice that you do not understand and own; we highly recommend that you delete the whole folder once you understand how the different files articulates.

Following a similar approach than the one used for expense, implement the following route

  - `GET /api/users`: return list of all users.


#### **Implement Transfer Routes**: 

Create a new `transfer` module in `src/api/transfer`: You need to list and create transfer, similar to what you did for expenses.

#### **Combined Transactions Endpoint**: 

Create an endpoint for getting all transactions (expenses and transfers). Otherwise you'll send two requests from the frontend and combine these in the frontend.

  - `GET /api/transactions`: return list of all transactions.

> The main advantage of doing a combined endpoint is pagination but this is out of scope for this lesson.

Because `Transaction` is not a prisma model, you need another way of ensuring its type. Use zod for this. You can take inspiration from the [template](https://github.com/edwinhern/express-typescript/blob/master/src/api/user/userModel.ts)

Your frontend will likely want to know whether a specific transaction is an expense or a transfer, do not forget to add a `kind` field for that case.  This is similar to [discriminated unions in typescript](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions)


You will also need to easily make a Transaction object from an Expense or a Transfer, the easiest approach for this is to write functions like `fromExpense` and `fromTransfer` directly into your `TransactionModel.ts` module. 
These functions will expect a parameter which include relations, but when you import a type from Prisma, you will NOT have any relations included. 
Fortunately, you can easily ask Prisma for a type including relations using `Prisma.XXXXGetPayload< ... >`, more info [here](https://medium.com/@jkc5186/understanding-typescript-types-with-prisma-e0e41a7d98f3).

Here is the code you can use for `transactionModel.ts` :

```ts
import { Prisma } from '@/generated/prisma';
import { z } from 'zod';

type ExpenseWithPayerAndParticipants = Prisma.ExpenseGetPayload<{
  include: {
    payer: true;
    participants: true;
  };
}>;
type TransferWithSourceAndTarget = Prisma.TransferGetPayload<{
  include: {
    source: true;
    target: true;
  };
}>;

export type Transaction = z.infer<typeof TransactionSchema>;

export const TransactionSchema = z.object({
  id: z.string(),
  description: z.string(),
  amount: z.number(),
  date: z.date(),
  kind: z.enum(['expense', 'transfer']),
  payer: z.any(),
  participants: z.array(z.any()),
});

export const TransactionArraySchema = z.array(TransactionSchema);

export const fromExpense = (expense: ExpenseWithPayerAndParticipants): Transaction => {
  return TransactionSchema.parse({
    id: `expense-${expense.id}`,
    description: expense.description,
    amount: expense.amount,
    date: expense.date,
    kind: 'expense',
    payer: expense.payer,
    participants: expense.participants,
  });
};

export const fromTransfer = (transfer: TransferWithSourceAndTarget): Transaction => {
  return TransactionSchema.parse({
    id: `transfer-${transfer.id}`,
    description: 'Transfer',
    amount: transfer.amount,
    date: transfer.date,
    kind: 'transfer',
    payer: transfer.source,
    participants: [transfer.target],
  });
};

```

Here is the code for transactionRepository, fill the missing lines:

```ts
import { PrismaClient } from "../../../generated/prisma";
import { Transaction, fromExpense, fromTransfer } from "./transactionModel";

const prisma = new PrismaClient();

export async function getAllTransactions() : Promise<TransactionModel.Transaction[]> {
  const expensesPromise = ....
  const transfersPromise = ...

  const [expenses, transfers] = await Promise.all([
    expensesPromise,
    transfersPromise,
  ]);

  const normalizedExpenses = expenses.map((expense) =>
    TransactionModel.fromExpense(expense)
  );
  const normalizedTransfers = transfers.map((transfer) =>
    TransactionModel.fromTransfer(transfer)
  );

  return [...normalizedExpenses, ...normalizedTransfers].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );
}


```


#### **Test the API**: 

Use a REST client and your different .http files  to verify each endpoint:

  - GET `/api/users` – should list your seeded users.
  - GET `/api/expenses` – should list expenses with their payer and participants (verify that the data structure is as expected, e.g., participants is an array of user objects).
  - GET `/api/transfers` – list of transfers with source and target user info.
  - GET `/api/transactions` – combined list of both, sorted by date.
  - GET `/api/expenses/{id}` – details of a single expense (make sure it includes participants and payer info).
  - POST `/api/transfers` with a JSON body (e.g., `{ "amount": 5, "sourceId": 1, "targetId": 2 }`) – should create a new transfer.
  - POST `/api/expenses` with a new expense (e.g., `{ "description": "Coffee", "amount": 3, "payerId": 2, "participantIds": [1,2] }`) – should create expense with Bob as payer and Bob & Alice as participants.

Also ensure error handling middleware in the template will catch and respond with errors appropriately.

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

In your `frontend/src/App.tsx` adapt your router like this: 

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router';
import Layout, { loader as layoutLoader } from './pages/Layout';
import Welcome from './pages/Welcome';
// import Transactions, { loader as transactionsLoader } from './pages/Transactions';
// import ExpenseDetail, { loader as expenseDetailLoader } from './pages/ExpenseDetails';
// import NewTransfer, { loader as NewTransferLoader } from './pages/NewTransfer';

const router = createBrowserRouter([
    {
      Component: Layout,
      loader: layoutLoader,
      id: "layout",

      children: [
        { index: true, Component: Welcome },
        // {
        //   path: 'transactions',
        //   Component: Transactions,
        //   loader: transactionsLoader,
        // },
        // {
        //   path: 'expenses/:id',
        //   Component: ExpenseDetail,
        //   loader: expenseDetailLoader,
        // },
        // {
        //   path: 'transfers/new',
        //   Component: NewTransfer,
        //   loader: NewTransferLoader,
        // }
      ],
    },
  ]);


function App() {
  return (
    <RouterProvider router={router} />
  );

}

export default App;
```

Let’s break down what we did:
  - We extracted the creation of the router out of the component, this way we only call it once, not every time the component is rendered.
  - We removed the page context provider. React router comes with an integrated context provider which we will leverage instead.
  - We removed the code responsible for communicating with the api. We will move that code to its own file. We want to keep the react and non-react code separated.
  - We introduce a concept of `loader` for the Layout (and other future page), the absence of loader module makes our compiler complains, we will fix this soon.
  - We are now using `Component`  property of the [Route Object](https://reactrouter.com/start/data/route-object) and not `element`, this simple changes means that it is now React-Router which instantiates the page component, at the time and with the props that it now controls. This allows the loader to be run **before** the page component.


#### **Layout**: 

Let's fix this broken import and restore our context provider

In `pages/Layout/loader.ts`, create a loader function which will be called by react router, let's also export an interface describing exactly what will be available from the loader. Here is the code, notice that it is a `.ts` and not a `.tsx` file. This is NOT a react file.

```ts
import ApiClient from "@/lib/api";
import type { User } from "@/types/User";

export interface LoaderData {
    users: User[];
}

export async function loader() {
    const users = await ApiClient.getUsers();
    return { users };
}
```

In `lib/api.ts`, add the required code for calling the API and returning a result.
The code will rely on types defined in the `types/` directory. There will be a bit of repetition here between backend and frontend because both need to agree about what a type means.

The code itself is nothing new, so we give it to you. But notice how this code is now entirely separated from react and any react concept.

Add the types definition yourself, or get them from the [solution](https://github.com/e-vinci/web3-2025/tree/main/exercises/lesson-4-advanced-state/frontend/src/types)

```ts
import type { Expense } from "@/types/Expense";
import type { Transaction } from "@/types/Transaction";
import type { NewTransferPayload, Transfer } from "@/types/Transfer";
import type { User } from "@/types/User";

const API_HOST = import.meta.env.VITE_API_URL;

const sendApiRequest = async (
  method: string = "GET",
  path: string,
  body?: unknown
) => {
  try {
    const response = await fetch(`${API_HOST}/api/${path}`, {
      method: method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : null,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
  }
};

const getTransactions: () => Promise<Transaction[]> = () =>
  sendApiRequest("GET", "transactions") as Promise<Transaction[]>;
const getUsers: () => Promise<User[]> = () =>
  sendApiRequest("GET", "users") as Promise<User[]>;
const getExpenseById: (id: number) => Promise<Expense> = (id) =>
  sendApiRequest("GET", `expenses/${id}`) as Promise<Expense>;
const createTransfer: (payload: NewTransferPayload) => Promise<Transfer> = (
  payload
) => sendApiRequest("POST", "transfers", payload) as Promise<Transfer>;

export const ApiClient = {
  getUsers,
  getTransactions,
  getExpenseById,
  createTransfer,
};

export default ApiClient;
```


Move `pages/Layout.tsx` to  `pages/Layout/Component.tsx`. 

The layout will be responsible for holding the current user in its state. For now, we do not have any authentication mechanism so we can simply pick any user from a select box.

Use the following code: 

  ```tsx
  import { NavLink, Outlet, useLoaderData } from 'react-router';
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
  - Render navigation links: “All Transactions”, “New Transfer”. We use NavLink instead of `<a>` because we do not want full page refresh; otherwise we would lose the state (current user)
  - Render a `<select>` dropdown listing all users plus an option for "No User". Changing it updates `currentUser` state. It's a controlled component.
  - We provide `Outlet` for displaying the children, and provide the current user as context. This is using the similar technique of React Context seen in previous lesson but with a direct integration in react router because it is so common for a Layout component to provide a context, we even provide a direct hook for getting the currentUser with a very explicit name. See https://reactrouter.com/api/hooks/useOutletContext 


Finally, in `pages/Layout/index.ts`, we export the different values for allowing other modules to only import from `pages/Layout` without caring that we split code in multiple files.

```ts
export { default } from './Component';
export { loader } from './loader';
```

We should now be able to run our frontend again.

#### **Transactions List Page**: 

Let's create the following files :
 - `pages/Transactions/loader.ts`
 - `pages/Transactions/Component.tsx`
 - `pages/Transactions/index.ts`
  
In `pages/Transactions/loader.ts`, implement the loader for fetching the transactions, very similar to Layout. 

Use or add the required code in the api module for communicating with API and amend types definition if required.

In `pages/Transactions/Component.tsx`, implement the component to display all transactions and use the discriminated union kind for deciding which component to render.

  ```tsx
import { useLoaderData } from 'react-router';
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

Use Shadcn and Tailwind to improve the UI.

#### **Expense Detail Page**: 

Clicking the link for the detail of an expense would currently not lead anywhere, let's fix that!

Let's create the following files :
 - `pages/ExpenseDetails/loader.ts`
 - `pages/ExpenseDetails/Component.tsx`
 - `pages/ExpenseDetails/index.ts`

In `pages/ExpenseDetails/loader.ts`, we will fetch the specific expense according to the id of the route. The loader function receives the param object (as well as the default context and the request object, [see documentation](https://api.reactrouter.com/v7/interfaces/react_router.LoaderFunctionArgs#params)). You can get the id from that object.


In `pages/ExpenseDetails/Component.tsx`, write the component for displaying the detail of an Expense, including:
  - Payer’s name, email, and bank account (if available).
  - List of participants, each with name, email, bank (if any).
  - Each participant’s share of the expense (just total divided by number of participants). This helps illustrate who owes what for this expense.


In `pages/ExpenseDetails/index.ts`, export the component and the loader

#### **Transfer Form Page**: 

In `pages/NewTransfer/loader.ts`, we will fetch the list of users, same as we did in `Layout/loader.ts`. 

We could reuse the list received in Layout (and pass it via the OutletContext, as we did for the current user) but this would only bring a very small boost of performance while coupling very strongly two components who should stay decoupled. Decoupling these components is more important from a Software Architecture perspective because these two components will very likely evolve for different reasons, they are not related to the same domain.


In `pages/NewTransfer/Component.tsx`, create a form for adding a new transfer, and leverage react hook form as well as ShadCN, as we did in Lesson 2.
Upon success, **navigate()** to the transactions page.
Upon error, set an error on **root**, it will be cleared with every submission ( [documentation](https://react-hook-form.com/docs/useform/seterror) )


You will need to know who is the current user for preselecting a choice in the form. Use the hook `useOutletContext()` ([documentation](https://reactrouter.com/api/hooks/useOutletContext)).
In order to make the current user very easy to retrieve, you can make a custom hook colocated with the Layout : `pages/Layout/hooks.ts`

```ts
import type { User } from '@/types/User';
import { useOutletContext } from 'react-router';

export function useCurrentUser() {
  const { currentUser } = useOutletContext<{ currentUser: User | null }>();
  return currentUser;
}
```

then import/export it in `pages/Layout/index/ts` (remember that we only want to import the full module, not each file).
And finally you can easily add this to any component which needs it (like the form we are writing) :

```ts
import { useCurrentUser } from '../Layout';
//...
const currentUser = useCurrentUser
```

Disable the button of the form while it is submitting.
You will require the `useNavigation` hook for navigating to `/transactions` upon success. ([documentation](https://reactrouter.com/api/hooks/useNavigation#usenavigation))

> **Important**: We are deliberately NOT using the `action` feature of react router and instead choosing to go entirely with react hook form. This is a design decision  which should be discussed in a real project because each option has pros and cons. Do not try to mix the two features, avoid `action` from react router for now.



#### **Expense Form Page**

Adapt your AddExpense form from previous week and make it a page in `pages/NewExpense`. 
Add a link to it in the Navbar.
Follow the same guidelines as the form for Transfer we just did.



#### Test

- After implementing these changes, **test the frontend** thoroughly:
  - The app should start at the home or transactions page. The NavBar should show "No User" by default.
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

# The PR

We've just added categories to the expenses - this will help to see who's *always* paying for the restarants.

Available [here](https://github.com/e-vinci/web3-2025/pull/12)

---
