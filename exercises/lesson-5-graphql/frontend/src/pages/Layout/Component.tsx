import { NavLink, Outlet, useLoaderData } from 'react-router';
import { useState } from 'react';
import type { LoaderData } from './loader';
import type { User } from '@/types/User';
import { Toaster } from 'sonner';

export default function Layout() {
  const { users } = useLoaderData<LoaderData>();
  const [currentUser, setCurrentUser] = useState<null | User>(null);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const newCurrentUser = users.find((user) => user.id === Number(id)) ?? null;
    setCurrentUser(newCurrentUser);
  };

  const outletContext = {
    currentUser,
  };

  return (
    <div>
      <nav className="bg-teal-800 text-white p-4 flex justify-between items-center">
        <div className="text-xl font-bold">💸 Expenso</div>
        <div>
          <NavLink to="/transactions" className="mr-4">
            All Transactions
          </NavLink>
          <NavLink to="/expenses/new" className="mr-4">
            New Expense
          </NavLink>
          <NavLink to="/transfers/new" className="mr-4">
            New Transfer
          </NavLink>

          <select
            value={currentUser?.id ?? 'none'}
            className="bg-white text-black rounded px-2"
            onChange={handleUserChange}
          >
            <option value="none">— No User —</option>
            {users.map((u: User) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </nav>

      <main className="p-6">
        <Outlet context={outletContext} />
      </main>
      <Toaster />
    </div>
  );
}
