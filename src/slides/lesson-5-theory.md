---
marp: true
theme: default
paginate: true
header: 'Web 3 2026 - Routing and GraphQL'
footer: 'Web 3 2026 - Vinci'
---

# Lesson 5: Routing and GraphQL

## From one page to many — and why that changes the API

<!--
Speaker notes:
• Two topics, but they are one story: routing creates the problem GraphQL solves.
• Order matters today. Don't jump ahead to GraphQL.
• Ask: who has used a site where the back button did nothing? That's today's starting point.
-->

---

## Where we left off

**Laptops closed.** Last week's `useExpenses` hook.

1. Besides the expenses themselves, **what state does it hold?**
2. What happens, **in order**, from "component renders" to "data on screen"?

*60 seconds. Talk to the person next to you.*

<!--
Speaker notes — RETRIEVAL, not revision. Do not answer it for them.
Answers: (1) a `loading` flag, usually an error too.
(2) component renders with an empty list → useEffect fires → fetch → setState → re-render.
Make someone say the ORDER out loud — "renders first, data second" is the whole point.

Why open this way: in twenty minutes we delete every piece of this. They can only notice
what vanished if the old pattern is active in their head right now. Show them a loader
cold and they will nod and learn nothing.
-->

---

## ...and what that costs us

Our app works. It is also **one single page**.

- Everything lives in `Home.tsx`: the form, the search, the list
- You cannot link to one expense
- The back button does nothing
- Refresh always lands on the same screen
- Every component fetches its own data with `useEffect`

> A technical proof of concept, not a product.

---

## Today

1. **React Router** — split into real pages, fetch with **loaders**
2. Feel a problem: several pages need several **shapes** of the same data
3. **GraphQL** — one endpoint, each page asks for what it needs

<!--
Speaker notes:
• Emphasise step 2. Students who skip it think GraphQL is just "REST with extra steps".
• The pain is the point.
-->

---

# Part 1 — React Router

A router maps a **URL** to a **component**. That one idea gives you, for free:

- shareable and bookmarkable links
- a working back/forward button
- refresh that lands where you were
- a place to hang **per-page data loading**

---

## Install: read this carefully

```bash
npm install react-router
```

**Not `react-router-dom`.**

- `react-router-dom` was merged into `react-router` in **v8**
- It is frozen at v7 on npm — installing it gives you a stale version
- Every tutorial, blog post and AI answer still says `-dom`

<!--
Speaker notes:
• This WILL bite people. Say it twice.
• If a student has weird import errors, this is the first thing to check.
-->

---

## Declaring routes

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router';

const router = createBrowserRouter([
  {
    Component: Layout,          // no path: a layout route
    children: [
      { index: true, Component: Welcome },
      { path: 'expenses', Component: ExpenseList },
      { path: 'expenses/new', Component: ExpenseNew },
      { path: 'expenses/:id', Component: ExpenseShow },
    ],
  },
]);

createRoot(root).render(<RouterProvider router={router} />);
```

---

## Layout routes and `Outlet`

A layout route has **no path**. It exists to wrap its children.

```tsx
function Layout() {
  return (
    <div>
      <nav>{/* stays on screen between pages */}</nav>
      <main>
        <Outlet />   {/* the matching child renders here */}
      </main>
    </div>
  );
}
```

`index: true` = what `/` renders.

---

## Links

```tsx
<Link to="/expenses">Expenses</Link>

<NavLink to="/expenses" end
  className={({ isActive }) => (isActive ? 'active' : '')}>
  Expenses
</NavLink>
```

- `Link` — navigate without reloading the page
- `NavLink` — a `Link` that knows if it is active
- **`end`** — match exactly; without it `/expenses` stays "active" on `/expenses/new`

---

## The old way: `useEffect`

```tsx
const [expenses, setExpenses] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/expenses')
    .then((r) => r.json())
    .then(setExpenses)
    .finally(() => setLoading(false));
}, []);

if (loading) return <p>Loading…</p>;
```

Render first, **then** fetch. Every component repeats this.

---

## The new way: a loader

```ts
export async function expenseListLoader() {
  const res = await fetch(`${API}/api/expenses`);
  if (!res.ok) throw new Response('Failed', { status: res.status });
  return res.json();
}
```

```tsx
{ path: 'expenses', Component: ExpenseList, loader: expenseListLoader }
```

```tsx
const expenses = useLoaderData() as Expense[];
```

No `useState`. No `useEffect`. No `loading` flag.

A route with a dynamic segment (`expenses/:id`) passes it to the loader
in **`params`** — `({ params }) => ...`, then `params.id`.

<!--
Speaker notes:
• The router knows which page it is about to render, so it can fetch BEFORE rendering.
• The component becomes a pure function of its data. That is the real win.
-->

---

## Errors: throw, don't return

```ts
if (!res.ok) throw new Response('Not found', { status: 404 });
```

A loader answers one of two things: **here is the data**, or **this route failed**.
Throwing is how you say the second without inventing a convention.

- Returning `undefined` pushes the problem into the component —
  every `.map` becomes a null check
- `Response` is a **web standard**, not a React Router type
- React Router catches it and shows a built-in error screen

---

## Put your filters in the URL

```tsx
const [searchParams, setSearchParams] = useSearchParams();

