import { NavLink, useLocation } from 'react-router';

const Navbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navlinkClassName = (path: string) => {
    const defaultClass = 'px-8 text-white hover:bg-green-800';
    return `${defaultClass} ` + (currentPath === path ? `font-bold` : '');
  };

  return (
    <nav className="flex flex-row w-lvw shadow-lg justify-center p-4 bg-green-900 text-white">
      <NavLink to="/" className={navlinkClassName('/')}>
        Home
      </NavLink>
      <NavLink to="/list" className={navlinkClassName('/list')}>
        Expenses
      </NavLink>
      <NavLink to="/add" className={navlinkClassName('/add')}>
        Add Expense
      </NavLink>
    </nav>
  );
};

export default Navbar;
