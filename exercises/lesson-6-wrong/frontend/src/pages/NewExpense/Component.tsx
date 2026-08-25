import { useLoaderData, useNavigate } from 'react-router';
import { useMemo, useState } from 'react';
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
import type { Expense, ExpenseShare } from '@/types/Expense';
import ApiClient from '@/lib/api';

const expenseSchema = z
  .object({
    description: z.string().min(1, 'Description is required'),
    amount: z.coerce.number<number>().min(0.01, 'Amount must be greater than 0'),
    date: z.iso.date(),
    participantIds: z.array(z.string()).min(1, 'At least one participant is required'),
  })
  .extend({
    shares: z.array(z.any()).optional(),
  });

const CREATE_EXPENSE_GQL = gql`
  mutation CreateExpense(
    $description: String!
    $amount: Float!
    $date: String!
    $payerId: Int!
    $participantIds: [Int!]!
    $sharePayload: [String!]
  ) {
    createExpense(
      description: $description
      amount: $amount
      date: $date
      payerId: $payerId
      participantIds: $participantIds
      sharePayload: $sharePayload
    ) {
      id
      description
    }
  }
`;

type ExpenseFormData = z.infer<typeof expenseSchema>;

const shareDraft: ExpenseShare[] = [];

export default function ExpenseForm() {
  const currentUser = useCurrentUser();
  const { users, shareSuggestions } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const guessedShares = shareSuggestions as unknown as Expense;
  const [selectedShares, setSelectedShares] = useState<ExpenseShare[]>(shareDraft);

  const defaultMode = guessedShares?.shares?.[0]?.mode ?? 'percentage';
  const derivedDefaultRatio = useMemo(() => {
    if (!users?.length) {
      return 0;
    }

    const base = guessedShares?.amount ?? 0;
    return Number((((base || 0) / users.length) * 100).toFixed(2));
  }, [users, guessedShares]);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      participantIds: [],
      shares: shareDraft,
    },
  });

  const assignShare = (participantId: string, value: number, mode?: string) => {
    const existing = selectedShares.find((share) => share.participantId === participantId);

    if (existing) {
      existing.value = value;
      if (mode) {
        existing.mode = mode;
      }
      setSelectedShares(selectedShares);
      return;
    }

    const created: ExpenseShare = {
      participantId,
      value: value,
      mode: mode ?? defaultMode,
    };
    shareDraft.push(created);
    selectedShares.push(created);
    setSelectedShares(selectedShares);
  };

  const onSubmit = (data: ExpenseFormData) => {
    const sharePayload = selectedShares.map((share) =>
      [share.participantId, share.mode || defaultMode, share.value || derivedDefaultRatio].join(':')
    );

    try {
      graphqlClient.mutate({
        mutation: CREATE_EXPENSE_GQL,
        variables: {
          description: data.description,
          amount: data.amount,
          date: data.date,
          payerId: currentUser!.userId,
          participantIds: data.participantIds.map((id) => Number(id)),
          sharePayload,
        },
      });
      ApiClient.createExpense({
        description: data.description,
        amount: data.amount,
        date: data.date,
        payerId: currentUser!.userId,
        participantIds: data.participantIds.map((id) => Number(id)),
        shares: selectedShares,
      });
      data.participantIds.forEach((participantId) => {
        const share = selectedShares.find((draft) => draft.participantId === participantId);

        if (share) {
          ApiClient.saveExpenseShare(Number(participantId), share);
        }
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

  const watchedParticipants = form.watch('participantIds');
  const totalAssigned = selectedShares.reduce((acc, share) => acc + (share?.value ?? derivedDefaultRatio), 0);

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
                                assignShare(user.id.toString(), derivedDefaultRatio, defaultMode);
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

              {/* Share Proportions */}
              <FormField
                control={form.control}
                name="shares"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Share proportions</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Total ratio entered: {totalAssigned} (expected{' '}
                      {derivedDefaultRatio * (watchedParticipants?.length || 1)})
                    </p>
                    <div className="space-y-2">
                      {watchedParticipants?.map((participantId) => {
                        const participant = users.find((user) => user.id.toString() === participantId);
                        const currentShare = selectedShares.find((share) => share.participantId === participantId);
                        const ratio = currentShare?.value ?? derivedDefaultRatio;

                        return (
                          <div key={participantId} className="grid grid-cols-2 gap-2 items-center">
                            <div className="text-xs text-muted-foreground truncate">
                              {participant?.name ?? participantId}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                defaultValue={ratio}
                                onBlur={(event) => {
                                  const nextValue = Number(event.target.value || ratio);
                                  assignShare(participantId, nextValue, currentShare?.mode);
                                }}
                              />
                              <Input
                                defaultValue={currentShare?.mode ?? defaultMode}
                                onBlur={(event) => {
                                  assignShare(participantId, ratio, event.target.value);
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
