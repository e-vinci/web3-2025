---
title: 'Lesson 2 – Deploy and persistence'
description: 'Deploying and improving our collaborative expense-sharing application by switching to an actual database.'
publishDate: 2025-01-15T00:00:00Z
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
---

## Introduction

Last week we started a new full stack app, brushing off last year course of React & Express. This week, we're going to deploy what we've done to the Internet for everyone to use, and try to get out of json file as a storage mecanism.

## Setup

- Create an account on [Render](https://render.com/) - you'll need it. You can use your vinci email, we'll use the free tier there and it does not require a credit card.
- Get [last week's solution](https://github.com/e-vinci/web3-2025/tree/main/exercises/lesson-1-refresh) as a starting point for this exercise. You can also work from your own code (assuming you got it working), but you may need to adapt a bit the instructions.

## Recommended Reading

- [Prisma ORM (Official Docs)](https://www.prisma.io/docs/orm/overview/introduction/what-is-prisma)
- [React Hook Forms](https://react-hook-form.com/)
- [Zod Intro](https://zod.dev/)

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

- Make sure your application is still working. Then commit and push to your github repo, we will only deploy code available there.

### 2. Render projects setup

**Goal**: Deploy our front end & backend and validate that our solution is working.

**Backend**

- Go to render.com and create a new app based on "web service"
- Point it toward your exercise repo
- Specify the correct branch
- Specify the root directory (backend)
- As a buid command we want `npm install` and as run command `npm run start`

Confirm, once done check the url under `api/expense` - the API should be working. Note the url, we'll need it in a minute.

**Frontend**

- Go to render.com and create a new app based on "static"
- Point it toward your exercise repo
- As a buid command we want `npm run build` and as publish directoy `dist` (you can figure that out by running the commands locally)

Once built, the frontend is "just" standard html & js - so it is indeed a "static website".

Confirm, get it deployed and test. It may work already if your local server is still runnning - check the web console network tab to see where the API is called.

Go under the Environment tab on render, add a variable `VITE_API_URL` and put the url of your backend (something like `https://my-project-name.onrender.com`). Confirm, this should trigger a new deployment. Checks that the url is correctly going toward the correct backend URL now.

**Congrats**: You got yourself a working production application. From now on we'll redeploy with each new push (render will do that itself) - so remember to test your application in production, not only locally.

### 2. Install Prisma

**Goal**: Replace our JSON files with a proper database managed using the Prisma ORM. We'll also add a Postgresql database to our infrastructure

Remember this thing about having to restart the server with each change? Let' fix it before going further

- install nodemon with `npm i -g nodemon` - -g means "global" ie that this will be installed at your user level, not in the project's `node_modules` folder
- start your server with `nodemon --exec "npm run start` - nodemon will watch the folder and relaunch the command with each modification

**Note: Nodemon have nothing to do with Express - it will work the same on any other commands, in javascript or other languages**

> From the trenches: This is called "DX" - improving the Developer eXperience (versus UX for example) - it make a lot of sense to progressively improve our processes and tools to make our work easier or faster. They should end-up helping the end user too (thanks to faster or better features).

- Create a new free postgres database on render and get the external url once done
- Try to connect to it using any DB tool (if you don't have any, install the [vscode postgres extension](https://marketplace.visualstudio.com/items?itemName=ms-ossdata.vscode-pgsql))

> From the trenches: We always want the know that the connection is working properly before doing any work. This means that if we get an error message while connecting to the DB via the app it's related to the app - as we know the DB is working. Generally: try to solve problems part by part to avoid situation where an error can have multiple causes.

- You can also create a local Postgresql if you want (or work directly with the 'production' one on render).
- Then install Prisma and run the setup:

```bash
npm install prisma --save-dev
npx prisma init
```

(be careful to run this in the `backend` folder)

- Replace the DATABASE_URL in the .env file generated by the previous command with the one from render (or your local one). Notice how the frontend environments knows the API URL and the backend knows the Database URL. The frontend DOES NOT know the Database URL.
- To test the connection, run `npx prisma db pull`

This will check the content of the DB - it should tell you it's empty, which is ok.

### 3. A first model

Prisma (like JPA) allow you to manage your whole data structure from your code. We're going to create a table to store our Expenses. This is done in the `schema.prisma` file:

```prisma
model Expense {
  id          Int      @id @default(autoincrement())
  date        DateTime @default(now())
  description String
  payer       String
  amount      Float
}
```

We can declare our "models" in that file and have prisma create the tables accordingly:

```bash
npm prisma db push
```

This is the opposite of the pull command:

- `pull` updates the model file (`schema.prisma`) from the database content
- `push` updates the database from the model

We should normally mostly "push" (ie: the model file should be the source of truth). There is a better way to work on this (migrations) - but let's keep it simple for now.

Connect to the db and check the Expense table.

### 4. Data and queries

Aside from synchronizing with the database, the schema is also used by Prisma to generate client code:

```bash
npx prisma generate
```

You should see a new `/generated` folder - as this is generated code, we should never update it manually - see it as a library, even if it's in the repository. This is the "client" code as in code that allows you to interact with the database using JavaScript.

We're going to test it using a simple db.js file:

```javascript
const { PrismaClient } = require('./generated/prisma/client');

const prisma = new PrismaClient();

async function main() {
  const expenses = await prisma.expense.findMany();
  console.log(expenses);
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  });
```

The important piece is the main function and especially:

```javascript
const expenses = await prisma.expense.findMany();
```

This is using our generated code - thanks to the schema, prisma was able to generate methods for the "expense" model.
Run the script and check the result:

```bash
node .\db.js
```

What's the output? Why?

- create a separate script called "populate.js" to populate our database with the same data we had in the json. This can be done with the [create](https://www.prisma.io/docs/orm/prisma-client/queries/crud#create) method (or the similar `createMany`).
- run and test that the records are properly created (how?)

> From the trenches: Reading things and showing them is usually much easier than creating them (no forms, validation, etc). So it generally make sense to start an application with screens that show list of objects. As we saw here, we can easily create what we need using some basic scripting - which allow us to go very quickly to actual results on the screen, as we'll see in the next section.

### 5. Integrate this with our webapp

We have all the pieces to show actual data on the screens:

- We already have the React part
- The API is already defined (routes)
- We just need to update the service to get the data from the database using prisma instead of reading the json file

So let's go:

- Replace the getAllExpense's content by a call to findMany() (if you implemented sorting last week you may have to update it here too)
- Replace the addExpense by a call to create()
- Check that the whole cycle is working as expected (from the screen to the database and back)

> Warning: most of prisma's methods are asynchronous - make sure you return actual results, not promises.

Looks like a good time to push and deploy.
Check that everything works fine on render.

You may encounter these two issues :

- if you have a cors error, remember to allow your backend to serve request from your frontend in `app.js`.
- If it complains about generated/prisma not being present, it's because it is in the .gitignore. This is on purpose and you need to update your render setting to use the following build command: `npm install && npx prisma generate`

### 6. A basic form

We want to update our "ExpanseAdd" button to be able to add a real expanse using a proper form & fields.

- Create a form in ExpenseAdd with fields for payer (Bob or Alice, use a select), date, description, amount
- As a first step, create a "handleSubmit" method to be called on submit, outputing (via the console or an alert) the form content

Check that everything is running properly.

- Replace the console.log to a call to the create API. Disregard validation issues for now.

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

---

## Optional Challenges<>

### A. Use Zod for better validation

Get to the form again and use Zod to get proper validation:

- user need to be one of either "Bob" or "Alice"
- amount should be a positive float
- description is optional but cannot be bigger than 200 characters

Make sure to show proper error messages for each case.

---

## Summary

- React components should receive data via **props** to stay reusable and testable.
- `useState` is used to manage dynamic local state in React components, such as expense lists and form data.
- Express routing separates **HTTP handling (router)** from **business logic (service)** for better code organization.
- File-based persistence using `fs` allows simple backend storage for small applications without database complexity.
- When working with demo data, keep an easy way to reset your data to something clean.
- Organizing your code from the start with proper separation of concerns helps scale your app more easily.
