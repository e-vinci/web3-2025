---
publishDate: 2025-01-22T00:00:00Z
title: Module 2 - Advanced State Management
excerpt: This module addresses more complex state management scenarios in React applications. We begin by looking at the limitations of passing state through many layers of components (the prop drilling problem) and how React's built-in Context API can help share state globally without prop drilling.
category: Modules
tags:
  - react
  - state-management
  - context
  - redux
  - zustand
  - xstate
---

# Module 2: Advanced State Management

## Overview

This module addresses more complex state management scenarios in React applications. We begin by looking at the limitations of passing state through many layers of components (the **prop drilling** problem) and how React's built-in **Context API** can help share state globally without prop drilling. We then explore state management libraries that handle global state outside of React components, such as **Redux** (a popular but boilerplate-heavy solution) and **Zustand** (a lightweight state library). We also introduce the concept of **state machines** via **XState**, which can manage complex state transitions in a predictable way. By the end of this module, you'll understand when and how to use these advanced state tools to manage application-wide data and complex state logic.

## Reading List

### Required Reading

* **Full Stack Open – State Management with Redux (Part 6 Intro):** Read the beginning of Part 6 in Full Stack Open, which explains moving state logic out of React components as applications grow and introduces Redux. It also covers React's Context and the `useReducer` hook, as well as mentions React Query (we will focus on React Query in a later module). This gives a conceptual overview of why external state management is needed.
  - [https://fullstackopen.com/en/part6](https://fullstackopen.com/en/part6)

* **React Documentation – Context:** Read the official docs on React's Context API to learn how to create a context, provide values, and consume them in components. Focus especially on examples of avoiding prop drilling by using `React.createContext` and the `useContext` hook.
  - [https://react.dev/reference/react/createContext](https://react.dev/reference/react/createContext)
  - [https://react.dev/reference/react/useContext](https://react.dev/reference/react/useContext)

* **Zustand Documentation (pmndrs/zustand):** Zustand is a minimal state management library. Skim the README on the Zustand GitHub (or zustand docs site) to see how to create a global store and use it in components. Notice how it uses hooks to access state without the boilerplate of Redux. This will prepare you for implementing a simple global state store.
  - [https://github.com/pmndrs/zustand](https://github.com/pmndrs/zustand)

* **Redux Official Docs (Redux Toolkit):** If you haven't seen Redux before, read through the official Redux Toolkit quick-start guide. Redux Toolkit is the modern way to write Redux logic with less boilerplate. Understand concepts of a store, actions, and reducers. (Even if we don't implement Redux fully, it's useful to know how it structures state management).
  - [https://redux-toolkit.js.org/tutorials/quick-start](https://redux-toolkit.js.org/tutorials/quick-start)

### Additional Resources

* **(Optional) XState and State Machines:** Read *"XState in React: Look Ma, no useState or useEffect!"*, a blog post that motivates using state machines for complex component logic. It explains the drawbacks of using only `useState`/`useEffect` for intricate states and how XState can make state transitions clearer. Optionally, also browse the official XState documentation on stately.ai to see basic concepts (states, events, transitions) and React integration (`useMachine` hook). This is an advanced topic, so focus on the high-level idea that state can be formalized as a state machine.
  - [https://xstate.js.org/docs/](https://xstate.js.org/docs/)

## Exercises

### Exercise 1: Refactor to Context

Take a React application with deeply nested components and refactor it to use React Context for state sharing. For instance, imagine an app where a top-level component holds a piece of state (like a user object or theme setting) and several nested child components need that data. Originally, this would be passed through multiple props (prop drilling). You will remove the intermediate props by using Context.

**Steps:**

1. Identify a piece of data in your app that is needed by multiple distant components (e.g., a user's login status or current language setting). In your main component, create a Context with `React.createContext`.

2. Wrap your component tree with a Context Provider (`<MyContext.Provider>`) at a high level, supplying the value (state) and maybe an updater function as the context value.

3. In the components that need the data, replace any prop usage with `useContext(MyContext)` to read the value from context. Remove the now-unnecessary prop drilling from parent components – they no longer need to pass this data down explicitly.

4. Verify that the consumer components still function and display the context-provided data. Change the context value (for example, toggle the user login state or switch the theme) and ensure all consuming components reflect the change. This exercise demonstrates how Context can simplify state access across the component tree.

### Exercise 2: Global State with Zustand

Implement a simple global state store using **Zustand** to manage application state outside of React's Context. For example, create a global counter or a todo list that any component can read/update without prop drilling.

**Steps:**

1. Install Zustand (`npm install zustand`). In a separate file (e.g., `useStore.js`), create a Zustand store. For a counter, you can use `create()` to define state (e.g., `{ count: 0 }`) and actions to modify it (e.g., `increase: (by) => set((state) => ({ count: state.count + by }))`).

2. In your components, use the store's hook to access state. For example, `const count = useStore(state => state.count)` to read the count, and `const increase = useStore(state => state.increase)` to get the action.

3. Render the global state value in one component (e.g., show the `count` in a `<span>`), and provide a button in another component that calls the `increase` action. Because it's the same store, clicking the button in one component should update the count shown in the other component.

4. Test that your Zustand store updates cause React to re-render the components with the new state. This demonstrates an alternative to Context for state management that can be more convenient for larger apps. You'll notice there's no boilerplate of actions or reducers as in Redux – Zustand allows direct mutation of state under the hood, but in a predictable way.

## Additional Exercise (Optional)

**State Machine with XState:** For a more challenging task, try modeling a simple process as a state machine using XState. For example, create a toggling feature or a multi-step form and manage its state with XState instead of multiple `useState` calls.

**Steps:**

1. Install XState and the XState React integration (`npm install xstate @xstate/react`).

2. Define a state machine in a separate module (e.g., using `createMachine`). For a toggle, the machine might have two states: `"off"` and `"on"`, with an event `"TOGGLE"` that transitions between states. Use XState's syntax to define states and transitions.

3. Use the `useMachine` hook from `@xstate/react` to run this machine in a component. It will give you the current state and a `send` function to send events.

4. In your component's UI, display the current state (e.g., "The light is ON" or "OFF"), and have a button that triggers `send('TOGGLE')` on click. The machine will handle switching the state.

5. Observe how the logic for state transitions is now encapsulated in the machine definition, making it explicit and avoiding ad-hoc boolean state variables. This exercise is optional and meant to expose you to state machines. It can lead to more structured state handling for complex scenarios (like multi-step workflows, animated sequences, etc.) but has a learning curve. Even if you don't implement XState in projects, understanding it will broaden your perspective on state management.

## Summary

* **Prop Drilling vs Context:** Prop drilling (passing state down through many levels of components) is cumbersome and can make code hard to maintain. React's Context API provides a way to **share state globally** without threading props through every level. Context is great for things like theme, user info, or any data that many components need. However, overusing context for everything can be anti-pattern; use it when prop passing becomes problematic.

* **Redux and Zustand:** As apps grow, keeping all state in React components can become complex. **Redux** was a popular solution to manage global state in a single store, enforcing unidirectional data flow and immutability. It's powerful for large applications but introduces boilerplate (actions, reducers). **Zustand**, on the other hand, offers a simpler hook-based global store with less ceremony. Both aim to handle state outside of the component tree so that any component can access or update global state directly.

* **When to use what:** For simple needs, React's built-in tools (`useState`, Context, `useReducer`) are often enough. Redux might be used in large apps where a predictable structure and dev tools are needed, whereas Zustand is a lightweight alternative for smaller to medium apps that need shared state without the overhead. It's important to choose the right tool based on the app complexity.

* **State Machines (XState):** For complex interactive logic (like workflows, animations, or complex component states), **state machines** provide a structured approach. XState allows you to define explicit states and transitions, which can make such logic easier to understand and less error-prone. While not every app needs state machines, they are valuable for specific cases (e.g., multi-step forms with many conditional states).

* In summary, advanced state management is about organizing state updates and data sharing in a scalable way. This module teaches you to avoid common pitfalls (like prop drilling or excessive lifting of state) by leveraging Context and external state libraries. It also encourages thinking in terms of state structure (even as a state machine) for more complex scenarios.
