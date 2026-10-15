import { Link } from "react-router";

function Welcome() {
  return (
    <div>
      <h1>Expenso</h1>
      <p>
        Share expenses with your friends without the awkward conversations. Record who paid for
        what, and let Expenso work out who owes whom.
      </p>
      <p>
        <Link to="/expenses">See the expenses</Link> or{" "}
        <Link to="/expenses/new">add a new one</Link>.
      </p>
    </div>
  );
}

export default Welcome;
