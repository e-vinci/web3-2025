import { createContext, useState } from 'react';
import './App.css';
import ExpensesList from './pages/ExpensesList';
import AddExpense from './pages/AddExpense';
import Welcome from './pages/Welcome';

export const PageContext = createContext<{
  currentPage: string;
  setCurrentPage: (page: string) => void;
}>({
  currentPage: "Welcome",
  setCurrentPage: () => { }
});

const pages: { [key: string]: React.FunctionComponent } = {
  "Welcome": Welcome,
  "List": ExpensesList,
  "Add": AddExpense
}

function App() {
  const [currentPage, setCurrentPage] = useState<string>("Welcome");

  function handlePageChange(page: string) {
    window.history.replaceState(null, page, `/${page.toLowerCase()}`);
    setCurrentPage(page);
  }

  const CurrentPageComponent = pages[currentPage];

  return (
    <PageContext.Provider value={{ currentPage, setCurrentPage: handlePageChange }}>
      <CurrentPageComponent />
    </PageContext.Provider>
  );
}

export default App;
