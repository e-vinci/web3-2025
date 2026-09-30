---
title: 'Lesson 3 – Forms and migration'
description: 'Learning how to create easy forms in React and how to migrate a database in Prisma'
publishDate: 2026-09-26T00:00:00Z
excerpt: 'Learning how to create easy forms in React and how to migrate a database in Prisma'
tags:
  - react
  - typescript
  - shadcn
  - tailwind
  - course
  - web3-2025
category: 'course-lesson'
---

# End of lesson 2

## 1. A basic form

We want to update our "ExpanseAdd" button to be able to add a real expanse using a proper form & fields.

- Create a form in ExpenseAdd with fields for payer (Bob or Alice, use a select), date, description, amount
- As a first step, create a `handleSubmit()` method to be called on submit, outputing (via the console or an alert) the form content

Check that everything is running properly.

- Replace the `console.log` to a call to the create API. Disregard validation issues for now.

---

## 2. React Hook Form

> What's wrong with using just the HTML components? Nothing... but managing a form state is not that easy - you have to tackle databinding (how does the form input gets into your object) and also validation. We'll see that react-hook-form helps a lot there.

- Install react hook form

```bash
npm install react-hook-form
```

Let's review our code using the package by:

- Calling useForm at the start:

```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm();

const onSubmit = (data) => console.log(data);
```

The onSubmit method is for us to implement (here a simple console.log, that can be later changed to call addExpense). The hook manages the first step (notably to run validation before calling our onSubmit method).

You can link your form, the hook, and you onSubmit callback by using this in the form component :

```typescript
<form onSubmit={handleSubmit(onSubmit)} ...
```

Then you can adapt each field of your form for registering a value which will be passed to your onSubmit callback.

- Using the register method for each field:

```tsx
<label>
  Amount:
  <input type="number" {...register('amount', { required: true })} placeholder="Enter amount" />
  {errors.amount && <span>Amount field is required</span>}
</label>
```

We can already see some benefits:

- We have nice error messages if some field are missing on submit
- We get a properly formatted object on submit

React Hook Form has many other features, but this already shows its power. Have a look at the documentation for understanding how it will make your forms much easier than handling all the useState manually : https://react-hook-form.com/get-started#Quickstart

Before you end your exercice, ensure your types are properly defined. The Form component should define the FormData type describing what is passed to onSubmit (all the fields from the UI). The file src/types/Core.ts should define `Identifiable` which only needs an id. The file src/types/Expense.ts should define the interface `ExpenseInput` which is what you send to the API and `Expense` which is what you get from the API.

Make sure to deploy & test everything again.

---

## 3. Use Zod for better validation

Get to the form again and use Zod to get proper validation:

- user need to be one of either "Bob" or "Alice"
- amount should be a positive float
- description is optional but cannot be bigger than 200 characters

Make sure to show proper error messages for each case.

---

## Summary of lesson 2

- Deploying to "PaSS" like render can be done pretty easily
- Prisma has the same concepts as JPA - model, migration, client
- Well designed API & function allow you to make big changes (moving from json to a database) without touching 80% if the application
- Forms states are complicated

---

# Lesson 3 : db migration

## Introduction

Now that our application has basic features and a polished interface, we will take a big step forward by introducing **multiple users** and **money transfers** to our expense-sharing app.

By the end of this lesson, our app will support multiple users who can owe or pay each other. We’ll have a unified **Transactions** list (combining expenses and direct transfers), the ability to record transfers of money. 

This will involve significant changes: updating our API endpoints, enhancing our Prisma models with relationships.

## Recommended Reading

