import { Outlet } from 'react-router';
import { Toaster } from 'sonner';
import Header from '@/components/Header';

export default function Layout() {
  return (
    <div>
      <Header />

      <main className="p-6">
        <Outlet />
      </main>

      <Toaster />
    </div>
  );
}
