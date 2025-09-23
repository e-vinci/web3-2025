import { Outlet } from 'react-router';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import '../index.css';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 w-7xl m-auto p-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
