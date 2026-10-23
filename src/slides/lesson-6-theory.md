---
marp: true
theme: default
paginate: true
header: 'Web 3 2026 - When Things Go Wrong'
footer: 'Web 3 2026 - Vinci'
---

# Lesson 6: When Things Go Wrong

## Who are you, and may you do this?

<!--
Speaker notes:
• Two questions, not one. Everything today hangs on keeping them apart.
• The opening demo is the whole lesson. Do not skip it, do not describe it — run it.
• Have a terminal ready with the app running BEFORE the room fills up.
-->

---

## Where we left off

**Laptops closed.** Last week you wrote `graphqlRequest` in `lib/graphql.ts`.

1. **Why did we put it in one file** instead of fetching inside each page?
2. I said that file was "where you will later add an `Authorization` header". **Why there?**

*60 seconds. Talk to the person next to you.*

<!--
Speaker notes — RETRIEVAL, not revision. Do not answer it for them.
Answers: (1) one place owns the URL, the failure rule, and the JSON parsing.
(2) because every request already passes through it, so a change there reaches all of them.

Why open this way: today we cash that promise. In Part 4 they will add a token to
every request in the app by editing two lines in one file. That only lands as a
*payoff* if the promise is active in their head right now.
-->

---

## ...and what that costs us

Our app works. Anyone can also do anything. No account, no password, no login — and your deployed app is answering strangers right now.

**No browser. No account. Just a terminal.**

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { createExpense(input: {
        description: \"Dinner for the whole team\", amount: 900,
        date: \"2026-10-22\", payerId: 2, participants: [1,2]
      }) { id } }"}'
```

Then reload the list. A 900&nbsp;€ dinner, in somebody else's name.

<!--
Speaker notes:
• RUN IT. Live. On the projector. Then reload the browser and let them see the row.
• Then run the second one: { users { name email bankAccount } } — every bank account,
  to anyone who knows the URL. That is the one that makes the room go quiet.
• Ask BEFORE running: "the add form has a payer dropdown. If I delete the dropdown,
  does this still work?" Let them answer. Then run it. The dropdown was never involved.
• Do not explain the fix yet. Let it sit. The next 3 hours are the fix.
-->

---

# Part 1 — Who are you?

Two words that look alike, and are not:

- **Authentication** — *who are you?* You show a password, you get a token.
- **Authorization** — *may you do this?* Asked again on every single request.

A server can be completely sure who you are, and still be wrong about what you may do.

> People shorten both to "auth". Keep them apart in your head.

<!--
Speaker notes — this is the spine of the whole lecture. Slow down here.
• Give one concrete pair before moving on: "the bouncer checks your ID — authentication. The bouncer
  checks you are on the guest list — authorization. Same person, two jobs, and passing the first
  tells you nothing about the second."
• The sentence to land, and it is worth repeating: a server can be completely sure who you are and
  still be wrong about what you may do.
• Every exercise today is one or the other. Exercises 3-4 are authentication; exercise 5 onward is
  authorization. If they lose this distinction they will think the lesson is repetitive.
• Expect "isn't a login enough?" — yes for authn, no for authz. That IS exercise 6.
-->

---

## Never store a password

Store a **hash** of it. A hash goes one way — there is no `decrypt`.

```ts
const hash = await bcrypt.hash(plainPassword, 10);      // on register
const ok   = await bcrypt.compare(plainPassword, hash); // on login
```

- You never compare passwords. You hash the one that just arrived, and compare the hashes.
- If your database leaks, nobody's password leaks with it.
- That `10` is a **cost**: hashing takes ~100 ms. One login, nobody notices. An attacker wants billions.

> A fast password hash is a broken password hash.

<!--
Speaker notes:
• "Hashing is not encryption" is the most common confusion here. Say it twice.
• Ask: "I forgot my password, can you send it to me?" — if a site can, it is doing this wrong.
• The cost factor surprises them every year: slowness as a feature. Worth 30 seconds.
• Alternatives if asked: argon2 and scrypt are newer and good. bcrypt is 25 years old, unbroken,
  and installs cleanly everywhere. Boring is a feature too.
-->

---

## Adding the column is not free

Your `user` table already has four rows. You are adding a **NOT NULL** column.

```
addColumn(passwordHash, nullable)   ← 1. add it empty
dataTransform('backfill', …)        ← 2. fill it      ← you write this
setNotNull(passwordHash)            ← 3. lock it down
```

Prisma plans those three steps and leaves step 2 as a **placeholder** for you.

> It is not a Prisma quirk. There is no value the database could invent, so somebody has to choose one.

<!--
Speaker notes:
• THE SHORTCUT, say it out loud: all four demo users get `topsecret`. In a real product you would
  write an unguessable random value, different per row — the column fills, the constraint can go on,
  and NO account is reachable, because nobody (including you) knows a matching password. Everyone
  then goes through "forgot my password". That needs a password-reset feature, which we do not have,
  so it would lock us out. The migration is what you would write at work; only the VALUE is a course
  shortcut.
• They WILL hit this and read "placeholder" as an error. Say the word "question", not "error".
• Expect it any time a required column lands on a table with data in it — this is the general shape.
• Our choice: one known hash, so the demo users can log in. Next slide is why that is a shortcut.
-->

---

## The token

After a correct password, the server hands back a **JWT**.

```
eyJhbGciOiJIUzI1NiJ9 . eyJ1c2VySWQiOjMsImVtYWlsIjoi... . C_ChqvQyaNWwIeIUwbgg
    header                    payload                        signature
