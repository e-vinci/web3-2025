import { NavLink, Outlet, useNavigate } from 'react-router';
import type { LoaderData } from './loader';
import type { User } from '@/types/User';
import { Toaster } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const outletContext = {
    user,
  };

  return (
    <div>
      <nav className="bg-teal-800 text-white p-4 flex justify-between items-center">
        <div className="text-xl font-bold">💸 Expenso</div>
        <div className="flex items-center gap-4">
          <NavLink to="/transactions" className="hover:underline">
            All Transactions
          </NavLink>
          <NavLink to="/expenses/new" className="hover:underline">
            New Expense
          </NavLink>
          <NavLink to="/transfers/new" className="hover:underline">
            New Transfer
          </NavLink>

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-sm">Welcome, {user?.email}</span>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="bg-white text-teal-800 hover:bg-gray-100"
              >
                Logout
              </Button>
            </div>
          ) : (
            <NavLink to="/login" className="hover:underline">
              Login
            </NavLink>
          )}
        </div>
      </nav>

      <main className="p-6">
        <Outlet context={outletContext} />
      </main>
      <Toaster />
    </div>
  );
}
