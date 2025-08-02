---
publishDate: 2025-02-05T00:00:00Z
title: Module 4 - APIs and Persistence
excerpt: In this module we address the need to persist data beyond the user's current session and to communicate with back-end services. We'll explore how to store data locally in the browser so that it isn't lost on page refresh (using Web Storage APIs like localStorage and more complex storage like IndexedDB).
category: Modules
tags:
  - react
  - apis
  - persistence
  - localStorage
  - indexedDB
  - express
  - prisma
  - tanstack-query
---

# Module 4: APIs and Persistence

## Overview

In this module we address the need to persist data beyond the user's current session and to communicate with back-end services. We'll explore how to store data **locally** in the browser so that it isn't lost on page refresh (using Web Storage APIs like **localStorage** and more complex storage like **IndexedDB**). We'll then move to **server-side persistence**: setting up a simple back-end (using **Express.js** in Node) with a database to save data so it can be shared between users or across devices. You'll learn how to perform **HTTP requests** from your React app to an API and handle the responses. We introduce **Prisma** (a modern ORM for databases) to simplify database interactions in our Node server. On the front-end, we will use **TanStack Query** (formerly React Query) to manage fetching, caching, and updating data from the server in a convenient way. By the end of this module, you will be able to save data permanently and retrieve it, making your applications stateful and collaborative across sessions and users.

## Reading List

### Required Reading

- **MDN Web Docs – Using the Web Storage API:** Read this article to understand the basics of **localStorage** and sessionStorage in the browser. It covers how to save key/value pairs in the browser that persist across page reloads (localStorage persists indefinitely until cleared). Pay attention to examples of setting, getting, and removing items. This will be useful for client-side persistence of small amounts of data or user preferences.

  - [https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API)

- **MDN Web Docs – Using IndexedDB:** This documentation explains **IndexedDB**, a client-side storage mechanism for larger amounts of structured data. It's an asynchronous, promise-based API for storing data in a NoSQL-like database in the browser. Skim through to get an idea of when you'd use IndexedDB (for example, offline applications, caching large data sets). We might not use IndexedDB directly in exercises, but knowing it exists is important for advanced persistence needs.

  - [https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)

