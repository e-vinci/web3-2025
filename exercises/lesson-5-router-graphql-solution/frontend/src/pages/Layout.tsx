import { NavLink, Outlet } from "react-router";

function Layout() {
  return (
    <div className="layout">
      <nav className="navbar">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          Home
        </NavLink>
        <NavLink to="/expenses" end className={({ isActive }) => (isActive ? "active" : "")}>
          Expenses
        </NavLink>
        <NavLink to="/expenses/new" className={({ isActive }) => (isActive ? "active" : "")}>
          Add an expense
        </NavLink>
      </nav>
      <main>
        {/* React Router renders the matching child route here. */}
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
