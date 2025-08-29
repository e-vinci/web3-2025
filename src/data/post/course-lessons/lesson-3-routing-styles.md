---
title: 'Lesson 3 – Navigation and style'
description: 'Going from a technical proof of concept to an application a user may want to use'
publishDate: 2025-01-15T00:00:00Z
excerpt: 'Going from a technical proof of concept to an application a user may want to use.'
tags:
  - react
  - typescript
  - shadcn
  - tailwind
  - course
  - web3-2025
category: 'course-lesson'
---

## Introduction

We've done a good job last week to get all parts of a modern application working - front end, API and database - we even deployed it.

Now let's be honest, looking at our screen, this looks more like a technical proof of concept than something any real users may want to use - let alone may for:

![Basic App](../../../assets/images/basic-app.png)

Our goal this week is to transform this into something that's _usable_. That means a lot of work on the front end.

> From the trenches: User Experience (UX) is critical. Website design has improved a lot the last 10 years, especially in the B2C area. Users expect clean interfaces with clear actions and fast feedback. Not delivering those will hurt any business - well, [almost](https://brussels.craigslist.org/).

Don't forget to commit regularly & to push on render - an application that's not deployed is not generating any value.

## Setup

- Get [last week's solution](https://github.com/e-vinci/web3-2025/tree/main/exercises/lesson-2-deploy-and-persistence) as a starting point for this exercise. You can also work from your own code (assuming you got it working), but you may need to adapt a bit the instructions.

## Recommended Reading

- [React Router (Official Docs)](https://reactrouter.com/)
- [Working with Browser history (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Window/history)
- [Tailwind concepts (Official Docs)](https://tailwindcss.com/docs/styling-with-utility-classes)
- [Shad CN (Official Docs)](https://ui.shadcn.com/)

## Exercises

### 1. Split the app

As a first step we're going to split our current `Home` page into three separated ones:

- `Welcome` will show an introduction text to our app
- `List` will show the list of expenses
- `Add` will show the form to add a new expense.

As a first step, create all three pages as separated file with a simple text output allowing to see if we're on the proper page. Leave the content in `Home` for now.

In order to be able to navigate, we're going to create a `currentPage` state in the `App`:

````tsx
const [currentPage, setCurrentPage] = useState<string>("Welcome");
````

We're going to use that value to be able to show the proper page:

````tsx
if(currentPage == "Welcome") {
    return <Welcome setCurrentPage={setCurrentPage}/>
}
...
````

We need to pass the prop in order to be able to update the current page from our component. We're using tsx, so make sure to type your props properly.

In the `Welcome` page, add two buttons to navigate to `List` and `Add`:

````tsx
<button onClick={ setCurrentPage("Add")}>View Expense List/>
````

> **&#10067; Would it not be better to use something like React Router for this?** Indeed - and we're going to. But doing some things manually can help understand how the librairies are working so it's a good step. We alway may not always want to add a full library for a simple task we can do in a few lines of code.

Check that you are able to navigate from Welcome to your other pages. Add a "back" button on those going back to `Welcome` when clicked.

### 2. Better routing with context, history and a small JavaScript object

This works but has several flaws:

- We'll need to pass `setCurrent` page manually to any new page
- The if/else code in `App` is ugly
- The url is not changing when we move from page to page

Let's solve this.

When we have data that is useful to a lot of components, passing by props become a hassle - especially if you need to pass those props deep down into components.

React default mechanism to solve this is a Context - a piece of data that is set somewhere high in the component hierarchy and can then be used anywhere "below" it.

Let's create our PageContext in the App.tsx file but *outside* of the `App` function:

````jsx
export const PageContext = createContext<{
    currentPage: string;
    setCurrentPage: (page: string) => void;
}>()
````

Our context will contain two values - a currentPage as a string and a setCurrentPage as a function taking a string in and returning nothing.

We can now return our different pages wrapped in the context:

````tsx
if (currentPage == "Welcome") {
    return (
        <PageContext.Provider value={{ currentPage, setCurrentPage: handlePageChange }}>
        <Welcome />
        </PageContext.Provider>
    )
}
// if ...
````

With this done we can remove the "setCurrentPage" props from our pages - instead we'll get this via the context:

````jsx
export default function Welcome() {
    const { setCurrentPage } = useContext(PageContext);
    return <>
        Welcome to the Expense Tracker
        <button onClick={() => setCurrentPage("List")}>View Expenses</button>
        <button onClick={() => setCurrentPage("Add")}>Add Expense</button>
    </>
}
````

This is a very common technique in react to share a common state in many components. Don't overuse it, but it's generally the logical step once you start having too many drill down props.

Let's refactor our big `App` `if` now - we have three pages and we want to go to the one whose name fits the currentPage value. This looks like an "associative array" is something like a Java Map - or in JavaScript a simple object:

````jsx
const pages: { [key: string]: React.FunctionComponent } = {
  "Welcome": Welcome,
  "List": List,
  "Add": Add
}
````

With this we can replace our if part with:

````jsx
const CurrentPageComponent = pages[currentPage];

  return (
    <PageContext.Provider value={{ currentPage, setCurrentPage: handlePageChange }}>
      <CurrentPageComponent />
    </PageContext.Provider>
  );
````

Some explanations are needed here - how can this work?

First of all, jsx component are just JavaScript functions ie:

<Welcome />

is the same as calling the `Welcome()` function.

Second, JavaScript functions are values like any other - they can be assigned to variables or as we do here set into an object.

To finish our half backed implementation of React Router, we should update the url when we change page - there is a JavaScript api for that on the window.history object:

````js
window.history.replaceState(null, page, `/${page.toLowerCase()}`);
````

Question is - where to put that code? We want to update the url each time we change page, which means in the setCurrentPage function - but that's not possible as that function is generated by the useState hook.

Let's create a new function `handlePageChange`

````js
  function handlePageChange(page: string) {
    window.history.replaceState(null, page, `/${page.toLowerCase()}`);
    setCurrentPage(page);
  }
````

That were the context Provider helps - we now have a single place where we give the "setCurrentPage" function to all our pages - as the handlePageChange function has the same signature (it takes a string as argument and return nothing), we can simply switch it:

````jsx
<PageContext.Provider value={{ currentPage, setCurrentPage: handlePageChange }}>
      <CurrentPageComponent />
</PageContext.Provider>
````

In other words - we give the handlePageChange function as the value for the setCurrentPage property in the context.

This is a common pattern in React too - wrapping useState based method with additional behavior.

Check that everything is still working, commit and deploy your code - congratulation, you've implemented a basic routing feature using standard React capabilities.

When you'll be using React Router (or another routing library), remember that while it's much more advanced that what we did here, it uses the same mechanisms.

You can see the related code in React Router [here](https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/context.ts#L112)

### 3. Best routing with a library

> From the trenches: Libaries are there for cross concerns - vs specific code/logic

- Implement React Router
- Layout, Outlet and OutletContext

### 4. Sharing state again

- Fake user (we'll use a real in the Auth session)
- Context to pass it everywhere


### 5. Styling with tailwind

- Many options (CSS, direct styles, CSS-in-JS, ...)
- Tailwind (divisive) approach
- Let's create components
  - A button ?
- Styling everything

### 5. Adding a library

- Installing Shad
- Why a library?
- Shad approach
- Selecting components

### 6. Using components

- Navbar
- Footer
- Table
- Forms
  - Components, errors, etc
- Toast for feedback

---

## Optional Challenges

- Compute what everyone owes (based on expenses from 5 people, can give a json file with the data)

---

## The PR

### Content

New screen with data

- Link "manual"
- use data not from context
- ???