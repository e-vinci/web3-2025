---
title: 'Lesson 2 – Deploy and persistence'
description: 'Deploying and improving our collaborative expense-sharing application by switching to an actual database.'
publishDate: 2026-09-26T00:00:00Z
excerpt: 'Refresh React and Express knowledge while building the foundation for a collaborative expense-sharing app with TypeScript, Vite, and modular backend architecture.'
tags:
  - react
  - express
  - javascript
  - typescript
  - prisma
  - sql
  - deploy
  - render
  - vite
  - nodejs
  - course
  - web3-2025
category: 'course-lesson'
# image: https://picsum.photos/id/48/200/200
---

## Course material

- [Presentation Slides](https://raw.githubusercontent.com/e-vinci/web3-2025/refs/heads/main/src/slides/lesson-2-theory.pptx)

## Introduction

Last week we started a new full stack app, brushing off last year course of React & Express. This week, we're going to deploy what we've done to the Internet for everyone to use, and try to get out of json file as a storage mecanism.

## Setup

- Create an account on [Render](https://render.com/) - you'll need it. You can use your vinci email, we'll use the free tier there and it does not require a credit card.
- Get [last week's solution](https://github.com/e-vinci/web3-2025/tree/main/exercises/lesson-1-refresh) as a starting point for this exercise. You can also work from your own code (assuming you got it working), but you may need to adapt a bit the instructions.

## Recommended Reading

- [Prisma ORM (Official Docs)](https://www.prisma.io/docs/orm/overview/introduction/what-is-prisma)
- [React Hook Forms](https://react-hook-form.com/)
- [Zod Intro](https://zod.dev/)
- [Rules of React](https://react.dev/reference/rules)

## Exercises

All exercises relate to the new collaborative expense-sharing app we started last week.

### 1. Prepare for deployment

> I don't care if it works on your machine. We are not shipping your machine.

**Goal**: Get your work (backend & frontend) ready to deploy

- Create a .env in the frontend folder with an new variable VITE_API_URL=http://localhost:3000
- Use this variable for the host of the api call in the Home.tsx file (or in the component file which does the call to the API if it's different.)

```typescript
const host = import.meta.env.VITE_API_URL || 'http://unknown-api-url.com';
```

(using VITE\_ as a prefix is needed for the variable to be recognized)

- Add Render as an acceptable origin for requests sent to your backend, add this to your cors configuration in  `backend/app.js` : 
  
```js
app.use(
  cors({
    origin: ['http://localhost:5173', /\.onrender\.com$/],
  })
);
```

- Make sure your application is still working. Then commit and push to your github repo, we will only deploy code available there.

<!-- Should we say something about NOT adding the .env file to git? -->

### 2. Render projects setup

**Goal**: Deploy our front end & backend and validate that our solution is working.

**Backend**

- Go to render.com and create a new app based on "web service"
- Point it toward your exercise repo
- name it "expenso-backend"
- Specify the correct branch
- Specify the root directory (backend)
- As a buid command we want `npm install` and as run command `npm run start`

Confirm, once done check the url under `api/expenses` - the API should be working. Note the url, we'll need it in a minute.

**Frontend**

- Go to render.com and create a new app based on "static"
- Point it toward your exercise repo
- name it "expenso-frontend"
- Specify the correct branch
- Specify the root directory (frontend)
- As a build command we want `npm install && npm run build` and as publish directoy `dist` (you can figure that out by running the commands locally)

Once built, the frontend is "just" standard html & js - so it is indeed a "static website".

Confirm, get it deployed and test. It may work already if your local server is still runnning - check the web console network tab to see where the API is called.

Go under the Environment tab on render, add a variable `VITE_API_URL` and put the url of your backend (something like `https://my-project-name.onrender.com`). Confirm, this should trigger a new deployment. Checks that the url is correctly going toward the correct backend URL now.

**Congrats**: You got yourself a working production application. From now on we'll redeploy with each new push (render will do that itself) - so remember to test your application in production, not only locally.

### 3. Install Prisma

**Goal**: Replace our JSON files with a proper database managed using the Prisma ORM. We'll also add a Postgresql database to our infrastructure
<!-- still usefull ?? -->

<!-- Remember this thing about having to restart the server with each change? Let's fix it before going further

- install nodemon with `npm i -g nodemon`  , `-g` means "global" ie that this will be installed at your user level, not in the project's `node_modules` folder
- start your server with `nodemon` instead of `node`. Add a `dev` script in `package.json`. We do not want to change the start script because it is used in production where nodemon is not installed. 

```json
  "scripts": {
    "dev": "nodemon npm start",
    "start": "node ./bin/www"
  },
```

**Note: Nodemon have nothing to do with Express - it will work the same on any other commands, in javascript or other languages**

> From the trenches: This is called "DX" - improving the Developer eXperience (versus UX for example) - it make a lot of sense to progressively improve our processes and tools to make our work easier or faster. They should end-up helping the end user too (thanks to faster or better features). -->

- Install Prisma and run the setup (be careful to run this in the `backend` folder) :

```bash
npm install --save-dev prisma
npm install @prisma/orm-postgres
```

<!--
  What it did (prisma v8) :
  - npm install @prisma/orm-postgres — selects PostgreSQL as the database adapter
  - npx prisma orm init --write-env creates:
    - prisma.config.ts — config file replacing generator/datasource blocks
    - src/prisma/contract.prisma — contract file (renamed from schema.prisma)
    - src/prisma/db.ts — the typed database client
    - .env with a DATABASE_URL placeholder
  - package.json -> script : `"postinstall": "prisma skills sync || exit 0"` for AI agent skills
-->

We are going to init the ORM (Object-Relational Mapping) with Prisma. This will allow us to interact with our database in a type-safe way.
Use the following command to initialize Prisma ORM:

```bash
npx prisma orm init --write-env
```

The three install commands above do the following:
- `npm install --save-dev prisma` — installs the Prisma v8 CLI
- `npm install @prisma/orm-postgres` — installs the PostgreSQL runtime adapter (in Prisma v8, the database is selected by installing the right adapter package)
- `npx prisma orm init --write-env` — sets up the project structure and creates:
  - `prisma.config.ts` — the configuration file (replaces the old `datasource db { ... }` and `generator client { ... }` blocks from Prisma v7)
  - `src/prisma/contract.prisma` — the **contract** file where you define your models (replaces `schema.prisma`; same concept, renamed)
  - `src/prisma/db.ts` — the typed database client you will import in your application code
  - `.env` — with a `DATABASE_URL` placeholder

In Prisma v8, the schema file is called a **contract** (`contract.prisma`). The name change reflects that it is a formal, verifiable contract between your code and your database.

The `prisma.config.ts` now holds the database connection — the connection string is no longer inside the contract file:

```typescript
import "dotenv/config";
import { definePrismaConfig } from "prisma/config";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    db: {
      connection: process.env.DATABASE_URL!,
    },
  }),
});
```

#### 3.1 local db

We're going to run a **local** PostgreSQL database using Docker. This is the recommended approach — it gives you a proper, production-equivalent database without installing PostgreSQL globally on your machine.

Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

Create a `docker-compose.yml` file in your `backend` folder:

```yaml
services:
  postgres:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_USER: myUSER
      POSTGRES_PASSWORD: myPASSWORD
      POSTGRES_DB: expenso
    ports:
      - "5432:5432"
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
```

The `./data/postgres` bind mount stores database files directly in your project folder. Make sure to add it to your `.gitignore` so it is never committed:

```
data/
```

Update the `DATABASE_URL` in your `backend/.env` to point to this local Docker database:

```
DATABASE_URL="postgresql://myUSER:myPASSWORD@localhost:5432/expenso"
```

Start the database in the same directory as the `docker-compose.yml` file:

```bash
docker compose up -d
```

Verify it is running:

```bash
docker compose ps
```

> From the trenches: Docker containers are great for local development because they isolate the database from your system, they're easy to start and stop, and they closely match production environments. Every developer on the team runs the exact same database version with the same configuration — no more "it works on my machine". You can stop the database at any time with `docker compose down` and restart it later; your data is persisted in the `postgres_data` named volume. To reset everything to a clean state, use `docker compose down -v`.

> **Note:** `docker-compose.yml` is for local development only — Render does not use it. In production, Render provides its own managed PostgreSQL service.

- Confirm you can connect to both the local Docker DB using any DB tool (if you don't have any, install the [vscode postgres extension](https://marketplace.visualstudio.com/items?itemName=ms-ossdata.vscode-pgsql)).

#### 3.2 render db

- Create a new free postgres database on Render and get the external url once done.

- Add a `DATABASE_URL` environment variable in your **backend** service in render. Now you will use your local Docker database when developing locally, and the production Render database in production.

- Notice how the frontend environment knows the API URL and the backend knows the Database URL. The frontend DOES NOT know the Database URL.


> From the trenches: We always want to know that the connection is working properly before doing any work. This means that if we get an error message while connecting to the DB via the app it's related to the app — as we know the DB itself is working. Generally: try to solve problems part by part to avoid situations where an error can have multiple causes.

- validate your render database connection with the same tool you used for the local database (e.g. vscode postgres extension or something similar).


### 3. A first model

Prisma (like JPA) allow you to manage your whole data structure from your code. We're going to create a table to store our Expenses. This is done in the `src/prisma/contract.prisma` file:

```prisma
// use prisma-8

model Expense {
  id          Int      @id @default(autoincrement())
  date        DateTime @default(now())
  description String
  payer       String
  amount      Float
}
```

Note the `// use prisma-8` comment at the top — this is required for the Prisma editor extension to recognize the file. The basic model field types (`Int`, `Float`, `String`, `DateTime`) are unchanged from Prisma v7.

We can declare our "models" in that file and have Prisma create the tables accordingly. On a fresh (empty) database, run:

```bash
npx prisma db init
```

This creates the tables for your contract. After that, whenever you modify the contract, use `npx prisma db update` to apply the changes to the existing database.

In Prisma v8, the equivalent commands are:
- `prisma contract infer` — reads an existing database and writes a draft contract (replaces v7's `db pull`)
- `prisma db init` — creates tables in an **empty** database from the contract (first time only)
- `prisma db update` — applies contract changes to an **existing** database (replaces v7's `db push`)

We should normally work from the contract file as the source of truth. There is a better way to handle changes (migrations) — but let's keep it simple for now.

Connect to the db and check the Expense table.

> Tips: In Prisma v8, `npx prisma studio` is not available from the CLI. Use a database client tool instead (such as the [VS Code postgres extension](https://marketplace.visualstudio.com/items?itemName=ms-ossdata.vscode-pgsql)) to browse your data and validate your setup.

### 4. Data and queries

Aside from synchronizing with the database, the contract is also used by Prisma to generate typed client files. Run the following after every change to the contract:

```bash
npx prisma contract emit
```

This writes two files next to your contract (in `src/prisma/`):
- `contract.json` — the contract as a machine-readable JSON document
- `contract.d.ts` — TypeScript types for all your models

Unlike Prisma v7, these files **should be committed to version control** — they are not environment-specific. The `src/prisma/db.ts` file (created by `orm init`) imports them and exposes the `db` object you use in your code:

```typescript
import "dotenv/config";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

export const db = postgres<Contract>({
  contractJson,
  url: process.env.DATABASE_URL!,
});
```

We're going to test it using a simple `db-read.ts` file to ensure our database client has been properly set up.

```typescript
import { db } from './src/prisma/db';

async function main() {
  const expenses = await db.orm.public.Expense.all();
  console.log(expenses);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
```

The important piece is the main function and especially:

```typescript
const expenses = await db.orm.public.Expense.all();
```

In Prisma v8, `db.orm.public.Expense` is how you access the `Expense` model — `public` is the PostgreSQL schema (namespace) where the table lives. `.all()` replaces v7's `findMany()`.

Run the script and check the result (you need `tsx` to run TypeScript files directly — install it once with `npm install --save-dev tsx`):

```bash
npx tsx db-read.ts
```

What's the output? Why?

- create a separate script called "db-populate.ts" to populate our database with the same data we had in the json. This can be done with the [create](https://www.prisma.io/docs/orm/fundamentals/writing-data#create) method (or the similar `createAll` for multiple records). Run it with `npx tsx db-populate.ts`.
- run and test that the records are properly created (how?)

> From the trenches: Reading things and showing them is usually much easier than creating them (no forms, validation, etc). So it generally make sense to start an application with screens that show list of objects. As we saw here, we can easily create what we need using some basic scripting - which allow us to go very quickly to actual results on the screen, as we'll see in the next section.

### 5. Integrate this with our webapp

We have all the pieces to show actual data on the screens:

- We already have the React part
- The API is already defined (routes)
- We just need to update the service to get the data from the database using prisma instead of reading the json file

So let's go:

- Replace the `getAllExpenses()`'s content by a call to `db.orm.public.Expense.all()` (if you implemented sorting last week you may have to update it — check the [orderBy](https://www.prisma.io/docs/orm/fundamentals/reading-data#sorting) equivalent)
- Replace the `addExpense()` by a call to `db.orm.public.Expense.create({...})` (note: in Prisma v8 there is no `data` wrapper — pass the fields directly)
- Check that the whole cycle is working as expected (from the screen to the database and back)

> Warning: most of Prisma's methods are asynchronous — make sure you return actual results, or await for them.

Looks like a good time to push and deploy.
Check that everything works fine on render.

You may encounter these two issues :

- if you have a cors error, remember to allow your backend to serve request from your frontend in `app.js`.

- The `contract.json` and `contract.d.ts` files should be committed to your repository (unlike Prisma v7's generated folder). However, you still need to run `prisma contract emit` as part of the build to ensure they are up to date. Add a `build` script in your `package.json`:

```json
"scripts": {
  "build": "npm install && npx prisma contract emit",
  "dev": "nodemon npm start",
  "start": "node ./bin/www"
}
```

Update your build command on render to `npm run build`.
Update your start command to apply any DB schema changes: `npx prisma db update && npm start`. We should use a pre-start command for this (and rollback the deploy if it fails) but this feature is only available on paid plans.

> In Prisma v8, `contract.json` and `contract.d.ts` are **not** environment-specific and should be committed to git. The `db.ts` file is also committed. However, running `prisma contract emit` in the build step ensures the contract files are always in sync with the current contract.

`npx prisma db update` is great for prototyping a database but can be risky in production. In future lessons we will use migrations for controlling exactly how to evolve the database when adding new features. If you're already interested in going from prototyping to migration, you can read about it [here](https://www.prisma.io/docs/orm/migrations/generating-a-migration).

### 6. A basic form

We want to update our "ExpanseAdd" button to be able to add a real expanse using a proper form & fields.

- Create a form in ExpenseAdd with fields for payer (Bob or Alice, use a select), date, description, amount
- As a first step, create a `handleSubmit()` method to be called on submit, outputing (via the console or an alert) the form content

Check that everything is running properly.

- Replace the `console.log` to a call to the create API. Disregard validation issues for now.

### 7. React Hook Form

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

## Optional Challenges

### A. Use Zod for better validation

Get to the form again and use Zod to get proper validation:

- user need to be one of either "Bob" or "Alice"
- amount should be a positive float
- description is optional but cannot be bigger than 200 characters

Make sure to show proper error messages for each case.

---

## Summary

- Deploying to "PaSS" like render can be done pretty easily
- Prisma has the same concepts as JPA - model, migration, client
- Well designed API & function allow you to make big changes (moving from json to a database) without touching 80% if the application
- Forms states are complicated

---

## The PR

https://github.com/e-vinci/web3-2025/pull/6