setSearchParams(new URLSearchParams({ payerId: '2' }));
```

The loader reads them back:

```ts
export async function expenseListLoader({ request }) {
  const params = new URL(request.url).searchParams;
  // ...
}
```

**The URL changes → the router re-runs the loader.** No state to manage.

`/expenses?payerId=2&amount=10` is bookmarkable, shareable, survives refresh.

> Any filter, tab or page cursor living only in `useState`
> is state your users cannot share and you cannot reproduce.

---

## Check: what runs?

You are on `/expenses`. The user picks a payer and submits,
so the URL becomes `/expenses?payerId=2`. **What runs?**

**A.** The component re-renders; the loader does not run again
**B.** The loader runs again, then the component re-renders
**C.** Nothing, until you call a refetch function yourself
**D.** A `useEffect` inside the component fires

<!--
HINGE QUESTION — all hands up at once, fingers 1-4. 60 seconds.
Answer: B.
Diagnosis:
• A or D → still on the useEffect model: the loader is "mount-only" in their head.
  Re-show "Put your filters in the URL" and demo it live in the browser.
• C → thinks fetching is manual (react-query habit). Say: the ROUTER owns the trigger,
  the URL is the input.
• Mostly B → move on, the key idea of Part 1 has landed.
Do not take hands-up volunteers — you will only hear from the three who already know.
-->

---

# Part 2 — The problem

---

## One endpoint, two screens

`GET /api/expenses` returns, for **every** row:

- the full payer — email, **bank account**
- every participant — emails, bank accounts
- the full category

The **list** screen shows: description, amount, date, payer *name*, category *name*.

> We ship bank details to a screen that never renders them.
> A performance problem and a privacy problem at once.

---

## So you trim it

Make `/api/expenses` light. ~2.3 kB → ~0.8 kB. 

But the **detail** page needs all of it.

So now you have:

| Endpoint | Shape |
|---|---|
| `GET /api/expenses` | light |
| `GET /api/expenses/:id` | full |

Two routes, two mappings, two TypeScript types, one resource.

---

## And it keeps going

- A screen needs expenses **with participants but no category** → a third endpoint?
- Add `?include=participants,category` → you are writing a query language, badly, one `if` at a time
- Add a field to `Expense` → how many files do you touch?

<!--
Speaker notes:
• Ask the room for the ?include= answer before showing it. Someone always proposes it.
• That instinct is correct AND it is the smell. Name it.
-->

---

## Check: what does the new screen cost?

Your REST API: `GET /api/expenses` (light) and `GET /api/expenses/:id` (full).
A new screen needs expenses **with participants but without categories**.
**What is the smallest change that works?**

**A.** Nothing — `/api/expenses` already returns those fields
**B.** Add a third endpoint, or an `?include=` parameter
**C.** Put participants back into `/api/expenses` — the list page won't mind
**D.** Call `/api/expenses/:id` once per row

<!--
HINGE QUESTION — 60 seconds, everyone answers. Answer: B.
This one decides whether Part 3 will mean anything, so do not skip it.
Diagnosis:
• A → never registered that we trimmed the list endpoint. Re-show "So you trim it".
• C → has not felt the over-fetching cost; would happily re-create the original problem.
  Re-run the network-tab demo: 2.3 kB vs 0.8 kB, bank accounts on a list screen.
• D → right instinct about shapes, hasn't costed it. Name the N+1 problem, move on.
• Mostly B → the motivation has landed. Go straight to Part 3.
-->

---

# Part 3 — GraphQL

**REST:** the server publishes **shapes**. One URL, one response shape.

**GraphQL:** the server publishes **capabilities** — a schema of everything that *can* be asked.
The client sends a **query** for what it needs *this time*.

> One endpoint. Any number of shapes.
> No backend change when a screen's needs change.

---

## Mounting it (GraphQL Yoga)

```bash
npm install graphql-yoga graphql
```

```ts
const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  maskedErrors: process.env.NODE_ENV === 'production',
});
app.use(yoga.graphqlEndpoint, yoga);
```

Open `http://localhost:3000/graphql` **in a browser** → GraphiQL IDE.

