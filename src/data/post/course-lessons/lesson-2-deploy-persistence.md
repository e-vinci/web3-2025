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

---
## Warning

> Do NOT (please do NOT) commit your `.env` file to git.

What should we do:

- Add `.env` to your `.gitignore` file.
- Create a `.env.example` file with placeholder values for the environment variables and give some documentation on what each variable is for.
- Commit the `.env.example` file to git.

We shall also do:

- Create different `.env` files for each environment (development, staging, production) and add them to the `.gitignore` file.
  - `.env.development`: fits your local development environment (db in docker, front and back on the same machine),
  - `.env.production`: fits your production environment (SaaS, your entreprise installation).

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

Follow the instructions to select the database type (PostgreSQL), set the Prisma as the language of the schema file, the schema file will be in `/src/prisma`, allow the re-installing `prisma.config` and finally allow the creation of the `.env` files.

The three install commands above do the following:
- `npm install --save-dev prisma` — installs the Prisma v8 CLI
- `npm install @prisma/orm-postgres` — installs the PostgreSQL runtime adapter
- `npx prisma orm init --write-env` — sets up the project structure and creates:
  - `prisma.config.ts` — the configuration file
  - `src/prisma/contract.prisma` — the **contract** file where you define your models (replaces `schema.prisma`; same concept, renamed)
  - `src/prisma/db.ts` — the typed database client you will import in your application code
  - `.env` — with a `DATABASE_URL` placeholder

In Prisma, the schema file is called a **contract** (`contract.prisma`). The name change reflects that it is a formal, verifiable contract between your code and your database.

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
  date        TimestamptzString @default(now())
  description String
  payer       String
  amount      Float
}
```

Note the `// use prisma-8` comment at the top — this is required for the Prisma editor extension to recognize the file.

We can declare our "models" in that file and have Prisma create the tables accordingly. On a fresh (empty) database, run:

```bash
npx prisma db init
```

This creates the tables for your contract. After that, whenever you modify the contract, use `npx prisma db update` to apply the changes to the existing database.

We should normally work from the contract file as the source of truth. There is a better way to handle changes (migrations) — but let's keep it simple for now.

Connect to the db and check the Expense table.

> Tips: In Prisma v8, use a database client tool (such as the [VS Code postgres extension](https://marketplace.visualstudio.com/items?itemName=ms-ossdata.vscode-pgsql)) to browse your data and validate your setup.

### 4. Data and queries

Aside from synchronizing with the database, the contract is also used by Prisma to generate typed client files. Run the following after every change to the contract:

```bash
npx prisma contract emit
npx prisma db update
```

This writes two files next to your contract (in `src/prisma/`):
- `contract.json` — the contract as a machine-readable JSON document
- `contract.d.ts` — TypeScript types for all your models

These files **must be committed to version control** — they are not environment-specific. The `src/prisma/db.ts` file (created by `orm init`) imports them and exposes the `db` object you use in your code:

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
import { db } from './src/prisma/db.ts';

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

In Prisma, `db.orm.public.Expense` is how you access the `Expense` model — `public` is the PostgreSQL schema (namespace) where the table lives.

Run the script and check the result: 

```bash
node db-read.ts
```

What's the output? Why?

- create a separate script called "db-populate.ts" to populate our database with the same data we had in the json. This can be done with the [create](https://www.prisma.io/docs/orm/fundamentals/writing-data#create) method (or the similar `createAll` for multiple records). Run it with `node db-populate.ts`.
- run and test that the records are properly created (how?)

> From the trenches: Reading things and showing them is usually much easier than creating them (no forms, validation, etc). So it generally make sense to start an application with screens that show list of objects. As we saw here, we can easily create what we need using some basic scripting - which allow us to go very quickly to actual results on the screen, as we'll see in the next section.

### 5. Integrate this with our webapp

We have all the pieces to show actual data on the screens:

- We already have the React part
- The API is already defined (routes)
- We just need to update the service to get the data from the database using prisma instead of reading the json file

So let's go:

- In your expenses service, replace the `getAllExpenses()`'s content by a call to `db.orm.public.Expense.all()` (if you implemented sorting last week you may have to update it — check the [orderBy](https://www.prisma.io/docs/orm/fundamentals/reading-data#sorting) equivalent)
- Replace the `addExpense()` by a call to `db.orm.public.Expense.create({...})`
- Check that the whole cycle is working as expected (from the screen to the database and back)

> Warning: most of Prisma's methods are asynchronous — make sure you return actual results, or await for them.

Looks like a good time to push and deploy.
Check that everything works fine on render.

You may encounter these two issues :

- if you have a cors error, remember to allow your backend to serve request from your frontend in `app.ts`.

- The `contract.json` and `contract.d.ts` files should be committed to your repository so you don't have to emit again in production. This is what your build script should look like  in your `package.json`:

```json
"scripts": {
  "build": "npm install &&  npx prisma db update",
}
```

Update your build command on render to `npm run build`.

Update your start command to apply any DB schema changes: `npx prisma db update && npm start`.

> The files `contract.json` and `contract.d.ts` are **not** environment-specific and should be committed to git. The `db.ts` file is also committed. However, running `prisma contract emit` in the build step ensures the contract files are always in sync with the current contract.

`npx prisma db update` is great for prototyping a database but can be risky in production. In future lessons we will use migrations for controlling exactly how to evolve the database when adding new features. If you're already interested in going from prototyping to migration, you can read about it [here](https://www.prisma.io/docs/orm/migrations/generating-a-migration).

