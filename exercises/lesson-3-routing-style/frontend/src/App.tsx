import { createContext, useState } from 'react';
import Add from './pages/Add';
import List from './pages/List';
import Welcome from './pages/Welcome';
import Layout from './pages/Layout';
import { RouterProvider } from 'react-router/dom';
import { createBrowserRouter } from 'react-router';

const host = import.meta.env.VITE_API_URL;

export const PageContext = createContext<{
  sendApiRequestandHandleError: (method: string, path: string, body?: unknown) => Promise<unknown>;
  error: string | null;
}>({
  sendApiRequestandHandleError: async () => {
    throw new Error('sendApiRequestandHandleError not implemented');
  },
  error: null,
});

function App() {
  const [error, setError] = useState<string | null>(null);

  const sendApiRequestandHandleError = async (method: string = 'GET', path: string, body?: unknown) => {
    try {
      const response = await fetch(`${host}/api/${path}`, {
        method: method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : null,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setError(null);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const context = {
    sendApiRequestandHandleError,
    error,
  };

  const router = createBrowserRouter([
    {
      element: <Layout />,
      children: [
        {
          index: true,
          element: <Welcome />,
        },
        {
          path: 'list',
          element: <List />,
        },
        {
          path: 'add',
          element: <Add />,
        },
      ],
    },
  ]);

  return (
    <PageContext.Provider value={context}>
      <RouterProvider router={router} />
    </PageContext.Provider>
  );
}

export default App;
