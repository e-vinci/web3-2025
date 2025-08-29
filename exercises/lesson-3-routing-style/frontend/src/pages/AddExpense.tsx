import { useContext, useState } from "react";
import { PageContext } from "../App";
import ExpenseAdd from "../components/ExpenseAdd";
import type { ExpenseInput } from "../types/Expense";

const host = import.meta.env.VITE_API_URL;

export default function AddExpense() {
    const { setCurrentPage } = useContext(PageContext);
    const [error, setError] = useState<string | null>(null);

    const sendApiRequestandHandleError = async (method: string = 'GET', path: string, body?: unknown) => {
        try {
            const response = await fetch(`${host}/api/${path}`, {
                method: method,
                headers: body ? { 'Content-Type': 'application/json' } : {},
                body: body ? JSON.stringify(body) : null,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            setError(error instanceof Error ? error.message : 'An error occurred');
        }
    };
    const handleAddExpense = async (newExpenseForm: ExpenseInput) => {
        await sendApiRequestandHandleError('POST', 'expenses', newExpenseForm);
        setCurrentPage("List");
    };
    return <>
        <div>
            <ExpenseAdd addExpense={handleAddExpense} />
        </div>
        Add Expense
        <button onClick={() => setCurrentPage("List")}>View Expenses</button>
        <button onClick={() => setCurrentPage("Welcome")}>Back to Welcome</button>
    </>
}