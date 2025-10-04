import { Outlet } from 'react-router';
import Navbar from '../components/Navbar';
import { Toaster } from '@/components/ui/sonner';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 w-7xl m-auto p-4">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
};
export default Layout;
