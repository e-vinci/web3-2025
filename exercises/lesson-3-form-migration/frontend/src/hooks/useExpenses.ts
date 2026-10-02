/**
 * What is a React hook?
 * ---------------------
 * A "hook" is just a regular JavaScript function whose name starts with "use".
 * What makes it special is that it can call React built-ins like useState,
 * useEffect, and useCallback — things that only work inside a React component
 * or another hook.
 *
 * The main benefit: instead of copy-pasting the same state and fetch logic in
 * every component that needs expenses, we write it once here and any component
 * can call `useExpenses()` to get everything it needs.
 *
 * This file is organised in two parts:
 *   1. Private API helpers  — plain async functions that talk to the backend.
 *      They are not exported; only the hook uses them.
 *   2. The hook itself      — useExpenses(), which owns the state and exposes
 *      clean actions to the rest of the app.
 */
import { useState, useEffect, useCallback } from "react";
import type { Expense, NewExpense } from "../types/Expense";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// =============================================================================
// Part 1 — Private API helpers
// These functions only know how to make HTTP requests. They have no idea that
// React exists. Keeping them separate makes them easy to test and understand.
// =============================================================================

/**
 * Fetches the full list of expenses from the backend.
 * Returns an empty array if the request fails so the UI never crashes.
 */
async function fetchAllExpenses(): Promise<Expense[]> {
  return fetch(`${API_BASE_URL}/api/expenses`)
    .then((res) => res.json())
    .then((data) => (Array.isArray(data) ? (data as Expense[]) : []))
    .catch((error) => {
      console.error("Error getting expenses:", error);
      return [] as Expense[];
    });
}

/**
 * Sends a new expense to the backend (HTTP POST).
 * The backend responds with the created expense object, which we return.
 * Returns null if the request fails.
 */
async function postExpense(newExpense: NewExpense): Promise<Expense | null> {
  return fetch(`${API_BASE_URL}/api/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newExpense),
  })
    .then((res) => res.json())
    .then((data) => data as Expense)
    .catch((error) => {
      console.error("Error adding expense:", error);
      return null;
    });
}

/**
 * Asks the backend to delete all expenses (HTTP POST to /reset).
 * The backend responds with an empty list, which we return.
 * Returns an empty array if the request fails.
 */
async function postResetExpenses(): Promise<Expense[]> {
  return fetch(`${API_BASE_URL}/api/expenses/reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: "{}",
  })
    .then((res) => res.json())
    .then((data) => (Array.isArray(data) ? (data as Expense[]) : []))
    .catch((error) => {
      console.error("Error resetting expenses:", error);
      return [] as Expense[];
    });
}

// =============================================================================
// Part 2 — The hook
// =============================================================================

/**
 * useExpenses — the single source of truth for the expenses list.
 *
 * This hook bundles together:
 *   • the data  (`expenses`) — the current list, kept in React state
 *   • the status (`loading`) — true while the first fetch is in progress
 *   • the actions (`addExpense`, `resetExpenses`) — functions the UI can call
 *
 * Usage in a component:
 *   const { expenses, loading, addExpense, resetExpenses } = useExpenses();
 *
 * React re-renders the component automatically every time `expenses` or
 * `loading` changes, so the UI always stays in sync with the data.
 *
 * @returns An object with:
 *   - expenses       — the current list of Expense objects
 *   - loading        — true while the initial fetch is running
 *   - addExpense     — call this with an Expense to add it and refresh the list
 *   - resetExpenses  — call this to delete all expenses and refresh the list
 */
function useExpenses() {
  /**
   * useState — declares a piece of state that React tracks.
   *
   * `useState<Expense[]>([])` means:
   *   • the state variable is named `expenses` and starts as an empty array
   *   • `setExpenses` is the setter: calling it replaces the value AND tells
   *     React to re-render any component that uses this hook
   *
   * Think of it as React's version of a reactive variable.
   */
  const [expenses, setExpenses] = useState<Expense[]>([]);

  /**
   * `loading` starts as true because we kick off the first fetch immediately.
   * Once the fetch completes (success or failure), we set it to false.
   * Components can use this to show a spinner or a "Loading…" message.
   */
  const [loading, setLoading] = useState(true);

  /**
   * useEffect — runs side-effects after the component mounts.
   *
   * A "side effect" is anything that reaches outside React: network requests,
   * timers, subscriptions, etc.
   *
   * The empty array `[]` at the end is the dependency list. An empty list means
   * "run this effect only once, when the component first appears on screen"
   * (equivalent to componentDidMount in class components).
   *
   * Here we load the expenses from the backend exactly once at startup.
   */
  useEffect(() => {
    fetchAllExpenses()
      .then(setExpenses)      // on success: store the list in state
      .finally(() => setLoading(false)); // always: mark loading as done
  }, []);

  /**
   * useCallback — memoises a function so its reference stays stable across
   * re-renders.
   *
   * Without useCallback, a new function object would be created on every render,
   * which can cause unnecessary re-renders in child components that receive it
   * as a prop. The `[]` dependency list means "never recreate this function".
   *
   * addExpense: sends the new expense to the backend, then appends the created
   * expense returned by the server to the existing local list.
   */
  const addExpense = useCallback(async (newExpense: NewExpense): Promise<void> => {
    const created = await postExpense(newExpense);
    if (created) {
      setExpenses((prev) => [...prev, created]); // append new expense without clearing the list
    }
  }, []);

  /**
   * resetExpenses: asks the backend to wipe all expenses, then updates the
   * local list to the empty list the server returns.
   * Same memoisation pattern as addExpense.
   */
  const resetExpenses = useCallback(async (): Promise<void> => {
    const updated = await postResetExpenses();
    setExpenses(updated); // triggers a re-render with an empty list
  }, []);

  /**
   * Everything a component needs is returned in a plain object.
   * The component destructures what it needs:
   *   const { expenses, addExpense } = useExpenses();
   */
  return { expenses, loading, addExpense, resetExpenses };
}

export default useExpenses;
