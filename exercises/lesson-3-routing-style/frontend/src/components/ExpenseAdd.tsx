import type { ExpenseInput } from '../types/Expense';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface ExpenseAddProps {
  addExpense: (expense: ExpenseInput) => void;
}

interface FormData {
  description: string;
  payer: string;
  amount: string;
}

export default function ExpenseAdd({ addExpense }: ExpenseAddProps) {
  const form = useForm<FormData>({
    defaultValues: {
      description: '',
      payer: 'Alice',
      amount: '',
    },
  });

  const onSubmit = ({ description, payer, amount }: FormData) => {
    addExpense({
      description,
      payer,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
    });
    form.reset();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Add New Expense</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="description"
              rules={{ required: 'Description is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payer</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a payer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Alice">Alice</SelectItem>
                      <SelectItem value="Bob">Bob</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              rules={{
                required: 'Amount is required',
                pattern: {
                  value: /^\d+(\.\d{1,2})?$/,
                  message: 'Please enter a valid amount',
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" min={0} step={0.01} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="bg-green-800 hover:bg-green-700">
              Add Expense
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
