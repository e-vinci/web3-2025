// Example: src/components/Header.tsx or updating existing navbar
import { Link, NavLink, useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          Expenso
        </Link>

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
        </div>

        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-gray-700">Welcome, {user?.email}</span>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate('/login')}>Login</Button>
          )}
        </nav>
      </div>
    </header>
  );
}
