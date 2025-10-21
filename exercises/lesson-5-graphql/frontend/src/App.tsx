import { createBrowserRouter, RouterProvider } from 'react-router';
import Layout, { loader as layoutLoader } from './pages/Layout';
import Welcome from './pages/Welcome';
import Transactions, { loader as transactionsLoader } from './pages/Transactions';
import ExpenseDetail, { loader as expenseDetailLoader } from './pages/ExpenseDetails';
import NewTransfer, { loader as NewTransferLoader } from './pages/NewTransfer';
import NewExpense, { loader as NewExpenseLoader } from './pages/NewExpense';
import { ApolloProvider } from '@apollo/client/react';
import client from './lib/graphql-client';

const router = createBrowserRouter([
  {
    Component: Layout,
    loader: layoutLoader,
    id: 'layout',

    children: [
      { index: true, Component: Welcome },
      {
        path: 'transactions',
        Component: Transactions,
        loader: transactionsLoader,
      },
      {
        path: 'expenses/:id',
        Component: ExpenseDetail,
        loader: expenseDetailLoader,
      },
      {
        path: 'transfers/new',
        Component: NewTransfer,
        loader: NewTransferLoader,
      },
      {
        path: 'expenses/new',
        Component: NewExpense,
        loader: NewExpenseLoader,
      },
    ],
  },
]);

function App() {
  return (
    <ApolloProvider client={client}>
      <RouterProvider router={router} />
    </ApolloProvider>
  );
}

export default App;
