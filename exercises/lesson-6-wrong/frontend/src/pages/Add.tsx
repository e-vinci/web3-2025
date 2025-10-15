import { useContext } from 'react';
import { PageContext } from '../App';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const expenseSchema = z.object({
  description: z
    .string()
    .max(200, 'Description cannot exceed 200 characters')
    .min(3, 'Description must be at least 3 characters long')
    .or(z.literal('')),
  payer: z.enum(['Alice', 'Bob'], {
    error: 'Payer must be either Alice or Bob',
  }),
  amount: z.coerce.number<number>().gt(0, 'Amount must be a positive number'),
});

type FormData = z.infer<typeof expenseSchema>;

const Add = () => {
  const { sendApiRequestandHandleError } = useContext(PageContext);
  const navigate = useNavigate();
  const form = useForm<FormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { description: '', payer: 'Alice' },
  });

  const onSubmit = async ({ description, payer, amount }: FormData) => {
    const newExpenseForm = {
      description,
      payer,
      amount,
      date: new Date().toISOString(),
    };
    await sendApiRequestandHandleError('POST', 'expenses', newExpenseForm);
    toast('Expense has been created.');
    navigate('/list');
  };

  const isSubmitDisabled = form.formState.isSubmitting || !form.formState.isValid;

  const handleResetData = async () => {
    await sendApiRequestandHandleError('POST', 'expenses/reset');
    toast('Expense has been reset.');
    navigate('/list');
  };

  return (
    <div>
      <div>
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Add New Expense</h3>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0.00" step={0.01} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitDisabled} variant="default">
                  {form.formState.isSubmitting ? 'Adding...' : 'Add'}
                </Button>

                <Button type="button" onClick={handleResetData} variant="destructive">
                  Reset Data
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Add;
