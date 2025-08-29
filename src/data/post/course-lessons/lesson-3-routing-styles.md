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

Our goal this week is to transform this into something that's *usable*. That means a lot of work on the front end.

> From the trenches: 

## Setup

- Get [last week's solution](https://github.com/e-vinci/web3-2025/tree/main/exercises/lesson-2-deploy-and-persistence) as a starting point for this exercise. You can also work from your own code (assuming you got it working), but you may need to adapt a bit the instructions.

## Recommended Reading

- [React Router (Official Docs)](https://reactrouter.com/)
- [Tailwind concepts (Official Docs)](https://tailwindcss.com/docs/styling-with-utility-classes)
- [Shad CN (Official Docs)](https://ui.shadcn.com/)

## Exercises

### 1. Routing basics

- Split the current App in home, expenses, add expense
- Start with home, use NavLink between the pages

### 2. Layout and navigation

- Add a navbar and a footer
- Use a layout to stop replicating the code

### 3. Sharing state

- Fake user (we'll use a real in the Auth session)
- Context to pass it everywhere

### 4. Styling with tailwind

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