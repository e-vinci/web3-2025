---
title: 'Lesson 1 – JS2 Recap & Project Kickoff'
description: 'A recap of React and Express fundamentals, focused on preparing the base for a collaborative expense-sharing application.'
publishDate: 2025-09-19T00:00:00Z
excerpt: 'Refresh React and Express knowledge while building the foundation for a collaborative expense-sharing app with TypeScript, Vite, and modular backend architecture.'
tags:
  - react
  - express
  - javascript
  - typescript
  - vite
  - nodejs
  - course
  - web3-2025
category: 'course-lesson'
# image: https://picsum.photos/id/84/200/200
---

## Course material

- [Presentation Slides](https://raw.githubusercontent.com/e-vinci/web3-2025/refs/heads/main/src/slides/lesson-1-theory.pptx)

## Introduction

Welcome back! This lesson serves as a comprehensive refresher of key concepts from last year’s JS2 course. We’ll revisit essential frontend and backend practices using React and Express, then scaffold the foundation for this year’s collaborative expense-sharing application (inspired by apps like Splitwise and Tricount). The goal is to reinforce patterns and structures that you'll use and extend throughout the course.

In the backend, we'll continue using file-based data persistence with JSON files and modular service/router patterns. On the frontend, you’ll use React (with TypeScript) and Vite.js to create typed, component-driven interfaces. Each React component must receive its data via props to maintain clarity and reusability.

## Recommended Reading

- [React – Main Concepts (Official Docs)](https://reactjs.org/docs/hello-world.html)
- [React – State and Lifecycle](https://reactjs.org/docs/state-and-lifecycle.html)
- [Vite – Getting Started](https://vitejs.dev/guide/)
- [Express – Basic Routing](https://expressjs.com/en/starter/basic-routing.html)
- [Node.js File System (fs)](https://nodejs.org/api/fs.html)
- [Last year's JS course](https://e-vinci.github.io/js2)

## Exercises

All exercises relate to a new collaborative expense-sharing app. Begin by initializing your project with Vite and Express in separate folders using the commands specified in Exercise 1.

### 1. Initialize the Project

**Goal**: Set up your project with modern tooling.

- Create and Navigate to your exercise directory, eg: `web3/exercises/lesson-1-refresh`
- Create a new Vite React + TypeScript app in a `frontend/` directory using:

```bash
npm create vite@latest frontend -- --template react-ts
```

- Initialize an Express server in a `backend/` directory using:

```bash
npx express-generator --no-view backend
```

- Install dependencies for both frontend and backend projects by running `npm install` in each directory.
- Verify that both servers can start successfully:
  - Frontend development server (typically runs on port 5173 with Vite)
  - Backend Express server (typically runs on port 3000)

**Note**: You might have noticed that we are not using typescript for the backend.
We made this choice because this is a recap exercise and we want to keep things as simple as possible. `express-generator` is a tool provided by express which keeps things simple.
A more solid choice would have been using a template repository [like this one](https://github.com/edwinhern/express-typescript) or maybe even a fully fledged framework. We'll consider these options in future lessons.

One of the consequences of this choice is the backend using CommonJS modules and not ESModules. The difference between these two types of javascript modules is assumed to be known.

### 2. Basic React App Structure

**Goal**: Create a working frontend structure using props.

- Create a TypeScript interface for the Expense type first. In `frontend/src/types/Expense.ts`:

```typescript
export interface Expense {
  id: string;
  date: string;
  description: string;
  payer: string;
  amount: number;
}
```

- Create a `frontend/src/components/ExpenseItem.tsx` component that displays a single expense item.
- Use props to pass expense data into `ExpenseItem` component, reuse the type definition from above.
- Create a `frontend/src/pages/Home.tsx` page component that renders a hardcoded list of at least 3 expense items using `ExpenseItem`.
- Update `frontend/src/App.tsx` to render the Home page.
- All components must receive data via props - no hardcoded data within components themselves.
- Verify that the expense list displays correctly in the browser with proper formatting.

**TypeScript Note**: If you encounter import errors with TypeScript, use `import type { Expense } from '../types/Expense'` for type-only imports when `verbatimModuleSyntax` is enabled in your TypeScript configuration.

### 3. Basic State in React

**Goal**: Introduce basic state management with `useState` to manage the expense list dynamically.

- Replace the hardcoded expense data in `frontend/src/pages/Home.tsx` with a `useState` hook that holds an array of expenses.
- The state should be initialized with the same hardcoded expenses, but now stored in a state variable that can be updated.
- Create a `frontend/src/components/ExpenseAdd.tsx` component with only a button "Add", clicking on it will add a new Expense :
  - with a payer randomly selected between Alice and Bob.
  - with a value between 0 and 100, maximum 2 decimal digits (cents).
  - with an id generated from `Date.now().toString()`.
  - The function `onAdd` will be declared in the component, create the Expense item, and then call `handleAdd(newExpense)`. Thet function must be received via the props.
- Implement an "Add Expense" functionality that updates the expense list state when the form is submitted.
  - The `Home` component will implement the `handleAdd` function and pass it to the `ExpenseAdd` component. The implementation will rely on the setter from `useState`
- The new expense should immediately appear in the expense list without requiring a page refresh.
- Verify that the state updates work correctly and new expenses persist until page reload.

### 4. Backend Expense Router and Service

**Goal**: Create modular backend structure following separation of concerns.

- Create `backend/data/expenses.json` and `backend/data/expenses.init.json` files in your backend directory.
- Add example data in both JSON files with all required fields. Here is an example:

```json
[
  { "id": "1", "date": "2025-01-16", "description": "Example expense #1 from Alice", "payer": "Alice", "amount": 25.5 },
  { "id": "2", "date": "2025-01-15", "description": "Example expense #2 from Bob", "payer": "Bob", "amount": 35 },
  { "id": "3", "date": "2025-01-15", "description": "Example expense #3 from Alice", "payer": "Alice", "amount": 2 }
]
```

- Create `backend/routes/expenses.js` and define an Express router with:
  - GET `/expenses` route that returns all expenses from the JSON file
  - POST `/expenses` route that adds a new expense to the JSON file
- Create `backend/services/expenses.js` and implement:
  - `getAllExpenses()` function that reads and parses `backend/data/expenses.json`
  - `addExpense(expense)` function that appends a new expense to the JSON file
- Connect the expenses router to your main server file (`backend/app.js`) using `app.use('/api', expensesRouter)`.
- Test your API endpoints using [REST client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
  - Verify GET returns the current expense list
  - Verify POST successfully adds a new expense and persists it
- Configure CORS to allow frontend requests from localhost.
  - You will need the [cors middleware](https://github.com/expressjs/cors)

**Note**: remember that your backend with express is extremely simple and **does not refresh automatically**, do not forget to restart it manually after a change.

### 5. Reset Endpoint

**Goal**: Implement a development utility route for resetting data.

- Add a POST route `/expenses/reset` to `backend/routes/expenses.js` that resets the expense data to initial state.
- Extend `backend/services/expenses.js` with a `resetExpenses()` function that:
  - Reads the contents of `backend/data/expenses.init.json` using `fs.readFileSync`
  - Overwrites `backend/data/expenses.json` with the initial data using `fs.writeFileSync`
  - Returns the reset data for confirmation
- Ensure the reset endpoint returns a success message and the new expense list.
- Test the reset functionality using your REST client:
  - Add some expenses via POST `/expenses`
  - Verify they appear in GET `/expenses`
  - Call POST `/expenses/reset`
  - Verify the data has been reset to initial state
- Add proper error handling for file operation failures: log to console and respond with a 500 http code.

### 6. Connect Frontend to Backend

**Goal**: Integrate the React frontend with the Express backend API.

- Update `frontend/src/pages/Home.tsx` to load expenses from the backend instead of using hardcoded data:
  - Replace the `useState` initialization with an empty array
  - Add a `useEffect` hook that fetches expenses from `http://localhost:3000/api/expenses` on component mount
  - Update the state with the fetched data
- Modify `onAdd()` to send new expenses to the backend:
  - Update the form submission to POST the new expense to `http://localhost:3000/api/expenses`
  - Refresh the expense list after successful submission
- Add a "Reset Data" button in `frontend/src/pages/Home.tsx` that:
  - Calls POST `http://localhost:3000/api/expenses/reset`
  - Refreshes the expense list after successful reset
  - Provides user feedback for the reset operation
- Verify the complete flow works: loading expenses, adding new expenses, and resetting data.
- Ensure proper loading states and error handling throughout the user interface.

---

## Optional Challenges

### A. Expense Sorting

Create a `frontend/src/components/ExpenseSorter.tsx` component that implements sorting functionality for the expense list. Include a `select` dropdown with options to sort by date (newest/oldest first) or amount (highest/lowest first).
Use React state to manage the current sort preference and pass the sortingAlgorithm to the `Home` component responsible for displaying the items in the proper order.
The sorting should persist until the user changes the selection or refreshes the page.

> **Warning**: This is a tricky question because `useState` has some unexpected behaviour. Read the documentation again if you observe strange behaviour.

## Summary

- React components should receive data via **props** to stay reusable and testable.
- `useState` is used to manage dynamic local state in React components, such as expense lists and form data.
- Express routing separates **HTTP handling (router)** from **business logic (service)** for better code organization.
- File-based persistence using `fs` allows simple backend storage for small applications without database complexity.
- When working with demo data, keep an easy way to reset your data to something clean.
- Organizing your code from the start with proper separation of concerns helps scale your app more easily.

## The PR

- Go check it on [GitHub](https://github.com/e-vinci/web3-2025/pull/5)
- Let's review the code together
