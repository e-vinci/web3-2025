---
title: 'Lesson 4 – Migration following and end'
description: 'Migration: adding the category to the expense'
publishDate: 2025-10-17T00:00:00Z
excerpt: 'Migration: adding the category to the expense'
tags:
  - react
  - typescript
  - express
  - prisma
  - tailwind
  - course
  - web3-2025
category: 'course-lesson'
---

# Objectives

- Intensive use of React hooks and context
- Create filter (search functionality) of `expenses` by payer and amount
- Migration: add `category` ressource and relation to `expense`
- Add `category` to `expense` form creation
- Search `expenses` by category

---

# Assumption

- Your backend and frontend run correctly on your local machine and Render.
- The first migration has been done and the database contains the tables `expense`, `user`, and `transfer`.
- Your db must be populated with some data to test the search functionalities.

---

# 1. Search

## 1.1 Search by amount

### Backend

The backend should be modified to handle the query parameter `amount` and return the expenses that have an amount greater than the value entered in the input field.

In the file `src/controllers/expense.controller.ts`, modify the `getExpenses` method to handle the query parameter `amount`. Do the necessary checks to ensure that the parameter is a valid number.

In the service `src/services/expense.service.ts`, modify the `getExpenses` method to accept an optional parameter `filter` that is an object with a key `amount` and the value entered in the input field.

Modify the prisma call to filter the expenses by the amount. See official [prisma documentation](https://www.prisma.io/docs/orm/fundamentals/reading-data) for filtering.

***Verify*** with `.http` file that your backend works as expected.

### UI

In the UI, create a new form to search expenses by amount. In this form, add a input field to enter a number and a button to search.

When the form is submitted, a call to the backend should be made on the URL `/api/expenses`. This call will take a query parameter with a key `amount` and the value entered in the input field. The new url will be something like `/api/expenses?amount=<amount>`.


## 1.2 Search by payer

### Backend

#### New ressources: Users
Create a new router `user.router.ts` in the `src/routers` directory. This router should have a route `/api/users` that returns all users. Create a service to handle the logic of fetching users from the database.

***Verify*** with `.http` file that your backend works as expected.

#### Search Expenses by payerId
Modify the backend to handle the query parameter `payerId` and return the expenses that have a payer equal to the given value.

***Verify*** with `.http` file that your backend works as expected.

### UI

#### Step 1: create a form with an input to filter by payerId

First, create a form with an input field to enter the payerId value (as a string). Send this value to the backend when the form is submitted and observe that you visualize the expenses paid by this user only.

#### Step 2: define a dropdown to select a user

Create one hook to use the new endpoint `/api/users`. Only implement the `fetchAll` method. Follow the same pattern as the previous hooks (see lesson 3).

In the search form, prepare a dropdown menu to select a user. The dropdown should be populated with the users returned by the backend. Adpte the form to accept both the amount and the user as filters.

---

# 2. Migration

## 2.1 Create the new resource

Following the general migration pattern (see previous lesson), create a new migration to add a `category` resource and a relation to `expense`.

A category should have:

- a name (unique)
- a colour

Each expense can have one category. The category is optional.

Define a new prisma model `Category` in the `schema.prisma` file. Then define the relation between `Expense` and `Category` as a many-to-one relationship (see [Prisma documentation](https://www.prisma.io/docs/orm/fundamentals/relations-and-joins#one-to-many)).

## 2.2 Migration

Run the migration to create the new table in the database.

Reminder: to run the migration, use the following command in dev environment:

```bash
  npx prisma contract emit
  npx prisma migration plan --name add-category
  npx prisma db migrate --advance-ref db
```

Have a look to your migration plan and be sure that all the existing `expense` received the `categoryId` field with the value `NULL` as default.

While in production, use the following command:

```bash
npx prisma db migrate
```

Create a script to populate the database with some categories. ***Do not delete existing data.*** You try to reproduce your production environment as much as possible: so you try to migrate without dropping the database.

Using some VSC extension, modify some existing expenses to have a category assigned to them.

## 2.3 BE + UI

Create a new route in the backend to fetch all categories.

Modify the UI to: 

- create a new hook to fetch all categories
- allow users to select a category when creating an expense. Insert a dropdown menu to select a category. The dropdown should be populated with the categories returned by the backend.

At rendering time, display the category name with a colour in the expense list.

Finally, when creating an expense, ask the user to select a category.

## 2.4 Search by category

### Backend

Modify the backend to handle the query parameter `categoryId` and return the expenses that have a category equal to the given value.

### UI

In the search form, add a dropdown menu to select a category. The dropdown should be populated with the categories returned by the backend. Adpte the form to accept the category as a filter.

---
