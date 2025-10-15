import { useLoaderData } from 'react-router';
import type { LoaderData } from './loader';

export default function ExpenseDetails() {
  const { expense } = useLoaderData<LoaderData>();

  const sharePerParticipant = expense.amount / expense.participants.length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Expense Details</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{expense.description}</h2>
        <p className="text-2xl font-bold text-green-600 mb-2">${expense.amount.toFixed(2)}</p>
        <p className="text-gray-600">Created: {new Date(expense.date).toLocaleDateString()}</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Payer</h3>
        <div className="border-l-4 border-blue-500 pl-4">
          <p className="font-medium">{expense.payer.name}</p>
          <p className="text-gray-600">{expense.payer.email}</p>
          {expense.payer.bankAccount && <p className="text-sm text-gray-500">Bank: {expense.payer.bankAccount}</p>}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Participants ({expense.participants.length})</h3>
        <div className="space-y-4">
          {expense.participants.map((participant, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{participant.name}</p>
                  <p className="text-gray-600">{participant.email}</p>
                  {participant.bankAccount && <p className="text-sm text-gray-500">Bank: {participant.bankAccount}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Share:</p>
                  <p className="font-semibold text-red-600">${sharePerParticipant.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