```

- Three parts, separated by dots
- The payload is **base64, not encrypted** — anyone can read it
- The signature is made with a secret only the server knows

> A token is **readable by everyone** and **forgeable by nobody**.

<!--
Speaker notes:
• Paste a real token into jwt.io on the projector. Watch them realise the payload is plain text.
• So: never put anything secret in a token. Assume the user has read it. Because they can.
-->

---

## Check: can they just edit it?

A user opens dev tools, finds their token in `localStorage`, changes `"userId": 3` to `"userId": 4`, and pastes it back. **What happens on the next request?**

**A.** They are now user 4. That is why `localStorage` is unsafe.
**B.** The server rejects it — the signature no longer matches
**C.** It works until the token expires, then it stops
**D.** Nothing — the browser will not let them edit `localStorage`

<!--
HINGE QUESTION — all hands up at once, fingers 1-4. 60 seconds.
Answer: B.
Diagnosis:
• A → has merged "readable" with "trustworthy". This is THE misconception of the lesson.
  Re-show the token slide: the signature is computed from the payload AND the secret.
  Change one byte of payload and the signature stops matching. They have no secret.
• C → thinks expiry is the only check. Ask: what checks the expiry? (The server, every time.)
• D → never opened dev tools on localStorage. Show them, live, in 20 seconds.
• Mostly B → they have it. Move on, and reuse this in Part 5 when we discuss localStorage:
  the risk there is theft of a VALID token, never forgery of a new one.
Do not take volunteers — you will only hear from the three who already know.
-->

---

## Issuing it

```ts
// after bcrypt.compare says yes
const token = jwt.sign(
  { userId: user.id, email: user.email },  // payload: readable by all
  JWT_SECRET,                              // signature: known only here
  { expiresIn: '7d' }
);
```

Two routes, and they are the only ones that work without a token:

| Route | What it does |
|---|---|
| `POST /api/auth/register` | create the account, return a token |
| `POST /api/auth/login` | check the password, return a token |

<!--
Speaker notes:
• Point at the payload and say it plainly: everything in those braces is PUBLIC. Anyone with the
  token can read it. We put the id and the email there because they are not secrets. Never put a
  password, a role they could lie about, or anything private in a JWT payload.
• The secret appears exactly once, here, on the server. That is the whole security model.
• `expiresIn: '7d'` is a trade-off, not a truth: short = safer, annoying; long = convenient, and a
  stolen token stays useful longer. There is no way to cancel a token we have already signed — that
  is the cost of not storing sessions.
• The table matters for the lab: these two routes must work WITHOUT a token, because they are where
  tokens come from. Every other route requires one. Students who guard everything lock themselves out.
-->

---

## Same guard — and say less than you know

`req.body` is a stranger's JSON. Login is the **most attacked endpoint you own**.

```ts
const input = parseLoginInput(req.body);   // the same Zod shape as lesson 5
if (input === false) {
  return res.status(401).json({ error: 'Invalid email or password' });
}
```

Wrong password and unknown email get **the same sentence**. The server knows the difference and refuses to say — different messages let anyone learn whether a person has an account.

> Being vaguer than you could be is a security decision.

<!--
Speaker notes:
• Direct callback to lesson 5's parseNewExpense — say the words "same rule". Validation belongs to
  the service boundary, not to one transport; that did not stop being true for passwords.
• The identical message is called preventing user enumeration. Ask them to name a site that gets
  this wrong — "this email is not registered" is everywhere, and it is a leak built out of
  helpfulness.
-->

---

# Part 2 — The border

A token arrives as a **string in a header**. A string proves nothing.

Somewhere, exactly once, that string has to become a **verified identity**.

In a GraphQL server that place has a name: the **context**.

<!--
Speaker notes:
• "A string proves nothing" is the sentence to repeat. A header is just text the client chose to
  send. Anyone can type `Authorization: Bearer hello`.
• Draw the boundary with your hand across the screen: above the context function, the token is an
  untrusted string; below it, it is a verified claim. One function, one crossing point.
• Why exactly once? Because a check repeated in twenty resolvers is a check forgotten in one of them.
  Verify at the border, and everything inside can trust what it is given.
• They build this in exercise 4, and every later exercise reads what it produces. If this slide does
  not land, the rest of the lecture does not either.
-->

---

## The context function

```ts
// src/graphql/yoga.ts
function graphQLContextFromRequest(request: Request): GraphQLContext {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.substring(7) : '';
  if (!token) return {};                                // no token → anonymous
  try {
    return { userJWT: AuthService.verifyToken(token) }; // checks the signature
  } catch {
    return {};                      // bad token → anonymous, not a crash
  }
}
```

Runs **once per request**, before any resolver. Each one gets it as `ctx`.

<!--
Speaker notes:
• `request.headers.get(...)` — Yoga speaks the Web Request API, not Node's req.headers.
  They WILL write req.headers.authorization and get undefined. Warn them now.
• Note what it does NOT do: it never refuses anything. "Nobody" is a valid answer here.
  Refusing is the resolver's job, and that separation is the next slide.
• Why in graphql/yoga.ts and not beside the type? A file in types/ describes shapes; it should not
  have to know AuthService exists. yoga.ts already imports a schema, a service and a type —
  wiring is its job, and the context is wiring.
• `userJWT`, not `user`. It is not a user — no name, no bank account, just the claims we signed.
  The field is `userId` not `id` so the call sites stay honest: ctx.userJWT.userId vs user.id.
  One you were told, the other you looked up.
• createYoga now lives in src/graphql/yoga.ts, so app.ts reads as a list of what the server exposes.
-->

---

## The shape of every request from now on

```text
  1. The browser        2. The context       3. The resolver      4. The answer
     sends a token  -->    checks it     -->    asks: may you?  -->   goes back

                          a bad token, or none,
                          arrives at step 3 as "nobody"
