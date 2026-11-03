import { Link } from "react-router";

function Welcome() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold text-slate-900">Expenso</h1>
      <p className="text-slate-600">
        Share expenses with your friends without the awkward conversations. Record who paid for
        what, and let Expenso work out who owes whom.
      </p>
      <p className="text-slate-600">
        <Link to="/expenses" className="font-medium text-indigo-600 hover:underline">
          See the expenses
        </Link>{" "}
        or{" "}
        <Link to="/expenses/new" className="font-medium text-indigo-600 hover:underline">
          add a new one
        </Link>
        .
      </p>
    </div>
  );
}

export default Welcome;
