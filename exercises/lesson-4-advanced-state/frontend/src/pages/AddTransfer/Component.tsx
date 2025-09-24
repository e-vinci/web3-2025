import { useLoaderData, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ApiClient } from '@/lib/api';
import { useCurrentUser } from '@/pages/Layout';
import type { LoaderData } from './loader';

interface TransferFormData {
  sourceId: string;
  targetId: string;
  amount: number;
}

export default function TransferForm() {
  const currentUser = useCurrentUser();
  const { users } = useLoaderData<LoaderData>();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormData>({
    values: {
      sourceId: currentUser?.id.toString() || '',
      targetId: '',
      amount: 0,
    },
  });

  const onSubmit = async (data: TransferFormData) => {
    try {
      await ApiClient.createTransfer({
        amount: data.amount,
        sourceId: Number(data.sourceId),
        targetId: Number(data.targetId),
      });
      return navigate('/transactions');
    } catch (error) {
      console.error('Transfer failed:', error);
      setError('root', { type: 'custom', message: 'Could not create new transfer' });
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">New Transfer</h2>
      {errors.root && <p className="text-red-500 text-sm mt-1">{errors.root.message}</p>}
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-4">
        <div>
          <label className="block">
            From:
            <select
              {...register('sourceId', { required: 'Please select a sender' })}
              className="block w-full mt-1 border rounded px-3 py-2"
            >
              <option value="">Select source</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          {errors.sourceId && <p className="text-red-500 text-sm mt-1">{errors.sourceId.message}</p>}
        </div>

        <div>
          <label className="block">
            To:
            <select
              {...register('targetId', { required: 'Please select a recipient' })}
              className="block w-full mt-1 border rounded px-3 py-2"
            >
              <option value="">Select target</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          {errors.targetId && <p className="text-red-500 text-sm mt-1">{errors.targetId.message}</p>}
        </div>

        <div>
          <label className="block">
            Amount:
            <input
              type="number"
              step="0.01"
              min="0"
              {...register('amount', {
                required: 'Amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' },
              })}
              className="block w-full mt-1 border rounded px-3 py-2"
            />
          </label>
          {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Processing...' : 'Add Transfer'}
        </button>
      </form>
    </section>
  );
}
