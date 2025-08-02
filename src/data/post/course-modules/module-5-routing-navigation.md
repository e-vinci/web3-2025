---
publishDate: 2025-02-12T00:00:00Z
title: Module 5 - Routing and Navigation
excerpt: This module is about structuring your web application into multiple pages or views and managing navigation between them. In a single-page React app without routing, all components render on one screen and it becomes unwieldy to show/hide parts of the UI manually. We will solve this by introducing client-side routing.
category: Modules
tags:
  - react
  - routing
  - navigation
  - tanstack-router
  - react-router
  - code-splitting
  - suspense
---

# Module 5: Routing and Navigation

## Overview

This module is about structuring your web application into multiple pages or views and managing navigation between them. In a single-page React app without routing, all components render on one screen and it becomes unwieldy to show/hide parts of the UI manually. We will solve this by introducing **client-side routing**. You'll learn how to define multiple "pages" in your React app using a router library (we will use **TanStack Router**, an advanced routing solution, similar to React Router). Each page will have its own URL path, enabling better UX: users can bookmark or share links to specific pages, and the browser's back/forward buttons will work as expected. We will also cover protected routes (making certain pages accessible only under conditions, e.g. user logged in) and discuss code-splitting using **React.lazy/Suspense** for loading page components on demand (the "Suspenders" note hints at using Suspense). By the end of this module, you will be able to create a multi-page app that feels like a traditional website (with distinct URLs) but without full page reloads between pages.

## Reading List

### Required Reading

