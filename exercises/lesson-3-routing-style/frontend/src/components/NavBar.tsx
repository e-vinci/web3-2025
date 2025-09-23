import { NavLink, useLocation } from 'react-router';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';

export default function NavBar() {
  const location = useLocation();

  return (
    <div className="bg-green-900 text-white w-lvw p-4 flex flex-row shadow-lg justify-center">
      <NavigationMenu className="text-white">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className={
                location.pathname === '/'
                  ? 'font-bold px-8 text-white bg-green-800'
                  : 'px-8 text-white hover:bg-green-800'
              }
            >
              <NavLink to="/">Welcome</NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className={
                location.pathname === '/add'
                  ? 'font-bold px-8 text-white bg-green-800'
                  : 'px-8 text-white hover:bg-green-800'
              }
            >
              <NavLink to="/add">Add Expense</NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              asChild
              className={
                location.pathname === '/list'
                  ? 'font-bold px-8 text-white bg-green-800'
                  : 'px-8 text-white hover:bg-green-800'
              }
            >
              <NavLink to="/list">Expense List</NavLink>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