```

Step 2 asks **who are you**. Step 3 asks **may you do this**.

Different questions, different code, different slides.

<!--
Speaker notes:
• Walk the dotted arrow: a bad token does not stop here. It arrives at step 3 as "nobody",
  and step 3 is what says no. One place decides identity; many places decide permission.
-->

---

## Make it visible: `me`

Add the smallest possible resolver that reads the context:

```ts
Query: {
  me: (_p, _a, ctx) => (ctx.userJWT ? UsersService.getById(ctx.userJWT.userId) : null),
}
```

```
{ me { id name email } }

no token →  { "data": { "me": null } }
token    →  { "data": { "me": { "id": 3, "name": "John Doe" } } }
```

> If `me` is `null` while you are sending a token, the bug is in the context — not in a resolver.

<!--
Speaker notes:
• This is a debugging tool as much as a feature. It cuts "my auth doesn't work" in half:
  context broken, or guard broken. Tell them to reach for it all morning.
-->

---

# Part 3 — May you?

## One helper, asked everywhere

```ts
export function requireAuth(ctx: GraphQLContext) {
  if (!ctx.userJWT) {
    throw new AuthenticationError('You must be logged in');
  }
  return ctx.userJWT;       // returns the claims, so you cannot forget to check
}
```

```ts
expenses: (_p, args, ctx) => {
  requireAuth(ctx);
  return ExpensesService.getExpenses(args.filter ?? {});
},
```

Returning the user instead of a boolean is deliberate: the caller needs the id next anyway.

<!--
Speaker notes:
• They WRITE this one in the lab, so do not just read it out — ask the room why it returns the claims
  instead of true/false, and wait.
• The answer: every caller needs the id on the very next line. With a boolean, each one has to reach
  into the context again, and a caller that forgets to check still compiles. Returning the claims
  makes the check the only way to get the id — the right thing is also the easy thing.
• Note the shape of the resolver: one guard line, then the service call. Every guarded resolver in
  the lab looks exactly like this.
• Part 2 answered "who are you?". Part 3 asks "may you?". Same request, different question — this is
  the authentication/authorization split from slide 5, now in code.
-->

---

## The line the whole lesson is for

```ts
createExpense: (_p, args, ctx) => {
  const userJWT = requireAuth(ctx);

  if (userJWT.userId !== args.input.payerId) {
    throw new AuthorizationError('You can only create expenses that you paid for');
  }
  ...
}
```

The browser sends `payerId`. The browser belongs to the user.

**The only claim here the server signed itself is the one in the token.**

<!--
Speaker notes:
• If anyone asks what the server answers when the expense exists but is not yours: we answer 403.
  404 would leak less (it refuses to confirm the expense exists at all — walk the ids and you map
  the database) but 403 is clearer to the person on the other end, and this is an app for people who
  already know each other. A public service would choose differently. Name it as a DECISION if it
  comes up; do not spend a slide on it.
• Re-run the opening curl now, live, with the guards in place. It comes back refused.
• That before/after is the measurement of the whole morning. Do not skip the re-run.
• Then ask: "we still send payerId. Why not just take it from the token and delete the
  argument?" — a genuinely good design question with no single right answer. Let them argue.
-->

---

## Whose expenses does `expenses` return?

Everyone's. Read the name — it says *the* expenses, not *your* expenses.

```graphql
{ expenses { id } }           # every expense in the system
{ me { expenses { id } } }    # the expenses of whoever is asking
```

Two questions, two names. `requireAuth` on the first one only proved you are **somebody**.

> Being logged in is not the same as being allowed.

<!--
Speaker notes:
• Demo: log in as John, run { expenses { id } }. Log in as Jane, run it again. Same list.
• `expenses` is a legitimate thing to offer — an admin screen, a monthly report. It needs a
  PERMISSION, which is beyond this lesson. So we leave it open and leave the name honest.
• Why `me` and not `my`? `myExpenses`, `myTransfers`, `myCategories` fills the schema with
  near-duplicates. One `me` is one place that means "the current user". GitHub: viewer { repositories }.
• Their list page is titled "Your expenses" and was showing everybody's. Name the lie.
-->

---

## The "graph" in GraphQL

`User` in your code is `{ id, name, email, bankAccount }`. No `expenses` on it, no such column. You declared the field anyway.

```graphql
{ me {                  # a User
    expenses {          # ...to the Expenses it is connected to
      payer { name }    # ...and from each one, back to a User
} } }
```

`User → Expense → User`, in one request, with no new endpoint. A field is an **edge**, not a column.

> The schema is an API design, not a database dump.

<!--
Speaker notes:
• Run it live. The loop is the thing — they have seen nested selections before, but not one that
  comes back round to the type it started from.
• They HAVE written a field resolver: Expense.date in lesson 5. Name the difference — `date`
  reshaped a field that was already there, `expenses` invents one. That is the new idea.
• Ask: "what is the REST route for this?" (/users/me/expenses/payers — which somebody would have
  had to write on purpose, and then the next shape needs another one.) That is the contrast from
  lesson 5, now from the other side.
• Then the honest half: every edge is a function that runs once per node it is asked about. That is
  N+1, which was lesson 5's optional challenge. Adding edges is how you buy it.
-->

---

## Check: what does this return?

You added `expenses` to the `User` type, so `me { expenses }` works.
A logged-in user now runs:

```graphql
{ expenses { payer { name expenses { id description amount } } } }
```

**A.** An error — `expenses` only exists under `me`
**B.** Only their own expenses, repeated for each payer
**C.** Every other user's full expense history
**D.** `null` for the inner `expenses`

<!--
HINGE QUESTION — all hands up at once, fingers 1-4. 60 seconds.
Answer: C, unless you guarded the field. This is the slide that earns the lesson.
Diagnosis:
• A → thinks a field belongs to the query that reached it. It does not: `expenses` is a field on
  USER, and every path to a User can ask for it — `me`, `expense.payer`, `users`.
  Draw the three arrows into User on the board.
• B → assumes the resolver somehow knows who is asking. It gets `ctx`, but only if you use it.
• D → wishful thinking; nothing returns null here.
• Mostly C → good, and slightly alarming, which is right. The fix is a check ON THE FIELD:
  compare `user.id` with `ctx.userJWT.userId` and throw. One `if`.
Land this: a field is reachable by every path that leads to its type, not only the path you had
in mind when you wrote it. That is the GraphQL-specific lesson of the whole morning.
-->

---

## Errors that know their own status

```ts
export class AppError extends Error {
  constructor(message: string, statusCode: number, code: string) { ... }
}

