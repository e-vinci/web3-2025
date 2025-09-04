import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import ReactDOM from 'react-dom/client';
import Welcome from './pages/Welcome';
import AddExpense from './pages/AddExpense';
import ExpensesList from './pages/ExpensesList';
import Layout from './pages/Layout';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Welcome />,
      },
      {
        path: '/add',
        element: <AddExpense />,
      },
      {
        path: '/list',
        element: <ExpensesList />,
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
