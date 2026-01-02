import type { Expense } from '@/types/Expense';
import type { Comment } from '@/types/Comment';
import type { LoaderFunctionArgs } from 'react-router';
import { gql } from '@apollo/client';
import graphqlClient from '@/lib/graphql-client';
import ApiClient from '@/lib/api';

const EXPENSE_QUERY = gql`
  query ExpenseDetail($id: Int!) {
    expense(id: $id) {
      id
      description
      date
      amount
      payer {
        name
        bankAccount
      }
      participants {
        name
      }
    }
  }
`;

export interface LoaderData {
  expense: Expense;
  comments: Comment[];
  commentCount: { count: number };
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { data, error } = await graphqlClient.query<{ expense: Expense }>({
    query: EXPENSE_QUERY,
    variables: { id: parseInt(params.id!) },
  });

  if (!data?.expense || error) {
    throw new Error('Error while retrieving expense details from the server: ' + error);
  }

  const comments = ApiClient.getCommentsByExpense(parseInt(params.id!));
  const commentCount = ApiClient.getCommentCount(parseInt(params.id!));

  return {
    expense: data.expense,
    comments: comments,
    commentCount: commentCount,
  };
}