export class AuthenticationError extends AppError {   // 401, 'UNAUTHENTICATED'
export class AuthorizationError  extends AppError {   // 403, 'FORBIDDEN'
```

Two classes, not six. The decision is made once, by the code that actually knows.

Yoga masks **every** resolver error by default. Teach it the exception:

```ts
maskedErrors: { maskError, isDev: process.env.NODE_ENV !== 'production' }
```

An `AppError` is a message we **chose** → it travels, with its `code`. Anything else is a bug → in production it says nothing.

<!--
Speaker notes:
• Two classes is the point. Resist building the full hierarchy — five more classes differing only in
  two literals teach nothing the second one did not.
• Ask: "who decides whether a failed login is a 400 or a 401?" The answer should be "the code that
  threw it", and that is the whole slide.
• The two fields do different jobs and both are needed: the REST route reads statusCode, the GraphQL
  client reads code. Without them every catch block guesses, and they guess differently.
• maskedErrors is the bit they will skip and then lose an hour to. Say plainly: without it, EVERY
  resolver error reads "Unexpected error." and all debugging looks identical.
-->

---

# Part 4 — The frontend

## Two lines, in one file

```ts
const token = getToken();

const response = await fetch(`${API_BASE_URL}/graphql`, {
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  },
```

**One file edited.** Every loader and every mutation now authenticates. Last week's promise, paid.

```ts
if (errors[0]?.extensions?.code === 'UNAUTHENTICATED') { clearToken(); window.location.href = '/login'; }
```

That is **the** expiry check. Not a timer — the browser's clock is the user's clock.

<!--
Speaker notes:
• This is the emotional payoff of lesson 5. Say it out loud: "remember the file we wrote for no
  visible reason? This is why." One file edited, every loader and mutation authenticated.
• `token ? ... : {}` matters — a header reading "Bearer null" is worse than no header, because the
  server will try to verify it and fail.
• On expiry: the server checks the signature and the expiry on EVERY request, so we find out the way
  everyone else does — we are told. A timer in the browser would be guessing with the user's clock.
• Warn them: `me` answers null rather than throwing, so the list loader must treat a null `me` as
  logged out. `?? []` there turns "your token died" into "you have no expenses", which is how an app
  ends up silently logged out.
-->

---

## Holding the session

`AuthContext` keeps two things: the **token** (for the server) and the **user** (for the greeting).

```tsx
const [token, setTokenState] = useState(getToken);   // read once, on first render
```

- Reading `localStorage` in the initialiser, not a `useEffect`, is what stops the app flashing "logged out" for one frame on every refresh
- The login response already told us the user — so we store it, instead of decoding the token

> One less dependency, and one less thing to get wrong.

<!--
Speaker notes:
• The initialiser-vs-useEffect point is small and very visible: read localStorage in useState's
  initialiser and the app never flashes "logged out" on refresh. Do it in a useEffect and it does,
  every single time. Worth demonstrating if you have the app open.
• Why store the user instead of decoding the token? The login response already told us. Decoding is
  work you have been given the answer to, plus a dependency.
• No expiry timer here, deliberately — the previous slide is where that is handled.
-->

---

## Guard before the loader, not in a component

A `<ProtectedRoute>` component **cannot work here**. Lesson 5: a route's **loader runs before its component** — so the fetch already went out and came back refused.

React Router runs **middleware** on the way down, before loaders:

```ts
export const requireAuth: MiddlewareFunction = ({ request }) => {
  if (!getToken()) throw redirect(`/login?from=${...}`);
};
```

```tsx
{ middleware: [requireAuth], children: [ /* every private route */ ] }
```

One line. Everything nested under it is covered.

<!--
Speaker notes:
• MEASURED, all three ways, logged out on /expenses:
    component guard  -> POST /graphql fires, 401, error screen, hard page reload
    guard in loader  -> works, but you wrap every loader by hand
    middleware       -> ZERO backend requests, clean redirect, one declaration
• `throw redirect(...)` is the same move as lesson 5's `throw new Response(...)`: a loader (or a
  middleware) either produces data or throws. Say that out loud — they will recognise it.
• Middleware is stable in React Router 8 and works in data mode. It runs parent-to-child on the way
  down, then child-to-parent on the way back up.
• The indentation in the route table now SHOWS which pages need an account. That is the readable
  part everyone wants from <ProtectedRoute>, without the broken part.
-->

---

## And it is still not security

- It stops a logged-out user landing on a page that can only show an error
- Anyone can edit their own JavaScript and delete it
- A hidden button is still a button
- The `curl` from this morning never loaded your JavaScript at all

> Every frontend check is a suggestion. The browser belongs to the user, not to you.

The protection is `requireAuth`, in your resolvers. It is the only one.

<!--
Speaker notes:
• Say the distinction plainly: protectedLoader is the difference between an app that is RUDE when
  you are logged out and one that is not. It is not the difference between safe and unsafe.
• Good closing question: "I delete protectedLoader from my copy of your JS. What can I now see?"
  (The login-less pages render — and every query on them is refused by the server.)
-->


---

## Check: what can they actually see?

A student edits **their own copy** of your frontend, deletes `requireAuth` from
`middleware: [requireAuth]`, rebuilds, and opens `/expenses` while logged out.

**What can they now see?**

**A.** The expenses list — the guard was the only thing stopping them
**B.** The page frame, but no expenses — the server refuses the query
**C.** Nothing — the server rejects the page itself
**D.** The list, but only until the token expires

<!--
HINGE QUESTION — all hands up at once, fingers 1-4. 60 seconds. Answer: B.
This is the lesson's thesis, and until now nothing has tested it.
Diagnosis:
• A → believes the frontend guard IS the protection. THE misconception of the whole lesson, and the
  one they carry into real jobs. Re-run this morning's curl live: it never loaded their JavaScript
  at all, so deleting JavaScript changes nothing about it.
• C → thinks this server serves the page. It does not — Vite does. Same confusion will bite on the
  CSP slide in two minutes, so fix it here.
• D → thinks expiry is the gate. The signature is checked on EVERY request, not just at expiry.
• Mostly B → they have it. The page renders and every query on it is refused. Move to Helmet.
Do not take volunteers — you will only hear from the three who already know.
-->
---

# Part 5 — Honest limits

## Helmet

```ts
app.use(helmet({ contentSecurityPolicy: false }));
```

Helmet sets headers that turn off risky browser behaviour:

- `X-Content-Type-Options: nosniff` — do not guess that our JSON is a script
- `X-Frame-Options` — do not let another site frame our responses
- `Referrer-Policy` — do not leak our URLs to sites the user clicks through to

It can set more (HSTS, cross-origin policies). We take the defaults and stop. Tuning them is a
security course, and this is not one.

<!--
Speaker notes:
• One line, real value, move on. The interesting half is the next slide.
-->

---

## Why the CSP is off — and where it goes instead

A CSP governs an **HTML page**. This server answers JSON — except `/graphql`, which serves GraphiQL.

```ts
app.use(yoga.graphqlEndpoint, helmet.contentSecurityPolicy({
  directives: {
    'style-src':  ["'self'", 'unpkg.com', "'unsafe-inline'"],
    'script-src': ["'self'", 'unpkg.com', "'unsafe-inline'"],
    'img-src':    ["'self'", 'raw.githubusercontent.com'],
  },
}), yoga);
```

GraphiQL loads its editor from a CDN, so it needs those three. **On that route only.**

> A policy that one page needs does not belong on everything.

<!--
Speaker notes:
• MEASURED: with Helmet's default CSP, GraphiQL is a blank page forever — "Loading __TITLE__...",
  console full of CSP errors, and nothing tells you the header you added is the cause.
  Plain helmet() does it too. Demo it live if you have two minutes; it lands hard.
• These are the directives Yoga documents, plus 'unsafe-inline' on style-src — without that the
  editor loads but loses its syntax colouring (it colours tokens with inline styles).
• The shape to teach: a policy one page needs belongs on that page, not on everything.
• Ask the room: "where does our React app's HTML come from?" (Vite, then your static host —
  a different server. That is where a CSP would actually protect a user.)
-->

---

## What we did not build

- **Refresh tokens** — ours last 7 days and cannot be revoked. Log out is local only.
- **Rate limiting** — nothing stops 10 000 login attempts a minute.
- **Password rules, reset, email confirmation** — all of it.
- **Getting the token out of `localStorage`** — any script on your page can read it. OWASP says do
  not store credentials there; an `httpOnly` cookie trades that XSS risk for a CSRF one.
- **A permission on `expenses`** — any signed-in user can still ask for everybody's.

That last one is a naming decision we made on purpose. The others are real products' real work.

> "Secure" is not a state you reach. It is a list you keep shortening.

<!--
Speaker notes — tone matters here. This is not an apology, it is professional honesty.
• The point is not that we did a bad job; it is that "secure" is never a box you tick. Every real
  product has this list, and the good teams know what is on theirs.
• `expenses` staying open is a DECISION, not an oversight — the name says "all of them", and
  deciding who may ask is a permissions lesson we have not had. The others are genuine gaps.
• localStorage: do not oversell the cookie fix. It trades an XSS risk for a CSRF one, and that is
  the honest shape of most security choices — not a win, a trade you can name.
• If you have a minute, ask: "which of these would you fix first, and why?" There is no right
  answer; the reasoning is the point.
-->

---

## Before you go — without looking

Close the laptop. Answer these three, in sentences, to the person next to you.

1. You deleted `requireAuth` from your own browser. **What can you still not do, and why?**
2. Your token sits in `localStorage` where anyone can edit it. **So why can you not make yourself
   user 1?**
3. `{ expenses }` and `{ me { expenses } }` both need a login. **What is the difference?**

*Then go and build it. The lab is where this actually sticks.*

<!--
Speaker notes — RETRIEVAL, not a recap. Do not read them the answers; let them struggle for 90
seconds, take one answer each from the room, then correct. Trying and failing to recall is what
makes it stick — a bullet list read aloud does nothing.

The answers, for correcting:
1. Nothing changes server-side. requireAuth in the resolvers still refuses every query. The frontend
   guard is politeness; curl never loaded it.
2. The signature is computed over the payload AND a secret only the server has. Change one byte of
   payload and it stops matching. Readable by everyone, forgeable by nobody.
3. A naming decision. `expenses` means THE expenses — everybody's. `me { expenses }` means the
   caller's. Same login, different question, and the permission lives on the field.

If any of the three falls flat, that is the one to re-open at the start of next week — not the one
to re-explain now with five minutes left.
-->
