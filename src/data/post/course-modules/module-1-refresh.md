---
publishDate: 2025-01-15T00:00:00Z
title: Module 1 - React Basics Recap
excerpt: In this introductory module, we recap essential React concepts that students should already be familiar with from previous coursework. We will cover how React components work and how they help structure UIs, the role of props to pass data into components, and the basics of managing internal state with hooks like useState.
category: Modules
tags:
  - react
  - components
  - props
  - state
  - hooks
---

# Module 1: React Basics Recap

## Overview

In this introductory module, we recap essential React concepts that students should already be familiar with from previous coursework.
We will cover how React **components** work and how they help structure UIs, the role of **props** to pass data into components, and the basics of managing internal **state** with hooks like `useState`. The module also touches on how to apply styles in React (including a brief mention of styled-components as an optional approach). This refresher ensures everyone is up to speed on React fundamentals before moving to advanced topics.

## Reading List

### Required Reading

- **Full Stack Open – Fundamentals of Web Apps:** Review the prerequisite material on how web applications work (HTTP, DOM, etc.). This will reinforce your understanding of the web basics that React builds upon.

  - [https://fullstackopen.com/en/part0](https://fullstackopen.com/en/part0)

- **Full Stack Open – Introduction to React:** Read the introduction to React to revisit how to create a React app and core concepts of components and rendering. This includes setting up a project (using a tool like Vite), creating simple components, and understanding JSX.

  - [https://fullstackopen.com/en/part1](https://fullstackopen.com/en/part1)

- **React Official Docs – Components and Props:** Read the React documentation on components and props for a concise explanation of how to define components and pass data to them (official guide on **Your First Component** and **Passing Props**). This solidifies the concept of reusability and data flow in React.
  - [https://react.dev/learn/your-first-component](https://react.dev/learn/your-first-component)
  - [https://react.dev/learn/passing-props-to-a-component](https://react.dev/learn/passing-props-to-a-component)

### Additional Resources

- **(Optional) Styled-Components Basics:** If you're interested in modern CSS-in-JS, read the introductory guide from the Styled-Components documentation on how to define styled React components. This is optional and demonstrates an alternative to traditional CSS for styling React apps.
  - [https://styled-components.com/docs/basics](https://styled-components.com/docs/basics)

## Exercises

### Exercise 1: Basic Components and Props

Create a new React application (use Vite or Create React App) and build a simple component hierarchy to practice props.

**Steps:**

1. Initialize a React project with Vite.js and use the React template:  
   `npm create vite@latest module_1 -- --template react`.

2. Create a functional component `Greeting` that accepts a prop (e.g. `name`) and displays a message like "Hello, {name}!".

- **Specify the type for the props** using a TypeScript interface.
- Set a **default value** for the `name` prop (e.g. default to "Everyone" if no name is provided).
- Store this component in its own file under `src/components/Greeting.tsx`.

3. In your main `App` component, render `<Greeting name="World" />` (and try a few different values for the prop, including omitting it to see the default).

4. Verify that the greeting component correctly displays the passed prop or the default value. This exercise reinforces creating components, typing props, setting default values, and passing props down the tree.

### Exercise 2: State and Event Handling

Since the Vite React template already includes a counter component, let's extract it into a proper reusable component with enhanced functionality.

**Steps:**

1. Create a new file `src/components/Counter.tsx` and extract the counter logic from the default App component.

2. Define a TypeScript interface for the Counter component props:

```typescript
interface CounterProps {
  initialValue?: number;
}
```

3. Move the counter state logic (`useState` hook) into your Counter component, using the `initialValue` prop as the starting value (default to 0 if not provided).

4. Implement three buttons in your Counter component:

- **Increment button** (`+`) - increases the count by 1
- **Decrement button** (`-`) - decreases the count by 1
- **Reset button** - resets the count back to the initial value

5. Display the current count value prominently in the UI.

6. In your main `App` component, import and render `<Counter />` with different initial values (e.g., `<Counter initialValue={5} />`) to test the prop functionality.

7. Test all three buttons work correctly and use React Developer Tools to observe state changes. Verify that the reset button returns to the initial value, not just zero.

## Additional Exercise (Optional)

**Styled Components Practice** – Take one of the components you created and apply custom CSS styling using styled-components.

**Steps:**

1. Install the Styled-Components library (`npm install styled-components`).
2. Create a styled component, for example: `const FancyButton = styled.button` with some CSS styles, and use it in place of a normal `<button>` tag.
3. Update your component to use this `FancyButton` and confirm the styles appear. Experiment by changing styles (like colors, padding) and observe live reload.

This optional exercise helps you get exposure to styling React components using a CSS-in-JS approach, complementing the basic CSS styling you already know.

## Summary

- React apps are built from **components** – reusable pieces of UI defined as functions (or classes) that return JSX. Each component can be thought of as a custom HTML element that may contain its own structure and logic.

- **Props** are inputs to components, allowing parent components to pass data to children. Props flow one way (top-down), and they are read-only in the child component receiving them. This is how we configure or differentiate component instances.

- Components can hold internal **state** (using hooks like `useState`). State is data managed within a component that, when changed, causes the component to re-render. Using state, components can remember information between renders and create interactive UIs.

- We typically update state in response to user **events** (like clicks or form inputs). React's event handling uses synthetic events (e.g., `onClick`, `onChange`) that wrap native browser events. By updating state in event handlers, we make the UI respond dynamically (e.g., counters increment, form text updates as you type).

- Styling in React can be done with regular CSS or more advanced techniques. You can use global or modular CSS files, or libraries like **Styled-Components** to write CSS in JavaScript. While styling is not the primary focus of this module, remember that clean and consistent styling will improve your UI's appearance.
