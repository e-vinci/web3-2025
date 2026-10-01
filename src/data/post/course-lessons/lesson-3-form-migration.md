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

We want to update our "ExpenseAdd" button to be able to add a real expense using a proper form & fields.

- Create a form in ExpenseAdd with fields for payer (Bob or Alice, use a select), date, description, amount
- As a first step, create a `handleSubmit()` method to be called on submit, outputing (via the console or an alert) the form content

Check that everything is running properly.

- Replace the `console.log` to a call to the create API. Disregard validation issues for now.

---

## 2. React Hook Form

> What's wrong with using just the HTML components? Nothing... but managing a form state is not that easy - you have to tackle databinding (how does the form input gets into your object) and also validation. We'll see that react-hook-form helps a lot there.

- Install react hook form (on the frontend)

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

Before you end your exercice, ensure your types are properly defined. The file src/types/Expense.ts should define the interface `NewExpense` which is what you send to the API and `Expense` which is what you get from the API.

Make sure to deploy & test everything again.

---

## 3. Use Zod for better validation

Get to the form again and use Zod to get proper validation. You will need to install zod and @hookform/resolvers for this. More info in the [documentation](https://react-hook-form.com/docs/useform#resolver)

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

- [Prisma 8 – Relations (Official Docs)](https://www.prisma.io/docs/orm/data-modeling/relations) – Learn how to define relations (one-to-many, many-to-many) between models in Prisma 8.
- [Prisma 8 – How Migrations Work (Official Docs)](https://www.prisma.io/docs/orm/migrations/how-migrations-work) – Understand how Prisma 8 migrations work: contracts, plans, and applying changes safely (offline, no shadow database).
- [React Router – Data Loading (Official Docs)](https://reactrouter.com/en/main/routers/picking-a-router#data-loading) – Review how to fetch data with route **loaders** and access it via `useLoaderData`.

## Exercises : Data Models and Migration

**Goal**: Define (or update) the Prisma data models for `User`, `Expense`, and `Transfer` with proper relations, then create and apply a migration to update the database schema.

Our app now requires understanding **who** paid or transferred money to whom. We will introduce a `User` model and link it to expenses and transfers. We’ll also modify the existing `Expense` model to reference users instead of using plain strings.

#### 1 Initial migration

In the previous lesson, we had to call `npx prisma db update` on render before starting the app. This was necessary to ensure the database was in the expected state described in the contract. This is a quick prototyping command, but it is not safe for production — it can silently drop and recreate columns. What we actually want is to run carefully prepared **migrations** that give us full control over how the database evolves.

One important advantage of Prisma 8's migration system is that **planning a migration is offline**: `npx prisma migration plan` reads only your local files and never connects to a database. 

First, make sure your contract is emitted:

```bash
npx prisma contract emit
```

This generates `contract.json` and `contract.d.ts` next to your contract file.

We already have a table in the database and our contract already describes it. Prisma lets us **sign** the database: record that it already matches the current contract.

```bash
npx prisma db sign
```

This writes a marker in the database recording which contract state it matches. Future `migration plan` runs will compute changes relative to this signed state.

You also need to sign the production database. Change `DATABASE_URL` in your `.env` to the production value, run the command again, then restore the local value.

You might have to add `?ssl=true` at the end of your connection string if prisma complains about SSL being mandatory. It should be the default but some setup needs to mention it explicitely.

> **Important** It is not "normal" to manipulate the production database from your local environment, and most of the time this will not even be allowed by the configuration of your database. We are doing it here because we started the project with a prototyping mindset (using `prisma db update`) and we are now in a more future-proof mindset.

---

#### 2. **Define `User` Model**: 

Open `src/prisma/contract.prisma`. The contract file **must start with `// use prisma-8`**. Define a new model for users:

```prisma
model User {
  id          Int     @id @default(autoincrement())
  name        String
  email       String  @unique
  bankAccount String? // optional

  transfersOut         Transfer[]    @relation("UserTransfersSource")
  transfersIn          Transfer[]    @relation("UserTransfersTarget")
  participatedExpenses Expense[] @relation("ParticipantExpenses")
  paidExpenses Expense[]  @relation("PayerExpenses")
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
  participants User[]
}
```

Changes made:
- `payer` is now a **relation** to the User model (with a foreign key `payerId`). This replaces the old `payer` string field.
- `participants` is a **many-to-many relation** to `User`. In Prisma 8, implicit join tables are not supported — you must write the join table as an explicit model. 

---

#### 3b. **Define `ExpenseUser` Join Table**:

In Prisma 8, many-to-many relations require an explicit join-table model. Add it directly after the `Expense` model:

```prisma
model ExpenseUser {
  expenseId Int
  userId    Int
  expense   Expense @relation("ParticipantExpenses", fields: [expenseId], references: [id], onDelete: Cascade)
  user      User    @relation("ParticipantExpenses", fields: [userId], references: [id], onDelete: Cascade)

  @@id([expenseId, userId])
}
```

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

Now that the models are defined, we will use Prisma Migrate to apply these changes. First emit the updated contract so Prisma knows what changed:

```bash
npx prisma contract emit
```

Then plan the migration:

```bash
npx prisma migration plan --name add_users_and_transfers
```

This creates the directory `migrations/app/<timestamp>_add_users_and_transfers/` with a `migration.ts` file. **This command is offline** — it reads only your local files and never connects to the database. It also does not apply anything: applying is a separate step.

The planned migration would fail to apply as-is, because it would try to add a required `payerId` column to `Expense` rows that already exist, with no default value.
***This is exactly why we want to have control over migrations*** — we need to sequence the changes carefully to preserve existing data.

Read the documentation on [editing migrations in Prisma 8](https://www.prisma.io/docs/orm/migrations/editing-a-migration).

You can observe that the actual changes are described in the file `migrations/app/<timestamp>_add_users_and_transfers/migration.ts`. A list of SQL commands are defined in this autogernerated file.

As we have seen in the theory, the proper way to handle this is to write a SQL migration. But going down this rabbit hole would force us to spend a lot of time outside the scope of what we want to teach you. Therefore we will simply clear the database of any data. 
Obviously, this is NOT how it works in real life and if you use Prisma in your internship or your job, you must learn to write raw SQL migrations.

So you can replace the whole dataTransform block with:

````
this.dataTransform(contract, 'wipe-expense-before-payer-migration', {
  run: () => db.public.expense.delete(),
}),
```

If you have an error about endContract not matching the proper type. You can use this at the beginning of your migration file:

```
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  primaryKey,
} from '@prisma/orm-postgres/migration';

const { sql: db, contract } = postgres<End>({ contractJson: endContract });

```


<!-- Open `migrations/app/<timestamp>_add_users_and_transfers/migration.ts` and edit the `operations()` method. In Prisma 8, migrations are **TypeScript**, not SQL — you describe operations as method calls, and Prisma compiles them to SQL stored in `ops.json`. After editing, recompile the migration from your project root:

```bash
node migrations/app/<timestamp>_add_users_and_transfers/migration.ts
``` -->

<!-- Since the point of this course is not the migration API, here is a working `operations()` method. Read it and observe how we generate data, how we make a column temporarily nullable then non-nullable, and how we use `rawSql` for data operations that span multiple tables:

```typescript
// operations() inside migrations/app/<timestamp>_add_users_and_transfers/migration.ts
// (the full file boilerplate — imports, class wrapper, MigrationCLI.run — is generated by `migration plan`)
// update the imports for accessing rawSql() function
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  primaryKey,
  rawSql,
} from '@prisma/orm-postgres/migration';

override get operations() {
  return [
    // --- Structural changes (auto-generated by migration plan) ---

    // Create User, Transfer, and _ParticipantExpenses tables
    this.createTable({ schema: 'public', table: 'User', /* ... */ }),
    this.createTable({ schema: 'public', table: 'Transfer', /* ... */ }),
    this.createTable({ schema: 'public', table: '_ParticipantExpenses', /* ... */ }),

    // --- Custom: data migration steps (hand-written) ---

    // 1. Insert User records derived from the existing Expense.payer strings
    rawSql({
      id: 'data.insert-users-from-payer',
      label: 'Insert User records from existing Expense.payer data',
      operationClass: 'data',
      target: { id: 'postgres' },
      execute: [
        {
          description: 'Insert users from payer strings',
          sql: `
            INSERT INTO "User" ("name", "email")
            SELECT DISTINCT
              "payer" AS "name",
              LOWER(REGEXP_REPLACE("payer", '[^a-zA-Z0-9]', '.', 'g')) || '@expenso.dev' AS "email"
            FROM "Expense"
            WHERE "payer" IS NOT NULL
          `,
        },
      ],
    }),

    // 2. Add payerId as nullable first (existing rows can't satisfy NOT NULL yet)
    this.addColumn({
      schema: 'public',
      table: 'Expense',
      column: col('payerId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
    }),

    // 3. Backfill payerId by matching the payer string to the User email we just inserted
    rawSql({
      id: 'data.backfill-expense-payerId',
      label: 'Set payerId on Expense rows from matching User email',
      operationClass: 'data',
      target: { id: 'postgres' },
      execute: [
        {
          description: 'Update payerId',
          sql: `
            UPDATE "Expense"
            SET "payerId" = "User"."id"
            FROM "User"
            WHERE "User"."email" =
              LOWER(REGEXP_REPLACE("Expense"."payer", '[^a-zA-Z0-9]', '.', 'g')) || '@expenso.dev'
          `,
        },
      ],
      postcheck: [
        {
          description: 'All expenses have a payerId',
          sql: `SELECT NOT EXISTS (SELECT 1 FROM "Expense" WHERE "payerId" IS NULL) AS ok`,
        },
      ],
    }),

    // 4. Now make payerId NOT NULL (safe: every row has a value)
    this.setNotNull({ schema: 'public', table: 'Expense', column: 'payerId' }),

    // 5. Drop the old plain-text payer column
    this.dropColumn({ schema: 'public', table: 'Expense', column: 'payer' }),

    // --- Foreign-key and indexes constraints (auto-generated by migration plan) ---
    // addUnique / createIndex / addForeignKey 
  ];
}
```
-->

After editing, recompile from the project root and review the generated `ops.json`:

```bash
node migrations/app/<timestamp>_add_users_and_transfers/migration.ts
``` 

Now apply the migration:

```bash
npx prisma db migrate --advance-ref db
```

`--advance-ref db` moves the local `db` ref to the state you just applied, so the next `migration plan` starts from the right point.

This will apply all pending migrations, and this time it will succeed.

---

#### 7 **Run the migration on production**

Now we will need to add a new step before starting the app: executing the migrations.
The command for executing migrations is `npx prisma db migrate`

Notice ***how it is a different command than the one we ran in development***, this is because in production you omit `--advance-ref db` (there is no local dev ref to advance). This is because `--advance-ref` only create a small file locally that helps you plan the next migration without connecting to the db. You only plan migrations on dev, therefore you only advance ref on dev.

We also need to change how we start the app on Render.

The command for starting is: `npx prisma db migrate && npm run start`

---

### 8 Update your code

Your Expense creation and getter in your `src/app/modules/expense/expense.service.ts` file need to be updated to reflect the new schema.

> Read the [documentation](https://www.prisma.io/docs/orm/fundamentals/writing-data) and more particularly the section about [creating a record and its related records](https://www.prisma.io/docs/orm/fundamentals/writing-data#create-a-record-and-its-related-records)

---

#### **Seeding Initial Data**: 

Usually we want to have some initial data when working in development, this is the purpose of the script `db-populate.ts`. We may also need initial data for our app to work correctly, like a list of users, exepenses, etc..

In Prisma there is no built-in seed command. You simply write and run your script directly with Node.js or tsx. For our project, we will simply keep and adapt our `db-populate.ts` script. Making this kind of choice — choosing to stop at what is good enough and will be easy to improve later — is a very important skill for software engineers, because we always work under time constraints. 

Adapt your script `db-populate.ts` for creating a few users, expenses, and transactions.

> This is when you actually contact your new db for the first time ... errors may occur, fix them as you go.

---

<!--
Deploy prod migration ?
-->
