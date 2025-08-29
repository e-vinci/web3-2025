import { Outlet } from 'react-router';
import NavBar from '../components/NavBar';
import '../index.css';

export default function Layout() {
  return (
    <>
      <NavBar />
      <div className="w-7xl m-auto p-4">
        <Outlet />
      </div>
    </>
  );
}
