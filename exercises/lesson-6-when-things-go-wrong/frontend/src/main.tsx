import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import "./index.css";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { requireAuth } from "./lib/requireAuth.ts";
import Layout from "./pages/Layout.tsx";
import Welcome from "./pages/Welcome.tsx";
import Login from "./pages/auth/Login.tsx";
import ExpenseList from "./pages/expenses/ExpenseList.tsx";
import ExpenseShow from "./pages/expenses/ExpenseShow.tsx";
import ExpenseNew from "./pages/expenses/ExpenseNew.tsx";
import { expenseListLoader } from "./pages/expenses/ExpenseList.loader.ts";
import { expenseShowLoader } from "./pages/expenses/ExpenseShow.loader.ts";

const router = createBrowserRouter([
  {
    // A layout route has no path of its own: it only wraps its children.
    Component: Layout,
    children: [
      { index: true, Component: Welcome },
      // Login sits inside the layout but outside the guard: a logged-out
      // visitor has to be able to reach exactly one page.
      { path: "login", Component: Login },
      {
        // Everything nested here needs an account. The middleware runs before
        // any of these loaders, so a logged-out visitor never reaches them.
        middleware: [requireAuth],
        children: [
          { path: "expenses", Component: ExpenseList, loader: expenseListLoader },
          { path: "expenses/new", Component: ExpenseNew },
          { path: "expenses/:id", Component: ExpenseShow, loader: expenseShowLoader },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