<!--
Speaker notes:
• maskedErrors: without it every resolver error is "Unexpected error." and they will be lost for an hour.
• Demo GraphiQL live: the Docs panel is the selling point. The API documents itself.
-->

---

## The schema (SDL)

```graphql
type User {
  id: Int!
  name: String!
  email: String!
  bankAccount: String      # nullable
}

type Expense {
  id: Int!
  description: String!
  amount: Float!
  payer: User!             # never null
  participants: [User!]!   # list always present, no holes
  category: Category       # may be absent
}
```

`!` = non-nullable. The schema is a **contract**.

---

## Queries and resolvers

```graphql
type Query {
  expenses(filter: ExpenseFilter): [Expense!]!
  expense(id: Int!): Expense
}
```

```ts
Query: {
  expenses: (_p, args) => ExpensesService.getExpenses(args.filter ?? {}),
  expense: (_p, args) => ExpensesService.getExpenseById(args.id),
}
```

Resolvers delegate to the **services you already have**.

> Clean layering is what makes a second API cheap.

---

## Same endpoint, two shapes

**List page** — a little:

```graphql
{
  expenses {
    description
    amount
    payer { name }
    category { name colour }
  }
}
```

**Detail page** — a lot:

```graphql
{
  expense(id: 1) {
    description
    payer { name email bankAccount }
    participants { name email }
  }
}
```

Zero backend code between these two.

---

## A type checks kind, not meaning

Our business object holds a real `Date`. The schema says `date: String!`:

```json
{ "id": 1, "date": "1792051200000" }
```

**No error.** GraphQL coerced the Date via `valueOf()`. That *is* a String,
so the contract is satisfied — and the frontend gets `Invalid Date`.

- `!` catches **missing** data: `Cannot return null for non-nullable field`
- Nothing catches **wrong** data

---

## Validation belongs to the service boundary

A resolver that skips validation and calls the service directly fails like this:

```
date.toISOString is not a function
```

GraphQL checked the **shape** (`date` is a `String`). It never checked the
**meaning** (is it a real date?). That is a business rule, and it lives in
one place:

```ts
const newExpense = parseNewExpense(args.input); // same Zod parser as REST
```

**REST route and GraphQL resolver call the same parser.** A second way
into your services needs the same guard as the first — the schema cannot
do that job for you.

---

## Mutations

```graphql
type Mutation {
  createExpense(input: CreateExpenseInput!): Expense!
}
```

One **input type per mutation**, named `<MutationName>Input`.
Adding a field later never changes the mutation's signature.

`input` ≠ `type`: a `type` describes what the server **returns**,
an `input` describes what the client **sends**. `Expense` has
`payer: User!`; `CreateExpenseInput` has `payerId: Int!` — an id in,
an object out.

- `Query` → reads, may run in parallel
- `Mutation` → writes, run in sequence

A mutation also returns a **selection set**: you choose what you get back
about the thing you just created.

---

## Calling it — from a loader, or from a form

```ts
await fetch(`${API}/graphql`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables }),
});
```

That is the whole protocol, for a query **or** a mutation. **No client library needed.**

```ts
// a submit handler, not a loader — same shape, one variable
await graphqlRequest(CREATE_EXPENSE, { input: formValues });
```

- Apollo Client / urql add a normalised cache + `useQuery`
- The router's loader already owns fetching for a page
- Use variables, never string concatenation — same reason as SQL

---

## Honest trade-offs

GraphQL is **not** automatically faster. The *response* shrinks; the
**database work does not**, unless you make it. Field resolvers fix that —
and introduce **N+1 queries**, which is what **DataLoader** exists for.
REST also gets HTTP caching for free; GraphQL POSTs do not.

**Reach for GraphQL when:** many clients want different data, the data is
deeply related, or the frontend iterates faster than the backend.

**REST is still right when:** one client, stable shapes, file uploads,
HTTP caching, simple public APIs.

> Most real systems run both. We did today.

---

## Key takeaways — Questions?

1. A router makes pages **addressable**: shareable URLs, back button, refresh
2. `react-router`, **not** `react-router-dom`
3. **Loaders** fetch before render and delete most `useEffect` + `loading` code
4. Filters belong **in the URL**
5. REST publishes shapes → N screens grow N endpoints
6. GraphQL publishes **capabilities** → the client picks the shape
7. A schema with `!` is an **executable contract** that catches real bugs

Exercise: build the four pages, move to loaders, feel the two-endpoint pain,
then collapse it into one GraphQL schema.

<!--
Speaker notes:
• Remind them: do the exercise IN ORDER. The REST step is not busywork.
• Watch out for: react-router-dom, missing `end` on NavLink, maskedErrors,
  the silent date coercion, and the resolver that skips parseNewExpense.
-->
