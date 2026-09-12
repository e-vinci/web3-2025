---
title: 'Lesson 1 – Recap'
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

Both sides of the app are TypeScript this year. In the backend, we'll continue using file-based data persistence with JSON files and modular service/router patterns. On the frontend, you'll use React (with TypeScript) and Vite.js to create typed, component-driven interfaces. Each React component must receive its data via props to maintain clarity and reusability.

## Recommended Reading

- [React – Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)
- [React – State: A Component's Memory](https://react.dev/learn/state-a-components-memory)
- [Vite – Getting Started](https://vite.dev/guide/)
- [Express – Basic Routing](https://expressjs.com/en/starter/basic-routing.html)
- [Node.js File System (fs)](https://nodejs.org/api/fs.html)
- [Last year's JS course](https://e-vinci.github.io/js2)

## Exercises

All exercises relate to a new collaborative expense-sharing app. Begin by setting up your project from the
provided boilerplate, as described in Exercise 1.

### 1. Initialize the Project

**Goal**: Set up your project with a standard, industry-compliant starting point.

- Create and Navigate to your exercise directory, eg: `web3/exercises/lesson-1-refresh`
- Download the course boilerplate and extract it here:

```bash
curl -LO https://raw.githubusercontent.com/e-vinci/web3-2025/refs/heads/main/exercises/0-boilerplate/boilerplate.zip
unzip boilerplate.zip
rm boilerplate.zip
```

  This gives you two folders, `frontend/` and `backend/`, already set up:
  - `frontend/`: a standard Vite + React + TypeScript project (the same you'd get from
    `npm create vite@latest -- --template react-ts` today).
  - `backend/`: a small hand-rolled Express app, written in **TypeScript** (`app.ts`) 
- Install dependencies in both folders: `npm install` in `frontend/`, and again in `backend/`.
- Verify that both servers can start successfully — don't skip this:
  - Frontend development server: `npm run dev` in `frontend/` (typically runs on port 5173)
  - Backend Express server: `npm run dev` in `backend/` (runs on port 3000, restarts automatically on file
    changes — use this instead of `npm start` while developing). Confirm it's actually responding with
    `curl http://localhost:3000/ping`, which should return an empty response with HTTP 204 (cleaner to check
    than expecting a 404 from a route that doesn't exist yet).


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

- Create a `frontend/src/components/ExpenseItem.tsx` component that displays a single expense item, rendering
  all four fields: `date`, `description`, `payer`, and `amount` (format the amount with 2 decimal places and a
  `$` prefix, e.g. `$25.50`).
- Use props to pass expense data into `ExpenseItem` component, reuse the type definition from above.
- Create a `frontend/src/pages/Home.tsx` page component that renders a hardcoded list of at least 3 expense items using `ExpenseItem`.
- Update `frontend/src/App.tsx` to render the Home page.
- All components must receive data via props - no hardcoded data within components themselves.
- Verify that the expense list displays correctly in the browser with proper formatting.

**TypeScript Note**: the boilerplate's `tsconfig.app.json` has `verbatimModuleSyntax` enabled, so importing
`Expense` as a plain (non-`type`) import **will** fail here — use `import type { Expense } from '../types/Expense'`
instead. The two ways you might notice this differ: `npm run dev` (Vite, no type-checking) gives a confusing
runtime `SyntaxError` in the browser console; `npm run build`/`tsc -b` gives a much clearer, actionable
`TS1484: '...' is a type and must be imported using a type-only import` error. If something here is silently
broken with no obvious error, try a build before debugging further.

### 3. Basic State in React

**Goal**: Introduce basic state management with `useState` to manage the expense list dynamically.

- Replace the hardcoded expense data in `frontend/src/pages/Home.tsx` with a `useState` hook that holds an array of expenses.
- The state should be initialized with the same hardcoded expenses, but now stored in a state variable that can be updated.
- Create a `frontend/src/components/ExpenseAdd.tsx` component with only a button "Add" (no `<form>` needed —
  a plain button click handler is enough), clicking on it will add a new Expense :
  - with a payer randomly selected between Alice and Bob.
  - with a value between 0 and 100, maximum 2 decimal digits (cents).
  - with an id generated from `Date.now().toString()`.
  - with `date` set to the current date (e.g. `new Date().toISOString()`).
  - with `description` set to a simple placeholder that includes the id, e.g. `` `New expense ${id}` `` — there's
    no user input for this field yet, so any consistent placeholder works.
  - `ExpenseAdd` receives a prop called `addExpense` (type `(expense: Expense) => void`). Its own button click
    handler (e.g. `handleAddClick`) builds the new `Expense` object and calls `addExpense(newExpense)` — that
    function itself lives in `Home`, not in `ExpenseAdd`.
- Implement the "Add Expense" functionality: clicking the button should update the expense list state.
  - The `Home` component implements `addExpense` (naming it `handleAddExpense` internally is fine, but the prop
    it hands down to `ExpenseAdd` must be called `addExpense`) and passes it down. Its implementation relies on
    the setter from `useState`.
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

- Create `backend/types/Expense.ts` with the same `Expense` interface as the frontend (`id`, `date`,
  `description`, `payer`, `amount`). Yes, this duplicates the frontend's type definition — sharing types between
  two separate Node projects needs a monorepo/shared-package setup, which is a topic for a later lesson.
- Create `backend/routes/expenses.ts` and define an Express `Router` with:
  - GET `/expenses` route that returns all expenses from the JSON file
  - POST `/expenses` route that adds a new expense to the JSON file
- Create `backend/services/expenses.ts` and implement:
  - `getAllExpenses(): Expense[]` function that reads and parses `backend/data/expenses.json`
  - `addExpense(expense: Expense): Expense` function that appends a new expense to the JSON file
- Connect the expenses router to your main server file (`backend/app.ts`) using `app.use('/api', expensesRouter)`.
- **TypeScript Note**: the backend's `tsconfig.json` uses `nodenext` module resolution, which — unlike the
  frontend's bundler-based setup — requires the actual file extension on relative imports:
  `import { getAllExpenses } from '../services/expenses.ts';`. Leaving it off (`'../services/expenses'`) fails
  both ways you might notice: `npm run typecheck` reports `TS2835: Relative import paths need explicit file
  extensions`, and just running `npm run dev` crashes immediately with `ERR_MODULE_NOT_FOUND` — there's no
  build step to catch it first.
- Add proper error handling to both routes: wrap the file-based logic in try/catch, log the error to the
  console, and respond with a 500 http code on failure (this applies to the reset route in the next exercise
  too — write it once, reuse the pattern). Note that a caught error is typed `unknown` in TypeScript, not
  `Error` — you can still pass it directly to `console.error`, but check `error instanceof Error` before
  reading `.message` off it.
- Test your API endpoints using [REST client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
  if you're on VS Code, or plain `curl` otherwise (works regardless of editor):

```bash
curl http://localhost:3000/api/expenses
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"id":"999","date":"2025-01-16","description":"Test expense","payer":"Alice","amount":10}'
```
  - Verify GET returns the current expense list
  - Verify POST successfully adds a new expense and persists it

**CORS**

Configure CORS to only allow requests from your frontend's origin — pass an options object to the `cors`
middleware rather than calling it with no arguments (which would allow *any* origin):

```typescript
import cors from 'cors';
// ...
app.use(cors({ origin: ['http://localhost:5173'] }));
```

- You will need the [cors middleware](https://github.com/expressjs/cors): `npm install cors` and, since this
  is a TypeScript project, its type definitions too: `npm install -D @types/cors`.
- **Troubleshooting Note**: double-check your frontend actually landed on port 5173 (Vite silently picks the
  next free port — 5174, 5175... — if 5173 is already in use, e.g. by another project's dev server). If it did,
  and Exercise 6 then fails with a browser-console CORS error, update the `origin` array to match the port Vite
  actually printed.

### 5. Reset Endpoint

**Goal**: Implement a development utility route for resetting data.

- Add a POST route `/expenses/reset` to `backend/routes/expenses.ts` that resets the expense data to initial state.
- Extend `backend/services/expenses.ts` with a `resetExpenses(): Expense[]` function that:
  - Reads the contents of `backend/data/expenses.init.json` using `fs.readFileSync`
  - Overwrites `backend/data/expenses.json` with the initial data using `fs.writeFileSync`
  - Returns the reset data for confirmation
- Ensure the reset endpoint returns a success message and the new expense list.
- Apply the same error handling as the previous exercise here too (try/catch, console log, 500 on failure).
- Test the reset functionality using your REST client or `curl`:

```bash
curl -X POST http://localhost:3000/api/expenses/reset
```
  - Add some expenses via POST `/expenses`
  - Verify they appear in GET `/expenses`
  - Call POST `/expenses/reset`
  - Verify the data has been reset to initial state

### 6. Connect Frontend to Backend

**Goal**: Integrate the React frontend with the Express backend API.

- Create a `frontend/src/hooks/useExpenses.ts` custom hook that owns all the backend-communication logic and
  state for expenses: the `expenses` array itself, plus `loading`/`error` state, an internal function that
  fetches `http://localhost:3000/api/expenses` (called once on mount via `useEffect`), an `addExpense(expense)`
  function that POSTs to `/api/expenses` and refreshes the list, and a `resetExpenses()` function that POSTs to
  `/api/expenses/reset` and refreshes the list. The hook returns `{ expenses, loading, error, addExpense,
  resetExpenses }`.
- Update `frontend/src/pages/Home.tsx` to call `useExpenses()` instead of managing its own `useState`/`useEffect`
  for expenses, and pass the hook's `addExpense` straight through as the `addExpense` prop to `ExpenseAdd` (same
  prop name you already used in Exercise 3 — no renaming needed).
- Add a "Reset Data" button in `Home.tsx` that calls the hook's `resetExpenses()` and gives the user feedback
  (e.g. a brief message) once it resolves.
- Verify the complete flow works: loading expenses on mount, adding new expenses, and resetting data — including
  that an added expense is still there after a page reload (proof it's really persisted on the backend, not just
  in local state).
- Ensure proper loading states and error handling throughout the user interface.

**Why a custom hook, not inline `useEffect`?** Pulling the fetch/add/reset logic out of `Home` and into
`useExpenses` keeps the component focused on rendering, and is a first step toward the pattern real apps use
(see the note below).

**A note on a lint warning you may see**: if you've set up your project with `oxlint` (the linter that
`npm create vite@latest` installs by default today), it may warn about `set-state-in-effect` — calling a state
setter synchronously inside a `useEffect`, which is exactly what happens when the fetch inside `useExpenses`
resolves and updates `expenses`. This warning exists because that pattern forces React to render twice (once
before the fetch, once after) and has known pitfalls (race conditions if requests can overlap, no caching, no
request de-duplication) — see React's own [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
guide. **We're not solving that problem in this lesson** — this is a recap exercise, not the lesson where we
introduce new concepts — but keep it in mind: later in the course we'll look at dedicated data-fetching tools
that solve this properly.

---

## Optional Challenges

### A. Expense Sorting

Create a `frontend/src/components/ExpenseSorter.tsx` component that renders the `select` dropdown, with options
to sort by date (newest/oldest first) or amount (highest/lowest first). `ExpenseSorter` doesn't hold the sort
state itself — like `ExpenseAdd` in Exercise 3, it receives a callback prop (e.g.
`onSortChange: (algorithm: (a: Expense, b: Expense) => number) => void`) and calls it when the user picks an
option. `Home` is the one that owns the current sort state (via `useState`) and applies it — sorting is a
concern of `Home`, `ExpenseSorter` is just the UI for picking one. Keep the comparator functions themselves
somewhere that isn't co-exported from the same file as the component (e.g. inline in `Home`, or in a small
separate module) — exporting a non-component value alongside a component from the same file triggers an oxlint
`only-export-components` warning.
The sorting should persist until the user changes the selection or refreshes the page.

> **Warning**: This is a tricky exercise. If you store the sorting *function* itself in `useState` — either as
> its initial value or via the setter — you may see the page go blank with an error about reading a property of
> `undefined`. This isn't a bug in your sorting logic: it's specifically how `useState` treats function
> arguments. Before guessing at a fix, read React's own explanation of this exact situation:
> [useState – "I'm trying to set state to a function, but it gets called instead"](https://react.dev/reference/react/useState#im-trying-to-set-state-to-a-function-but-it-gets-called-instead).

## Summary

- React components should receive data via **props** to stay reusable and testable.
- `useState` is used to manage dynamic local state in React components, such as expense lists and form data.
- Express routing separates **HTTP handling (router)** from **business logic (service)** for better code organization.
- File-based persistence using `fs` allows simple backend storage for small applications without database complexity.
- When working with demo data, keep an easy way to reset your data to something clean.
- Organizing your code from the start with proper separation of concerns helps scale your app more easily.

