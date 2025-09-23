export default function Footer() {
  return (
    <footer className="bg-green-900 text-white w-lvw mt-auto p-6 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold">Expense Tracker</h3>
            <p className="text-green-200 text-sm">Keep track of your expenses with ease</p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-green-200 text-sm">
              © {new Date().getFullYear()} Expense Tracker. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
