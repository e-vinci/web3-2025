import { NavLink } from 'react-router';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import Dashboard from '../components/Dashboard';

export default function Welcome() {
  // Mistake: Using state for navigation instead of router
  const [showDashboard, setShowDashboard] = useState(false);

  // Mistake: Bypassing router with onClick handler
  const handleDashboardClick = () => {
    setShowDashboard(true);
  };

  const handleCloseDashboard = () => {
    setShowDashboard(false);
  };

  return (
    <>
      <div className="text-center">
        <h1 className="text-5xl">Welcome to the Expense Tracker</h1>
        <div className="text-center py-12">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
          magna aliqua.
        </div>
        <div className="flex flex-row gap-4 justify-center flex-wrap">
          <Button asChild className="bg-green-800 text-white hover:bg-green-700 rounded-full px-6">
            <NavLink to="/list">View Expenses</NavLink>
          </Button>
          <Button asChild className="bg-green-800 text-white hover:bg-green-700 rounded-full px-6">
            <NavLink to="/add">Add Expense</NavLink>
          </Button>
          {/* Mistake: Using onClick instead of NavLink/routing */}
          <Button
            onClick={handleDashboardClick}
            className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-6"
          >
            📊 Dashboard
          </Button>
        </div>
      </div>

      {/* Mistake: Conditionally rendering dashboard instead of using routes */}
      {showDashboard && <Dashboard onClose={handleCloseDashboard} />}
    </>
  );
}
