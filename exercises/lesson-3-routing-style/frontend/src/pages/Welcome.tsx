import { useContext } from "react";
import { PageContext } from "../App";

export default function Welcome() {
    const { setCurrentPage } = useContext(PageContext);
    return <>
        Welcome to the Expense Tracker
        <button onClick={() => setCurrentPage("List")}>View Expenses</button>
        <button onClick={() => setCurrentPage("Add")}>Add Expense</button>
    </>
}