- [Prisma – Relations (Official Docs)](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations) – Learn how to define relations (one-to-many, many-to-many) between models in the Prisma schema.
- [Prisma – Migrate Your Schema (Official Docs)](https://www.prisma.io/docs/orm/prisma-migrate) – Understand how to use Prisma Migrate to apply schema changes to your database safely (as opposed to `db push`).
- [React Router – Data Loading (Official Docs)](https://reactrouter.com/en/main/routers/picking-a-router#data-loading) – Review how to fetch data with route **loaders** and access it via `useLoaderData`.

## Exercises : Data Models and Migration

All exercises continue building on our collaborative expense-sharing app. We will start fresh with a new backend structure but will carry over and extend the functionality from lessons 1–3. Make sure you have your previous code handy for reference, but be prepared to reorganize it. The frontend will be refactored within the existing Vite React project from lesson 3.

**Goal**: Define (or update) the Prisma data models for `User`, `Expense`, and `Transfer` with proper relations, then create and apply a migration to update the database schema.

Our app now requires understanding **who** paid or transferred money to whom. We will introduce a `User` model and link it to expenses and transfers. We’ll also modify the existing `Expense` model to reference users instead of using plain strings.

#### 1 Initial migration

In the previous lesson, we had to call `npx prisma db update` on render before starting the app. This was necessary to ensure the database was indeed in the expected state described in the schema file. This is a very simple and dangerous way to keep a database "in sync" with the schema, what we actually want to do is running migration(s) we have carefully prepared for controlling how the database evolves. 

In order to run with migrations, we need a second database in development, it's called the "shadow database" and it's a temporary database which purpose is protecting the dev database from dangerous change. More info [here](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/shadow-database). If you use `npx prisma dev` for starting your database, you get that shadow database automatically. If you use a more conventional setup, you will need to add a new connection string to your `.env` file: `SHADOW_DATABASE_URL="postgres://<...>"`.

First of all, we want to have an initial migration describing the current db state. We already have a table in the database and we need a migration describing this. Having this initial migration will allow us in the future to start from an empty database and simply run all migrations to reach the current state.

> We will follow the process described in the [prisma documentation](https://www.prisma.io/docs/orm/prisma-migrate/getting-started#create-a-baseline-migration)

```bash
mkdir -p prisma/migrations/0_init
npx prisma migration plan
npx prisma migration show 0_init
```

You can look at the file `prisma/migrations/0_init/migration.sql` and see that it simply contains a `CREATE TABLE` for the table we used las week. This is what `npx prisma db update` did when we executed it with the schema from last week.

Mark this migration as resolved :

```bash
npx prisma migrate resolve --applied 0_init
```

You also need to mark this migration as already applied in production.
Change your `DATABASE_URL` in your `.env` to the value you use in production and run the above command again. 
Then restore your `.env` file with your local value.

> **Important** It is not "normal" to manipulate the production database from your local environment, and most of the time this will not even be allowed by the configuration of your database. We are doing it here because we started the project with a prototyping mindset (using `prisma db update`) and we are now in a more future proof mindset.

---

#### 2. **Define `User` Model**: 

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

---

#### 3. **Update `Expense` Model**: 

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
- `participants` is a ***many-to-many relation*** to `User`. This will implicitly create a join table between `Expense` and `User` behind the scenes. Look at the [documentation](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/many-to-many-relations#implicit-many-to-many-relations) for understanding how join tables can be ignored by the backend and mapped to collections.

---

#### 4. **Define `Transfer` Model**: 

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
- We include a `date` here as well for consistency (when the transfer happened) and a positive `amount` (you may want to enforce positivity with validation logic, but not via Prisma schema directly).

---

#### 5. **Create a Migration**: 

Now that the models are defined, we will use Prisma Migrate to apply these changes:

```bash
npx prisma migration plan
```

This should do the following, but it will fail:
- Generate a SQL migration file (under `prisma/migrations/`) reflecting the changes (new tables for User and Transfer, updated Expense table with new columns and join table for participants).
- Apply the migration to your database. If all goes well, your database now has three tables (plus an implicit join table for Expense <-> User many-to-many).
- Update the Prisma Client to be in sync with the new schema (this happens automatically on migrate; alternatively you could run `npx prisma generate`).

The command failed because there is already data in the database and it cannot enforce a default value for required column Expense.payerId.
***This is exactly why we want to have control over migrations***, we need to do something smarter for evolving the database while preserving data.

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

This will try to run all the missing migration, and this time it will succeed.

---

#### 6 **Verify the Schema in DB**: Use Prisma Studio or a database client to inspect the tables:

```bash
npx prisma studio
```

Check that you have Models for `User`, `Expense`, and `Transfer`. 
Look how you migration properly created the User records and connected them to the Expense records.

#### 7 **Run the migration on production**

Now we will need to add a new step after generating the client but before starting the app: executing the migrations. 
The command for executing migrations is `npx prisma migrate deploy`

Notice ***how it is a different command than the one we ran in development***, this is because this command :

- Does not look for drift in the database or changes in the Prisma schema
- Does not reset the database or generate artifacts
- Does not rely on a shadow database

We also need to change how we build and start the app on Render.

The command for building is : `npm install && && npx prisma generate && npm run build`. This will transpile the code and bundle it in "dist/" directory.
The command for starting is : `npx prisma migrate deploy && npm run start:prod `. 


#### **Seeding Initial Data**: 

Usually we want to have some initial data when working in development, this is the purpose of the script `db-populate.js`. We may also need initial data for our app to work correctly, like a list of countries, or a list of currencies, this is called "seed" data. 

Prisma has a tool for inserting seed data any time you reset your database, and you can read more about it [here](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding). For our project, we will simply keep and adapt our `db-populate.js` script, it's a simpler alternative, even if less powerful. Making this kind of choice - choosing to stop at what is good enough and will be easy to improve later - is a very important skill for software engineers, because we always work under time constraints. 

Adapt your script `db-populate.js` for creating a few users, expenses, and transactions.


#### **Delete your backup backend directory**

We won't need it anymore and it will make it harder for you to navigate your files.