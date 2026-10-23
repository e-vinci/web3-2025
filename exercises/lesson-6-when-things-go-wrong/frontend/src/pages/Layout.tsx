import { NavLink, Outlet, useNavigate } from "react-router";

import { useAuth } from "../contexts/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? "rounded px-3 py-1.5 text-sm font-semibold text-indigo-700 bg-indigo-50"
    : "rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100";

function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen">
      <nav className="flex items-center gap-1 border-b border-slate-200 bg-white px-6 py-3">
        <NavLink to="/" end className={linkClass}>
          Home
        </NavLink>

        {/* Hiding these is a convenience, not a protection — see ProtectedRoute. */}
        {isAuthenticated && (
          <>
            <NavLink to="/expenses" end className={linkClass}>
              Expenses
            </NavLink>
            <NavLink to="/expenses/new" className={linkClass}>
              Add an expense
            </NavLink>
          </>
        )}

        <div className="ml-auto flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-slate-500">Signed in as {user?.name}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
              >
                Log out
              </button>
            </>
          ) : (
            <NavLink to="/login" className={linkClass}>
              Log in
            </NavLink>
          )}
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {/* React Router renders the matching child route here. */}
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
