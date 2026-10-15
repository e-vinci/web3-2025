import { useNavigate } from "react-router";
import ExpenseAdd from "../../components/ExpenseAdd";
import type { NewExpense as NewExpenseInput } from "../../types/Expense";
import { graphqlRequest } from "../../lib/graphql";

/**
 * Writes are mutations. Note that we are NOT using React Router actions here:
 * the form stays on react-hook-form + Zod, and the page decides what happens
 * after a successful submit.
 */
const CREATE_EXPENSE = /* GraphQL */ `
  mutation CreateExpense($input: CreateExpenseInput!) {
    createExpense(input: $input) {
      id
    }
  }
`;

function ExpenseNew() {
  const navigate = useNavigate();

  const createExpense = async (expense: NewExpenseInput) => {
    await graphqlRequest(CREATE_EXPENSE, { input: expense });
    // Send the user back to the list, which re-runs its loader and shows the
    // expense that was just created.
    navigate("/expenses");
  };

  return <ExpenseAdd expenseAdd={createExpense} />;
}

export default ExpenseNew;
