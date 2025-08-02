---
publishDate: 2025-01-29T00:00:00Z
title: Module 3 - Forms and Side Effects (UseEffect)
excerpt: This module focuses on handling user input and side effects in React. Building forms is a critical part of web applications, and here you will learn how to manage form input state and submission in React. We cover controlled components and how to update state based on user typing. We also introduce the concept of side effects in React via the useEffect hook.
category: Modules
tags:
  - react
  - forms
  - useEffect
  - side-effects
  - validation
  - zod
---

# Module 3: Forms and Side Effects (UseEffect)

## Overview

This module focuses on handling user input and side effects in React. Building **forms** is a critical part of web applications, and here you will learn how to manage form input state and submission in React. We cover **controlled components** (where form inputs derive their values from React state) and how to update state based on user typing. We also introduce the concept of **side effects** in React via the `useEffect` hook – for example, performing data fetching or other actions in response to component lifecycle events. This module will improve the user experience (UX) for form handling, including input validation (with a brief look at using **Zod** for schema validation), and ensure you understand how to safely incorporate side effects (like fetching data or interacting with browser APIs) in your React components.

## Reading List

### Required Reading

* **Full Stack Open – Forms (Part 2b):** Read the section on Forms in Part 2 of Full Stack Open. This introduces how to add form elements in React, handle form submission events (e.g., using `event.preventDefault()` to stop page reload), and manage form input with React state (turning inputs into *controlled components*). It provides examples of adding inputs and updating state on each keystroke via `onChange`.
  - [https://fullstackopen.com/en/part2/forms](https://fullstackopen.com/en/part2/forms)

* **Full Stack Open – Getting Data from Server (Part 2c):** This reading will show the use of **effect hooks** for performing data fetching. It demonstrates how `useEffect` is used to fetch initial data from a server (using `fetch` or Axios) and the importance of the dependency array to control when the effect runs. Pay attention to how the example loads notes from a server and updates the state once the data is retrieved, as well as the explanation of empty `[]` dependency meaning "run once on mount."
  - [https://fullstackopen.com/en/part2/getting_data_from_server](https://fullstackopen.com/en/part2/getting_data_from_server)

* **React Documentation – Forms:** Review the official React docs on forms (for example, the **legacy React Forms** page or the new React.dev guide on the `<form>` element). This will reinforce controlled vs uncontrolled components and best practices like keeping component state in sync with input values. Key point: in React, form data is usually handled by the component state to keep one source of truth.
  - [https://react.dev/reference/react-dom/components/form](https://react.dev/reference/react-dom/components/form)

* **React Documentation – useEffect:** Read the React docs on the Effect Hook to understand how and when to use `useEffect`. Focus on typical use cases: fetching data on component mount, setting up subscriptions or timers, and cleaning up in the effect's cleanup function. The docs also explain how dependencies work – make sure you grasp why we include certain variables in the dependency array.
  - [https://react.dev/reference/react/useEffect](https://react.dev/reference/react/useEffect)

### Additional Resources

* **(Optional) Zod – Schema Validation:** If you want to improve form reliability, read the **Zod** library introduction. Zod is a TypeScript-first schema validation library that can also be used in plain JS. It lets you define a schema for your form data and then validate user input against it, providing helpful error messages. This is optional, but it's a modern way to validate forms (often used alongside form libraries like React Hook Form).
  - [https://zod.dev/](https://zod.dev/)

* **(Optional) Error Boundaries:** Glance at the concept of Error Boundaries in React (see the React docs "Error Boundaries" page). While not directly related to forms, understanding error boundaries will help you handle any runtime errors in your components (for example, an error during form submission) more gracefully by showing a fallback UI instead of crashing the app. This is an advanced topic; just be aware it exists and is useful for catching errors.
  - [https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

## Exercises

### Exercise 1: Controlled Form & Validation

Build a simple form in React to practice managing form state and basic validation. For example, create a **contact form** with fields like Name and Email, or a **feedback form** with a message textarea. Make sure to handle input changes and form submission.

**Steps:**

1. Set up a new component `ContactForm` with `<form>` markup containing several inputs (text inputs for name, email, etc. and maybe a `<textarea>`). For each form field, use the `useState` hook to create a state variable (e.g., `name`, `email`, `message`) and an `onChange` handler that updates that state as the user types. Each input's `value` attribute should be tied to its state variable (making it a controlled component).

2. Implement a submit handler for the form (`onSubmit` on the `<form>` element). In this handler, prevent the default browser refresh using `event.preventDefault()`. For now, have it simply log the collected state (or display it on the page) to verify that your state is capturing the user's input.

3. Add basic validation: for example, ensure the Name isn't empty and the Email has an "@" character. You can check this in the submit handler – if a field is invalid, set an error message in state and display it (e.g., "Email is required"). Keep the validation simple (we're not using Zod just yet unless you want to).

4. Test your form in the browser. Try typing into the fields and submit. Verify that the state updates as expected (you can `console.log` the state on each change or use React DevTools). Also test the validation by submitting empty or incorrect data and confirm that your error messages show up instead of proceeding. This exercise reinforces the concept of controlled inputs and form submission handling in React.

### Exercise 2: Using useEffect for Data Fetching

Practice using the `useEffect` hook by fetching data when a component mounts and cleaning up afterward. For example, create a component `RandomUser` that fetches a random user profile from an API when it loads, and displays the user's name and picture.

**Steps:**

1. In the `RandomUser` component, initialize a piece of state to hold the fetched data (e.g., `user` object) and another for loading status or errors if desired.

2. Use `useEffect` to perform the fetch on component mount. (Hint: provide an empty dependency array `[]` so it runs only once on mount.) Inside the effect, call `fetch('https://api.randomuser.me/')` (or another public API of your choice), then process the response with `.then` or `await` to get JSON data. Store the data in your state using the state setter. Also handle any errors by catching and perhaps setting an error state.

3. While the fetch is in progress, you can show a "Loading…" message (based on a loading state variable). Once the data is loaded, display the information (for example, the person's name and photo from the randomuser API result).

4. Implement cleanup if necessary. For a fetch request, there might not be much to clean up, but if you were using something like `setInterval` or a subscription inside `useEffect`, you would return a cleanup function to clear it. In this fetch example, ensure you avoid setting state if the component is unmounted before the fetch completes (this can be done by tracking an abort controller or a mounted flag – this is an extra detail for robustness).

5. Test the component by mounting it in your app. You should see the loading message then the fetched user data appear. Try unmounting the component (if possible) to see if any errors occur (there shouldn't be if cleanup is handled or if the fetch completes quickly). This exercise demonstrates how to safely integrate side effects (like data fetching) into React components using `useEffect`. It's a foundation for working with real APIs in your apps.

## Additional Exercise (Optional)

**Form Validation with Zod:** If you want to extend your form from exercise 1 with more robust validation, try using Zod to define a schema and validate the form data.

**Steps:**

1. Install Zod (`npm install zod`). In your form component file, define a Zod schema for your form, e.g., `const schema = z.object({ name: z.string().min(1), email: z.string().email(), message: z.string().min(5) })`. This schema enforces: name is non-empty, email is a valid email format, message has at least 5 characters (adjust rules as needed for your form).

2. In the form submit handler, instead of manual checks, use `schema.safeParse(formData)` where `formData` is an object with the values from state. Zod will return either success with parsed data or an error with details.

3. If the validation fails, take the Zod error (which contains which field failed and why) and display appropriate messages next to the form fields. If it succeeds, you can proceed to "submit" the data (for now, maybe just log it or reset the form).

4. This exercise will show how a library like Zod can simplify validation logic by declaring expected shapes of data. It's especially useful as apps grow or when using TypeScript.

**Bonus (optional):** For a real challenge, integrate your form with a library like **React Hook Form** which works well with Zod. React Hook Form will manage form state and can use your Zod schema for validation. This bonus goes beyond our syllabus, but it's a common stack in industry for form heavy applications.

## Summary

* **Controlled Components:** In React, form inputs (like `<input>`, `<textarea>`, `<select>`) are often implemented as *controlled components*. This means the input's value is controlled by React state. You provide a `value` prop and an `onChange` handler that updates state, rather than letting the DOM manage the form data. This gives you full control over the form and makes it easier to enforce validations and respond to user input in real time. The trade-off is you must write the logic to sync state and input, but it leads to a single source of truth for the input value.

* **Form Submission:** By handling the form's `onSubmit` event (and calling `event.preventDefault()`), you can intercept the form submission and do custom actions (like send data via AJAX instead of a page reload). This is the basis for creating a smooth single-page app user experience where form submissions happen in the background.

* **Validation:** Always validate important form inputs. Basic checks (required fields, correct format for emails, etc.) can be done in JavaScript before sending data to a server. Libraries like **Zod** provide an elegant way to define validation rules and get detailed error messages. Validation can be done on form submit or even live as the user types (for a dynamic UX).

* **useEffect and Side Effects:** Not all logic in React is about rendering JSX – sometimes you need to interact with the outside world (e.g., fetch data, set up a timer, or directly manipulate the DOM). These are called *side effects*. The `useEffect` hook lets you perform side effects in function components at the right times. For example, you can fetch data when the component mounts (by using an empty dependency array in `useEffect` to run it once), or re-run an effect when some state changes (by listing that state in the dependencies). Always clean up effects that allocate resources (like subscriptions or event listeners) by returning a cleanup function from `useEffect`.

* **Effect Timing:** Remember that `useEffect` runs after the component renders to the DOM. If you need to ensure an effect runs *before* a certain browser paint or to block the UI, those are advanced cases (e.g., useLayoutEffect or Suspense). For most cases, `useEffect` is appropriate and you should avoid heavy blocking work in it.

* **Error Handling:** While building forms and effects, you might encounter runtime errors (for example, trying to access a property of `undefined` if a fetch returns unexpected data). In production, we don't want the entire app to break due to an error in one component. **Error Boundaries** are React's solution to catch JavaScript errors in components. They are implemented using a special kind of React component (class components with lifecycle methods or the `react-error-boundary` library for functional approach). Error boundaries will display a fallback UI instead of the broken component tree. It's good to be aware of this concept as your apps grow – you might wrap sections of your app with an error boundary to prevent a form error from crashing the whole page.

* In summary, this module taught you how to handle user input robustly with controlled form components and manage side effects like data loading. Mastering these will enable you to build interactive and dynamic applications where users can input and retrieve data seamlessly.
