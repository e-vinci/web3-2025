import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { DollarSign, TrendingUp, TrendingDown, Receipt } from 'lucide-react';

interface UserStats {
  totalExpensesPaid: number;
  totalExpensesCount: number;
  totalTransfersReceived: number;
  totalTransfersSent: number;
  netBalance: number;
}

export default function UserStats() {
  const { userId } = useParams<{ userId: string }>();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}/stats`);

        if (!response.ok) {
          throw new Error('Failed to fetch user statistics');
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchStats();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">No statistics available</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-8">User Statistics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Expenses Paid */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Expenses Paid</p>
                <p className="text-2xl font-bold text-gray-900">€{stats.totalExpensesPaid.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">{stats.totalExpensesCount} expenses</p>
        </div>

        {/* Transfers Received */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Transfers Received</p>
                <p className="text-2xl font-bold text-gray-900">€{stats.totalTransfersReceived.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">Money received from others</p>
        </div>

        {/* Transfers Sent */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Transfers Sent</p>
                <p className="text-2xl font-bold text-gray-900">€{stats.totalTransfersSent.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">Money sent to others</p>
        </div>

        {/* Net Balance */}
        <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${stats.netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <DollarSign className={`w-6 h-6 ${stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Balance</p>
                <p className={`text-3xl font-bold ${stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  €{stats.netBalance.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {stats.netBalance >= 0
              ? 'You are owed this amount'
              : 'You owe this amount'}
          </p>
        </div>
      </div>
    </div>
  );
}