- **Express.js Official – Getting Started Guide:** Go through the Express "Hello World" and basic routing guide on the official Express website. This will show you how to create a simple Express server, define routes (endpoints), and send responses (like JSON data). Understanding how to set up an Express server will allow you to implement a backend for your React app to talk to. We will keep the server simple (no complex middleware or authentication yet), focusing on how to accept requests and read/write data.

  - [https://expressjs.com/en/starter/hello-world.html](https://expressjs.com/en/starter/hello-world.html)
  - [https://expressjs.com/en/starter/basic-routing.html](https://expressjs.com/en/starter/basic-routing.html)

- **Prisma ORM Documentation – Getting Started:** Read the introduction to Prisma (e.g., the Prisma Quickstart). Prisma will enable us to define a schema for our database and interact with a database using JavaScript/TypeScript. Even if you don't follow every step, understand conceptually that Prisma sits between our server code and the database, providing an abstraction that saves us from writing raw SQL.

  - [https://www.prisma.io/docs/getting-started/quickstart](https://www.prisma.io/docs/getting-started/quickstart)

- **TanStack Query Docs – Introduction:** TanStack Query is a library for managing **server state** in React apps (data that comes from an external source). Read the official introduction or basics section of TanStack Query docs to grasp its core features: performing data fetching with hooks (`useQuery` for GET requests, `useMutation` for POST/PUT/DELETE), caching data, and automatic refetching/invalidation. This will be key to efficiently using data from our new API in the React app.
  - [https://tanstack.com/query/latest/docs/framework/react/overview](https://tanstack.com/query/latest/docs/framework/react/overview)

### Additional Resources

- **(Optional) History API (MDN or CSS-Tricks):** The HTML5 History API (`history.pushState` and `history.replaceState`) is what allows single-page applications to update the URL without a full page reload. If you're interested, read a tutorial on the History API to see how it enables client-side routing. (Our focus in this module is more on data persistence, but understanding the history API now will help when we tackle navigation/routing in the next module.)
  - [https://developer.mozilla.org/en-US/docs/Web/API/History_API](https://developer.mozilla.org/en-US/docs/Web/API/History_API)

## Exercises

### Exercise 1: Local Persistence with Web Storage

Enhance a React application by adding local persistence for its state using **localStorage**. For example, if you have a simple note-taking app or todo list from previous exercises, make it so the data persists across page reloads.

**Steps:**

1. Pick a piece of state in your React app that you want to persist (e.g., an array of todo items or the text of a note the user is editing).

2. In the component where this state is managed, use the Web Storage API to save the state whenever it changes. You can do this with `useEffect`: whenever the state array changes, call `localStorage.setItem('todos', JSON.stringify(todos))` to save it. (Use a key name that suits your app.)

3. Also, on component mount (or initialization), check `localStorage` for existing data. If present, load it (e.g., `const saved = localStorage.getItem('todos'); if (saved) setTodos(JSON.parse(saved));`). This will initialize your state from storage if available.

4. Test the app: add some items or change the state, then refresh the page. The state should reload from localStorage so that you don't lose your work. Also test clearing the storage (you can manually clear via the browser dev tools) to ensure the app can handle no data.

**Bonus:** If you're feeling ambitious, try using **IndexedDB** for persistence instead, especially if the data is complex or large. You might use a library like `idb` to simplify IndexedDB usage. This bonus will show you how to store more than just small JSON in the browser (for example, images or large datasets), but it's not required for basic persistence needs.

### Exercise 2: Building and Using a REST API

Set up a simple backend server with Express to permanently store data, and connect your React app to it. Continuing with the todo list or notes example, instead of (or in addition to) localStorage, you will have a backend that saves data to a database so it can be shared and retrieved from anywhere.

**Steps:**

**Backend Setup:**

1. Initialize a new Node project (`npm init -y`) in a separate folder. Install `express` and (optionally) `@prisma/client` and `prisma`. Use `npx prisma init` to set up Prisma if you plan to use it, and define a basic schema (for example, a Todo model with id, title, completed boolean). Use `prisma migrate dev` to create a SQLite (or any) database with that schema.

2. Create an Express server (`index.js` or `app.js`). Use `express.json()` middleware to parse JSON request bodies. Set up routes such as: `GET /api/todos` (to return all todos from the database), `POST /api/todos` (to add a new todo), maybe `PUT /api/todos/:id` to toggle or update, and `DELETE /api/todos/:id` to remove. Inside these routes, if using Prisma, call the Prisma client to query or mutate the database (e.g., `prisma.todo.findMany()` or `prisma.todo.create({...})`). If not using Prisma, you could simply use an in-memory array or write to a file (JSON) as a fake database for this exercise.

3. Start the Express server (e.g., on port 3001 or 5000). Test your API using a tool like Postman or curl to ensure the routes work (for instance, POST a new item and see if GET returns it).

**Front-end Integration:**

4. In your React app, replace or augment the data management to use the API. Remove the dummy initial data you had, and instead fetch from your Express API. You can use `useEffect` with `fetch`/`axios` to get the list on component mount. However, this is a good chance to use **TanStack Query** for more convenience: use `useQuery('todos', fetchTodos)` to fetch data (where `fetchTodos` is a function that GETs `/api/todos`). TanStack Query will cache the result and keep it updated.

5. Implement adding a new item: create a form or use an existing input to add a todo, and on submit, send a POST request to your API (`useMutation` hook from TanStack Query can simplify this). After a successful POST, update the list – if using React Query, you can invalidate or refetch the 'todos' query so the UI shows the updated list from the server.

6. Similarly, implement toggling or deleting items by calling the respective API routes, then refreshing the data.

7. Test the full flow in the browser: when the app loads, it should fetch the list from the server. Adding an item should persist (confirm by refreshing the page or even restarting the front-end; the item should still come from the database). Try accessing the server from a different device or browser (if possible) to see the same data – proving that the data is stored on the back-end, not just your browser.

This is a big exercise touching many parts: building an API, connecting to a database with Prisma, and updating the React app to use an asynchronous API with TanStack Query for efficient data handling. Take it step by step. Even if you don't get every part perfect, you will learn how front-end and back-end communicate to achieve persistence and data sharing.

## Additional Exercise (Optional)

**Advanced Caching & Sync:** For a more complex challenge, implement an **offline-first** capability or caching layer. For example, use **IndexedDB** on the front-end to cache server responses (perhaps via service workers or by TanStack Query's persistence features), so that if the app goes offline, the user can still see some data or even add items to be synced later.

**Steps:**

1. Research TanStack Query's offline caching or persistence plugin. It can save query results to IndexedDB and restore them on page load. Try implementing this so that your todo list data is stored in IndexedDB.

2. Simulate offline by shutting down the backend or disconnecting internet, and see if the app still shows cached data.

3. Additionally, implement a way to queue mutations while offline (this is quite advanced). For instance, if you add a new todo while offline, store it locally (perhaps in localStorage/IndexedDB) and then when connection is restored, automatically send those to the API. This typically involves a service worker or a background sync mechanism.

This exercise is optional and intended to push your understanding of persistent state. Modern web apps like Google Docs or Gmail use similar techniques to offer offline functionality. Even if you only conceptually design this, it's a valuable thought experiment in making your app resilient and fast.

## Summary

- **Client-Side Persistence:** Storing data in the browser can greatly enhance UX by preserving user progress and preferences. The simplest API is **localStorage**, which allows you to save stringified data that survives page reloads (and even browser restarts). Use it for small pieces of state (e.g., theme preference, last form input draft, etc.). For larger or more complex data, **IndexedDB** is available – it's essentially a NoSQL database in the browser. IndexedDB is asynchronous and more complex but can handle significant amounts of data (like caching entire responses or files for offline use). Choose the persistence method based on your needs: localStorage for quick key-value pairs, IndexedDB for structured/large data.

- **Server-Side Persistence:** To share data between users or across devices, you need to store it on a server. We introduced **Express.js**, a minimalist web framework for Node.js, to create a RESTful API. With Express, you define endpoints (URLs) that the client can call to **GET** data or **POST/PUT/DELETE** to modify data. For example, a `GET /api/notes` route can send back a list of notes in JSON. By setting up such routes, our React app can communicate with the server using HTTP.

- **Database and ORM:** Rather than storing data in memory or files on the server, real apps use databases. We used **Prisma** ORM to interact with a database in an easier way. Prisma lets us define a schema for our data models and provides a client to query or update the DB with JavaScript method calls (e.g., `prisma.todo.findMany()` instead of writing SQL). This abstracts away the differences between SQL databases and makes our server code more maintainable. While Prisma is just one tool (others include Sequelize, TypeORM, or even using NoSQL databases), the key point is that server persistence involves a database and some layer to talk to it.

- **Fetching and Synching Data in React:** On the client side, once an API is available, the challenge is to use it efficiently. Instead of manual `fetch` calls and state handling, we introduced **TanStack Query** as a solution for managing server state. TanStack Query helps with: caching responses (to avoid unnecessary re-fetch), keeping the UI updated when data changes (by refetching or updating cached data on mutations), and simplifying error/loading states. It's an immensely useful library when dealing with any remote data (such as from our Express API). By using `useQuery` and `useMutation`, we wrote less code to manage the loading spinner, error messages, and data updates – the library handled much of it for us.

- **Collaboration and State Sharing:** With data on a server, multiple clients can access and modify the same data. This enables features like multiple users collaborating (e.g., everyone sees the same list of items if it's a shared resource). However, it also introduces complexity: we need to consider synchronization (if one user adds an item, how do others get updated? – perhaps via refetching or using technologies like WebSockets for real-time updates). TanStack Query can be configured to poll or refetch on interval or on window focus, ensuring clients eventually see fresh data. More advanced setups might use WebSocket or GraphQL subscriptions, but those are beyond this module.

- **Performance and Offline:** Persisting data locally (caching) also improves performance – the app can load faster by using stored data immediately while fetching the latest in background. We discussed the possibility of offline support: using service workers or cached queries to allow read (and even write) capabilities without a network. This is an advanced topic, but modern web apps often employ it for a seamless experience (e.g., you can compose an email offline, and it sends when online).

- In summary, this module taught you how to **not lose data** on refresh (with localStorage/IndexedDB) and how to **save and retrieve data from a server** (through an Express API and database). You've effectively made the transition from a purely front-end app to a full-stack app. Understanding these concepts is crucial for any real-world application, because almost all apps need to talk to servers and preserve data long-term.
