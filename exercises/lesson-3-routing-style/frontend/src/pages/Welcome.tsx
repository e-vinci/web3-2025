import { NavLink } from "react-router";

export default function Welcome() {
    return <div className="text-center">
        <h1 className="text-5xl">Welcome to the Expense Tracker</h1>
        <div className="text-center py-12">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </div>
        <ul className="flex flex-row gap-4 justify-center">
            <li className="bg-green-800 text-white rounded-full px-4 py-2 hover:bg-green-700 shadow">
                <NavLink to="/list">View Expenses</NavLink>
            </li>
            <li className="bg-green-800 text-white rounded-full px-4 py-2 hover:bg-green-700 shadow">
                <NavLink to="/add">Add Expense</NavLink>
            </li>
        </ul>
    </div>
}