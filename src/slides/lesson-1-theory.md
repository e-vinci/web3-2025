---
marp: true
theme: default
paginate: true
header: 'Web 3 2026 - Recap'
footer: 'Web 3 2026 - Vinci'
---

# Theoretical Introduction

## Lesson 1 – Recap

---

## Lesson Objectives

- Refresh React and Express fundamentals
- Understand the structure of a modern fullstack app
- Prepare the foundation for a collaborative expense-sharing application

---

## React: Main Concepts

- **Components**: The building blocks of UIs. Each component is a JavaScript function or class that returns JSX.
- **Props**: Data passed **from parent to child** components. Props are read-only.
- **State**: Data managed **within a component**. State changes trigger re-renders.
- **Events**: Handling user actions (click, input, etc.)
- **Composition**: Building complex UIs from smaller components.

[React Official Documentation](https://react.dev/learn)

```jsx
function Welcome(props) {
  return <h1>Hello, {props.name}!</h1>;
}
<Welcome name="Alice" />;
```

---

## React: State & Lifecycle

- **State**: Use `useState` to add **local** state to function components.
- **Lifecycle**: Use `useEffect` to run code on mount, update, or unmount. <!-- I don't really understand this point, it may deserve deeper explanations -->
- **Data Flow**: State flows down, actions flow up via callbacks.
- **Custom Hooks**: a function starting with `use` that packages up stateful logic (like fetching data) so a  component can call it instead of repeating `useState` and `useEffect` inline

[State and Lifecycle (React Docs)](https://react.dev/learn/state-a-components-memory)

---

```jsx
import { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);

  return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>;
}
```

---

## TypeScript: Why and Basics

- **Why TypeScript?**

  - Adds static typing to JavaScript, catches errors at compile time
  - Improves code completion, refactoring, and AI guidance
  - Makes code more maintainable and self-documenting

- **TypeScript Basics**
  - Types: `string`, `number`, `boolean`, `any`, `void`, `unknown`, etc.
  - Interfaces and types for objects
  - Type inference and type annotations

[TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

```typescript
// Basic types
let username: string = 'Alice';
let age: number = 30;
let isActive: boolean = true;

// Interface
interface Expense {
  id: string;
  date: string;
  description: string;
  payer: string;
  amount: number;
}

// Type
type Result = number | false | void;

// Function with types
function add(a: number, b: number): number {
  return a + b;
}
```

---

## Express: Main Concepts

- **Minimalist HTTP server for Node.js**
- **Routing**: Define endpoints for different HTTP methods and paths
- **Middleware**: Functions that process requests before they reach your route handler
- **Persistence**: Start with JSON files, move to databases later
- **Modularity**: Organize code into routers and services

[Express Routing (Official Docs)](https://expressjs.com/en/starter/basic-routing.html)

---

```typescript
import express, { type Request, type Response } from 'express';
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Define a route
app.get('/api/expenses', (req: Request, res: Response) => {
  res.json([]); // return the list of expenses
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

---

## Express: Routers & CORS

- **Router**: group related routes, mount them under a path prefix — this is how "Modularity" from the previous
  slide actually looks in code
- **CORS**: browsers block cross-origin requests (different port = different origin) by default; a `cors`
  middleware opts specific origins back in

```typescript
import { Router } from 'express';
const router = Router();

router.get('/expenses', (req: Request, res: Response) => {
  res.json([]);
});

app.use('/api', router); // now serves GET /api/expenses
```

---

## Tooling & Project Structure

- **Vite**: Fast React frontend setup (React + TypeScript template)
- **Express 5**: web server and backend framework (minimalist)
- **TypeScript + ESM**: frontend and backend both use .ts and `import`/`export` 
- **oxlint**: the linter Vite scaffolds by default today
- **npm**: Dependency management
- **Frontend/backend separation**: two apps, two folders.

---

<!--
Discussion moment
-->

## Open questions

---

## A step further (1)

In the back end, what did we "do" when we run the command `npm run dev` & `npm run start`?

<!--
dev VS start : 
- define in package.json in "scripts" section
- dev : uses nodemon to watch for changes, could "rebuild" the server and restart the server, very useful for development but quite resource consuming
- start : just runs the server on "build" files -> JS
-->

What does it actually do on our own computer?
<!-- proposition : more like a discussion with students, we need to mention at least :
- what's a server
- what's a port
- ISO TCP/IP layers
may be listed ideas/concept on the board.
-->


---

## A step further (2)

What happens when we do a `GET` request to `http://localhost:3000/api/expenses`?

- with curl tool,
- with .http request,
- with web browser,

Remember the C class where we programmed a GET http request with a socket connection?

---

## A step further (3)

At front end, what's happening when we perform the command `npm run dev`?

What do there is no `npm run start` command? Do we need one?

<!--
Explain that Vite is a dev server that serves the frontend and hot-reloads the code when it changes.
We do need a server to serve the built files in production, typical examples are Nginx or Apache. We provide to this server a "build" folder with an entry point (`index.html`). The build is made of html and JS code.
We could use a simple HTTP server like `http-server` or `serve` but it's not necessary for now.
-->

---

## Useful Links

- [Vite – Getting Started](https://vite.dev/guide/)
- [Node.js File System (fs)](https://nodejs.org/api/fs.html)
- [Last year's JS2 course](https://e-vinci.github.io/js2)

---

**Next: Deploy and move to a real database!**
