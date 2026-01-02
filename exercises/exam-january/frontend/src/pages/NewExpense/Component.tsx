import { useLoaderData, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Receipt, EuroIcon, Users, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import type { LoaderData } from './loader';
import { toast } from 'sonner';
import { gql } from '@apollo/client';
import graphqlClient from '@/lib/graphql-client';
import { useCurrentUser } from '@/contexts/AuthContext';

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number<number>().min(0.01, 'Amount must be greater than 0'),
  date: z.iso.date(),
  participantIds: z.array(z.string()).min(1, 'At least one participant is required'),
});

const CREATE_EXPENSE_GQL = gql`
  mutation CreateExpense(
    $description: String!
    $amount: Float!
    $date: String!
    $payerId: Int!
    $participantIds: [Int!]!
  ) {
    createExpense(
      description: $description
      amount: $amount
      date: $date
      payerId: $payerId
      participantIds: $participantIds
    ) {
      id
      description
    }
  }
`;

type ExpenseFormData = z.infer<typeof expenseSchema>;

export default function ExpenseForm() {
  const currentUser = useCurrentUser();
  const { users } = useLoaderData<LoaderData>();
  const navigate = useNavigate();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      participantIds: [],
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      await graphqlClient.mutate({
        mutation: CREATE_EXPENSE_GQL,
        variables: {
          description: data.description,
          amount: data.amount,
          date: data.date,
          payerId: currentUser!.userId,
          participantIds: data.participantIds.map((id) => Number(id)),
        },
      });
      toast('Expense has been created.');
      return navigate('/transactions');
    } catch (error) {
      console.error('Expense creation failed:', error);
      form.setError('root', {
        type: 'custom',
        message: 'Could not create new expense',
      });
    }
  };

  return (
    <section className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">New Expense</h1>
        <p className="text-muted-foreground">Split an expense between participants</p>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          {/* Error Message */}
          {form.formState.errors.root && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Description Input */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Description</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="What was this expense for?" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount Input */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <EuroIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="number" step="0.01" placeholder="0.00" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Input */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="date" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Participants Selection */}
              <FormField
                control={form.control}
                name="participantIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Split between</FormLabel>
                    <div className="space-y-3">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`participant-${user.id}`}
                            checked={field.value.includes(user.id.toString())}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                const newParticipants = [...field.value, user.id.toString()];
                                form.setValue('participantIds', newParticipants);
                              } else {
                                const newParticipants = field.value.filter((id) => id !== user.id.toString());
                                form.setValue('participantIds', newParticipants);
                              }
                            }}
                          />
                          <label
                            htmlFor={`participant-${user.id}`}
                            className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                          >
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {user.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full" size="lg">
                {form.formState.isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Create Expense
                  </div>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </section>
  );
}
