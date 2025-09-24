import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import Layout, { loader as layoutLoader } from './pages/Layout';
import Welcome from './pages/Welcome';
import Transactions, { loader as transactionsLoader } from './pages/Transactions';
import ExpenseDetails, { loader as expenseDetailsLoader } from './pages/ExpenseDetails';
import AddTransfer, { loader as AddTransferLoader } from './pages/AddTransfer';

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
        Component: ExpenseDetails,
        loader: expenseDetailsLoader,
      },
      {
        path: 'transfers/new',
        Component: AddTransfer,
        loader: AddTransferLoader,
      },
    ],
  },
]);

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<RouterProvider router={router} />);
} else {
  throw new Error('Root element not found');
}
