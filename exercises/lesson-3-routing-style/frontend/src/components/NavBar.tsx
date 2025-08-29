import { NavLink, useLocation } from 'react-router';

export default function NavBar() {
  const location = useLocation();
  return (
    <div className="bg-green-900 text-white w-lvw p-4 flex flex-row shadow-lg justify-center">
      <NavLink className={location.pathname === '/' ? 'font-bold px-8' : 'px-8'} to="/">
        Welcome
      </NavLink>
      <NavLink className={location.pathname === '/add' ? 'font-bold px-8' : 'px-8'} to="/add">
        Add Expense
      </NavLink>
      <NavLink className={location.pathname === '/list' ? 'font-bold px-8' : 'px-8'} to="/list">
        Expense List
      </NavLink>
    </div>
  );
}