* **Full Stack Open – Single Page Application vs Multi-page (Part 7 intro):** Read the beginning of Part 7 in Full Stack Open that explains how an SPA can simulate multiple pages. It describes a basic approach to navigation by conditional rendering and why this approach has limitations (e.g., URL doesn't change, back button doesn't work). This sets the stage for why we need a dedicated router.
  - [https://fullstackopen.com/en/part7](https://fullstackopen.com/en/part7)

* **Full Stack Open – React Router section (Part 7):** Continue in the FS Open material to the section introducing React Router. It shows how to install React Router, define routes, and use the `<Link>` component for navigation. Even though we might use TanStack Router in our course, the concepts are similar. Pay attention to how each route corresponds to a component and how the router uses the HTML5 History API to avoid reloads.
  - [https://fullstackopen.com/en/part7/react_router](https://fullstackopen.com/en/part7/react_router)

* **TanStack Router Documentation – Quick Start:** Go through the TanStack Router quick start guide. TanStack Router is a newer routing library that offers robust features (type safety, built-in data fetching, etc.). Learn how to define a router configuration, create route components, and perform navigation (e.g., via links or imperative navigation). Note how it compares to React Router – conceptually, both provide a Router provider, route definitions, link components, etc.
  - [https://tanstack.com/router/latest/docs/framework/react/quick-start](https://tanstack.com/router/latest/docs/framework/react/quick-start)

* **React Official Docs – Code-Splitting with React.lazy:** Read about code-splitting in the React docs or a tutorial on using `React.lazy` and `<Suspense>`. This will show you how to dynamically import page components so that they are only loaded when needed. This is important for performance: in a multi-page app, you don't want to load code for all pages on the first load. Suspense will let you display a fallback (like a loading spinner) while the code for a page is being fetched.
  - [https://react.dev/reference/react/lazy](https://react.dev/reference/react/lazy)
  - [https://react.dev/reference/react/Suspense](https://react.dev/reference/react/Suspense)

### Additional Resources

* **(Optional) LogRocket Blog – Suspense for Data Fetching:** To understand the "Suspenders" hint, you might read a blog post on using React Suspense for data fetching (though note: as of React 18, suspense for data fetching is mostly used with frameworks or experimental APIs). This is optional; the core idea is that Suspense can also be used to pause rendering until some async data is ready, not just for code splitting.
  - [https://blog.logrocket.com/react-suspense-data-fetching/](https://blog.logrocket.com/react-suspense-data-fetching/)

* **(Optional) Authentication & Protected Routes:** If you're interested in how to limit page access, read a tutorial on implementing protected routes either with React Router or TanStack Router. This usually involves checking some auth state and either allowing access or redirecting to a login page. We won't dive deep into auth in this module, but the concept of conditionally rendering routes based on state is something we'll practice.

## Exercises

### Exercise 1: Basic Routing Setup

Take a React application and introduce multiple pages using TanStack Router (or React Router if more comfortable). Create at least 2-3 distinct pages and enable navigation between them without full reloads.

**Steps:**

1. Install TanStack Router (`npm install @tanstack/react-router`) and any required dependencies (it might also need `react-router-dom` types or others – follow the docs). Alternatively, if using React Router: `npm install react-router-dom@6`.

2. Define some page components, for example: `HomePage`, `AboutPage`, `DashboardPage` (they can be simple, e.g., each just displays a heading indicating which page it is).

3. Set up the Router in your app entry. For TanStack Router, you would create a router configuration with route objects mapping paths to components, then wrap your app in `<RouterProvider router={router}>`. For React Router, you would use `<BrowserRouter>` and `<Routes><Route path="..." element={<Page/>}/></Routes>`.

4. Add navigation links. In TanStack Router, you can use `<Link to="/about">About</Link>` (similar to React Router's `<Link>`). Place a navigation menu or simple links in your app so the user can click to navigate.

5. Ensure that clicking links changes the content *without* a full page refresh and updates the URL in the address bar. Also try using the browser back and forward buttons to navigate between your new routes – it should work correctly (the app should show the appropriate page for the URL).

6. Test direct linking: manually enter one of your route URLs in the browser or refresh the page on a route. The app should load directly to that page (this typically requires your development server to handle client-side routing – if using Vite or Create React App, it usually does, but be aware in production you need to configure the server to serve index.html for unknown routes).

Congratulations, you've created a multi-page SPA! This exercise demonstrates the basics of client-side routing which greatly improves structuring your app.

### Exercise 2: Protected Route & Conditional Navigation

Implement a simple authorization check for one of your routes. For instance, have a mock login state that, when false, prevents access to a "Profile" or "Dashboard" page.

**Steps:**

1. Create a piece of state in a context or at a higher level (e.g., `isLoggedIn` in a context or Redux store, or even a Zustand store from earlier). Provide a way to toggle this state (perhaps a "Login" button that simply sets `isLoggedIn = true` to simulate a login, and a "Logout" to set it false). In a real app, this would be tied to authentication logic, but here we'll mock it.

2. In your router configuration, identify a route that should be protected (say `/dashboard`). Implement a check so that if `isLoggedIn` is false, the route will not render the Dashboard component but instead redirect or render a fallback (like a message or navigate to a `/login` page). In React Router, this is often done by wrapping routes in a component that checks auth; in TanStack Router, you can use route loaders or wrappers to guard routes. The simplest approach: conditionally render the `<Route>` element tree based on auth state, or inside the Dashboard component, if not logged in, `navigate("/")` away.

3. Add UI indicators: if the user is not logged in, maybe the navigation menu shouldn't show the Dashboard link (or it can show it but clicking it triggers the redirect). Also have a Login button visible when not logged in, and a Logout button when logged in, to toggle the state.

4. Test the behavior: when logged out, attempting to go to the protected route should either redirect you to home or show a "Not authorized" message. After clicking the Login button (which sets `isLoggedIn = true`), you should be able to navigate into the protected page. On logout, if you are currently on the protected page, you might automatically redirect out to a public page (you can implement that effect as well).

This exercise gives you a taste of access control in front-end routing. The actual authentication mechanism (verifying tokens, etc.) is beyond scope, but the routing logic to hide/show routes is an important pattern.

## Additional Exercise (Optional)

**Lazy Loading Pages with Suspense:** Refactor your routing setup to lazy-load at least one of your page components. This means the component code will only be downloaded when the user navigates to that page, which can improve initial load time.

**Steps:**

1. Use `React.lazy()` to wrap the import of a page component. For example: `const AboutPage = React.lazy(() => import('./AboutPage'))`. This will split the bundle at that point.

2. Wherever you render this lazy component (likely in your route definition), you need to surround it with `<Suspense fallback={<div>Loading...</div>}>`. If using React Router, you can wrap the `<Route element={...</Suspense>}>` or place Suspense higher up around your `<Routes>`. With TanStack Router, you may integrate Suspense in how routes load data or code.

3. Test by refreshing the app and navigating to that route – you should see the fallback loading indicator for a brief moment as the chunk is loaded, and then the page appears. Check your network tab in dev tools to confirm that the JS for that page was indeed fetched on demand.

4. Additionally, if you want to experiment with **Suspense for data fetching**, TanStack Router might support an integration where a route waits for data to load before rendering. Alternatively, you can use a simple `useDeferredValue` or similar to simulate delaying a render. This is advanced, so only try if curious.

By doing this optional exercise, you'll learn how to improve your app's performance by not shipping all code to all users upfront. It's especially beneficial if some pages (like an admin dashboard) are not needed for most users initially.

## Summary

* **Single-Page Application (SPA) Navigation:** In an SPA, we don't do full page reloads for navigation. Instead, we use the **History API** to manipulate the URL in the address bar while React swaps out components. This gives the illusion of multiple pages and enables bookmarkable URLs and proper back/forward behavior, all while staying within one HTML page load. Prior to using a router library, one might attempt manual solutions (like conditionally rendering components based on some state and manually using `window.history.pushState`), but this becomes complex. Routing libraries abstract this and provide a declarative way to define the mapping from URL paths to React components.

* **Routing Libraries:** **React Router** has been the go-to solution and is well-documented (you saw how it uses `<BrowserRouter>` and `<Routes>` with nested `<Route>` definitions). **TanStack Router** is a newer alternative that offers enhanced features and integration with data loading. Regardless of which library, the core concept is the same: a **Router** component high in the tree listens to URL changes, and renders the matching page component. Links are provided to change the route without full reload. By using a router, your app's structure becomes clearer – each page has its own component, and you don't mix all page logic in one big component.

* **Multiple Pages & Structure:** With routing, you can also implement nested routes (e.g., a profile page with sub-routes for settings vs overview), which helps in organizing large apps. You learned to create at least a Home and an About page, etc. Each page should ideally be in its own module. This separation of concerns means you can work on one page's code independently of others, and only that code loads when the page is active (especially if you use code-splitting).

* **Protected Routes:** Often, not every page should be accessible to every user (for example, admin pages or personal dashboards). We discussed and practiced how to protect routes by checking authentication state. The main takeaway is that route access can be conditional – you might redirect unauthenticated users away from certain routes. This can be done through router configuration or inside components (though configuration is cleaner). In a real app, you'd tie this with an auth system (checking tokens or context from a login provider).

* **Suspense and Lazy Loading:** We introduced the idea of splitting your code by routes. Using React's lazy loading for components, you can defer loading a page's component code until the user actually navigates there. This improves initial load performance significantly if your app is large. We use `<Suspense>` to handle the asynchronous loading, providing a fallback UI. Suspense will play a bigger role as React's ecosystem evolves (for data fetching, for example), but even just for code-splitting it's very useful.

* **User Experience:** Routing improves UX by not only structuring the app but also by making navigation feel instantaneous (no white screen between page transitions, if done correctly). However, you must ensure to manage scroll restoration (by default, React Router does not always scroll to top on navigation, but can be configured) and focus management for accessibility (making sure focus goes to the top of new content). These are finer details to consider in polished apps.

* **History API:** Under the hood, libraries use the History API's `pushState` and `popstate` events. Understanding that can demystify how routers work. Essentially, when you click a Link, the router calls `pushState` to change the URL and prevents the default anchor behavior. Then it renders the new component. When you hit back, the browser emits a `popstate` event, which the router catches and then renders the appropriate component for the new URL. All of this without the browser doing a full page reload.

* **TanStack Router specifics:** If you used TanStack Router, you might have noticed it has a powerful type-safe route definition and can even fetch data for routes. It's a bit different from React Router but achieves the same end goal. TanStack Router is a good choice for modern React apps, but React Router is also fine – routing is a solved problem; choose the one you're more comfortable with.

* In summary, this module taught you how to split your application into navigable views, greatly improving organization and user experience. You learned to manage client-side routes, link between pages, protect certain pages, and optimize loading of page code. Your app now behaves more like a typical website (with distinct URLs) while still leveraging the speed of a single-page application.
