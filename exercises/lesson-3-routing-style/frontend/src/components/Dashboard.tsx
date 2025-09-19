import { useEffect, useState } from 'react';
import type { Expense } from '../types/Expense';

const host = import.meta.env.VITE_API_URL;

interface DashboardProps {
    onClose: () => void;
}

export default function Dashboard({ onClose }: DashboardProps) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const response = await fetch(`${host}/api/expenses`);
                const data = await response.json();
                setExpenses(data);
            } catch (error) {
                console.error('Failed to fetch expenses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchExpenses();
    }, []);

    // Calculate statistics
    const totalExpenses = expenses.length;
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expensesByPayer = expenses.reduce((acc, expense) => {
        acc[expense.payer] = (acc[expense.payer] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
                <div className="text-xl">Loading dashboard...</div>
            </div>
        );
    }

    return (
        // Mistake: Bypassing layout, using fixed positioning instead of proper routing
        <div className="fixed inset-0 bg-white z-50 overflow-auto">
            {/* Mistake: Custom navigation instead of using the app's NavBar */}
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
                <h1 className="text-2xl font-bold">📊 Expense Dashboard</h1>
                <button
                    onClick={onClose}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium"
                >
                    ✕ Close
                </button>
            </div>

            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold mb-8 text-gray-800">Expense Analytics</h2>

                    {/* Mistake: Custom Tailwind cards instead of Shad components */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Total Expenses Card */}
                        <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-lg shadow-lg border-l-4 border-purple-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-200 text-sm font-medium uppercase">Total Expenses</p>
                                    <p className="text-3xl font-bold">{totalExpenses}</p>
                                </div>
                                <div className="text-4xl opacity-80">📋</div>
                            </div>
                        </div>

                        {/* Total Amount Card */}
                        <div className="bg-gradient-to-br from-green-500 to-green-700 text-white p-6 rounded-lg shadow-lg border-l-4 border-green-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-200 text-sm font-medium uppercase">Total Amount</p>
                                    <p className="text-3xl font-bold">${totalAmount.toFixed(2)}</p>
                                </div>
                                <div className="text-4xl opacity-80">💰</div>
                            </div>
                        </div>

                        {/* Average Amount Card */}
                        <div className="bg-gradient-to-br from-orange-500 to-orange-700 text-white p-6 rounded-lg shadow-lg border-l-4 border-orange-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-200 text-sm font-medium uppercase">Average Amount</p>
                                    <p className="text-3xl font-bold">
                                        ${totalExpenses > 0 ? (totalAmount / totalExpenses).toFixed(2) : '0.00'}
                                    </p>
                                </div>
                                <div className="text-4xl opacity-80">📊</div>
                            </div>
                        </div>
                    </div>

                    {/* Expenses by Payer */}
                    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                        <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                            👥 Expenses by Payer
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(expensesByPayer).map(([payer, count]) => (
                                <div key={payer} className="bg-gray-50 p-4 rounded border-l-4 border-blue-400">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-700">{payer}</span>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold text-blue-600">{count}</span>
                                            <p className="text-sm text-gray-500">expenses</p>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${(count / totalExpenses) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Expenses Preview */}
                    {expenses.length > 0 && (
                        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg border border-gray-200">
                            <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                                🕒 Recent Expenses
                            </h3>
                            <div className="space-y-3">
                                {expenses.slice(0, 5).map((expense) => (
                                    <div key={expense.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border-l-4 border-gray-300">
                                        <div>
                                            <p className="font-medium text-gray-800">{expense.description}</p>
                                            <p className="text-sm text-gray-600">Paid by {expense.payer}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-gray-800">${expense.amount.toFixed(2)}</p>
                                            <p className="text-xs text-gray-500">{expense.date.split('T')[0]}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}