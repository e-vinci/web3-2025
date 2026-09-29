---
marp: true
theme: default
class: lead
paginate: true
header: 'Web 3 2025 - Recap'
footer: 'Web 3 2025 - Vinci'
backgroundColor: #fff
backgroundImage: url('https://marp.app/assets/hero-background.svg')
---

# Lesson 4: Advanced State Management

## From Prototype to Production Architecture

<!--
Speaker Notes:
• Welcome to lesson 4 - big leap forward today
• Transforming simple expense tracker into multi-user application
• Two main areas: backend modernization + frontend state management
• Moving from prototype to production-ready architecture
-->

---

# What We're Building Today

- **Multi-user expense sharing app**
- **Money transfers between users**
- **Production-ready backend architecture**
- **Advanced React Router patterns**

<!--
Speaker Notes:
• Users can create accounts and share expenses with friends
• Transfer money to settle debts between users
• Moving from simple CRUD to real-world application
• Learning patterns used in professional development
-->

---

# Backend: Modern Express TypeScript

## From Simple to Structured

```
backend/
├── src/
│   ├── api/
│   │   ├── user/
│   │   ├── expense/
│   │   └── transfer/
│   ├── common/
│   └── server.ts
```

<!--
Speaker Notes:
• Replacing Express generator with modern TypeScript setup
• Better organization, type safety, built-in security
• Testing infrastructure included
• Each feature gets own folder - clear separation of concerns
-->

---

# Feature-Based Architecture

```typescript
// api/expense/expenseController.ts
export async function createExpense(req: Request, res: Response) {
  const { description, amount, payerId, participantIds } = req.body;

  const newExpense = await expenseRepository.createExpense({
    description,
    amount: parseFloat(amount),
    payerId: Number(payerId),
    participantIds: participantIds,
  });

  res.status(StatusCodes.CREATED).json(newExpense);
}
```

<!--
Speaker Notes:
• Consistent pattern: Router → Controller → Repository
• Controllers handle HTTP concerns, repositories handle data access
• Makes code predictable and testable
• TypeScript catches errors at compile time
• Notice proper status codes and type conversions
-->

<!--
---

# Database Relations with Prisma 8

Why this is usefull ? Strange pattern... putting paidExpenses and participatedExpenses in the User model...?
What's the objective of this slide?

```prisma
// use prisma-8   ← required first line in every contract file

model User {
  id          Int     @id @default(autoincrement())
  name        String
  email       String  @unique

  paidExpenses         Expense[] @relation("PayerExpenses")
  participatedExpenses Expense[] @relation("ParticipantExpenses")
  transfersOut         Transfer[] @relation("UserTransfersSource")
  transfersIn          Transfer[] @relation("UserTransfersTarget")
}
```
-->

<!--
Speaker Notes:
• Every contract file must start with "// use prisma-8"
• Relation names still required when multiple relations between same models
• One user has many relationships: pays, participates, sends, receives
-->

---

# Prisma 8: prisma.config.ts

```typescript
// prisma.config.ts
import 'dotenv/config';
import { definePrismaConfig } from 'prisma/config';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

export default definePrismaConfig({
  orm: ormConfig({
    contract: './src/prisma/contract.prisma',
    db: {
      connection: process.env.DATABASE_URL!,
    },
  }),
});
```

<!--
Speaker Notes:
• In Prisma 8 the datasource and generator blocks no longer exist in the schema
• Connection string and file paths live in prisma.config.ts instead
• Import from @prisma/orm-postgres/config — this is what selects PostgreSQL
• Run: npm install @prisma/orm-postgres
• The contract key points at your contract.prisma file
-->

---

# Many-to-Many Relations

```prisma
model Expense {
  id           Int      @id @default(autoincrement())
  description  String
  amount       Float
  payer        User     @relation("PayerExpenses", fields: [payerId], references: [id])
  payerId      Int
  participants User[]   @relation("ParticipantExpenses")
}

model ExpenseParticipant {
  expenseId Int
  userId    Int
  expense   Expense @relation("ParticipantExpenses", fields: [expenseId], references: [id])
  user      User    @relation("ParticipantExpenses", fields: [userId], references: [id])

  @@id([expenseId, userId])
}
```

<!--
Speaker Notes:
• One expense has one payer but multiple participants
• Prisma 8 requires an explicit join model — no more implicit many-to-many
• ExpenseParticipant is the join table; its @@id must be exactly the two foreign keys
• Relation names disambiguate: User has two relations to Expense
• Query participants with .include("participants") — join model is transparent
-->

---

# Prisma 8: Migration Workflow

## Development

```bash
npx prisma contract emit                              
npx prisma migration plan --name add-users-and-transfers
npx prisma db migrate --advance-ref db              
```

## Production

```bash
npx prisma db migrate
```

<!--
Speaker Notes:
• Three-step loop replaces migrate dev: emit → plan → migrate
• prisma contract emit reads contract.prisma, writes contract.json + contract.d.ts
• prisma migration plan generates a TypeScript migration.ts file to review
• prisma db migrate applies pending migrations to the database
• --advance-ref db records which contract state was applied (for dev)
• No more db push — use db init (new DB) or db update (existing DB) instead
-->

---

# Custom Migration: TypeScript

File automatically generated by `prisma migration plan`.

```typescript
// migrations/app/20260101T0000_add-users-and-transfers/migration.ts
override get operations() {
  return [
    this.addColumn({ schema: 'public', table: 'Expense',
      column: col('payerId', 'int4', {}) }),

    this.dataTransform(endContract, 'backfill-expense-payerId', {
      // check: rows still needing the backfill
      check: () => db.public.Expense.select('id')
        .where((f, fns) => fns.eq(f.payerId, null)).limit(1),
      // run: set payerId from payer string via raw SQL
      run: () => db.public.Expense
        .update({ payerId: 1 }) // replaced by rawSql in real migration
        .where((f, fns) => fns.eq(f.payerId, null)),
    }),

    this.setNotNull({ schema: 'public', table: 'Expense', column: 'payerId' }),
    this.dropColumn({ schema: 'public', table: 'Expense', column: 'payer' }),
  ];
}
```

<!--
Speaker Notes:
• Prisma migrations are TypeScript files
• migration plan auto-generates the skeleton with placeholders
• dataTransform handles the backfill: check finds remaining rows, run fixes them
• addColumn → dataTransform → setNotNull is the safe 3-step pattern for required cols
• Edit migration.ts then recompile: node migrations/app/<dir>/migration.ts
• Commit migration.ts, ops.json, migration.json, and snapshot dirs
-->

---

# React Router Data APIs

## Old Way: useEffect + useState

```tsx
function ExpenseList() {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    fetch('/api/expenses')
      .then((res) => res.json())
      .then(setExpenses);
  }, []);
}
```

<!--
Speaker Notes:
• Traditional approach puts data fetching inside components
• Creates loading states and error handling complexity
• Makes components less focused on presentation
• Data fetching mixed with UI logic
• Harder to cache and prefetch data
-->

---

# React Router Data APIs

## New Way: Loaders

```typescript
// pages/loader.ts
export async function loader() {
  const transactions = await ApiClient.getTransactions();
  return { transactions };
}

// Component.tsx
export default function TransactionsList() {
  const { transactions } = useLoaderData<LoaderData>();

  return (
    <div>
      {transactions.map(transaction => ...)}
    </div>
  );
}
```

<!--
Speaker Notes:
• Loaders move data fetching out of components
• Data fetched before route renders - eliminates loading states
• Components become pure presentation logic
• Better separation of concerns
• Enables caching and prefetching
• React Router handles the data flow
-->

---

# Layout Routes & Outlet Context

```tsx
// Layout/Component.tsx
export default function Layout() {
  const { users } = useLoaderData<LoaderData>();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const outletContext = { currentUser };

  return (
    <div>
      <Navbar />
      <UserSelector onChange={setCurrentUser} />
      <Outlet context={outletContext} />
    </div>
  );
}
```

<!--
Speaker Notes:
• Layout routes share UI and state across multiple pages
• Outlet renders child routes with shared context
• Perfect for user selection, navigation, global UI elements
• Avoids prop drilling for common state
• Clean way to structure multi-page applications
-->

---

# Accessing Outlet Context

```tsx
// Child route component
import { useOutletContext } from 'react-router';

export default function NewExpense() {
  const { currentUser } = useOutletContext<{ currentUser: User }>();

  if (!currentUser) {
    return <div>Please select a user first</div>;
  }

  // Use currentUser for form logic...
}
```

<!--
Speaker Notes:
• Child routes access outlet context with useOutletContext hook
• Clean way to share state without prop drilling
• Type-safe access to shared data
• Can conditionally render based on context
• Alternative to React Context for route-specific state
-->

---

# Combining Different Data Types

```typescript
export type Transaction = {
  id: string;
  type: 'expense' | 'transfer';
  amount: number;
  date: Date;
  description: string;
  // Different fields based on type
} & (ExpenseTransaction | TransferTransaction);

type ExpenseTransaction = {
  type: 'expense';
  payer: User;
  participants: User[];
};

type TransferTransaction = {
  type: 'transfer';
  source: User;
  target: User;
};
```

<!--
Speaker Notes:
• Combining expenses and transfers into unified Transaction type
• Using discriminated unions for type safety
• Display different types together in one list
• TypeScript knows which fields available based on type field
• Clean way to handle heterogeneous data
-->

---

# API Layer Separation

```typescript
// lib/api.ts
class ApiClient {
  async getTransactions(): Promise<Transaction[]> {
    const response = await fetch('/api/transactions');
    return response.json();
  }

  async createExpense(expense: CreateExpenseRequest): Promise<Expense> {
    const response = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
    return response.json();
  }
}

export default new ApiClient();
```

<!--
Speaker Notes:
• Centralize all API calls in dedicated module
• Easy to add error handling, authentication in one place
• Request/response transformation centralized
• Components don't need to know about HTTP details
• Better testing and mocking capabilities
• Consistent API patterns across app
-->

---

# Module Organization

```
pages/
├── index.ts              # Re-exports
├── loader.ts             # Data loading
├── Component.tsx         # React component
├── ExpenseDetails/
│   ├── index.ts
│   ├── loader.ts
│   └── Component.tsx
└── NewExpense/
    ├── index.ts
    ├── action.ts         # Form submission
    └── Component.tsx
```

<!--
Speaker Notes:
• Organize code by feature, not by file type
• Each page gets own folder with loader, component, action files
• Index.ts files provide clean imports
• Scales much better than all components in one folder
• Easy to find related files
• Supports feature-based development teams
-->

---

# Key Takeaways

- **Structure matters**: Feature-based organization scales better
- **contract.prisma > schema.prisma**: Prisma 8 renames the file, adds `prisma.config.ts`
- **Explicit join models**: No implicit many-to-many in Prisma 8
- **TypeScript migrations**: `migration plan` → review `migration.ts` → `db migrate`
- **Loaders > useEffect**: Declarative data fetching
- **Layout routes**: Share state and UI across pages

<!--
Speaker Notes:
• These patterns might seem like extra work now
• Pay dividends as application grows
• Prisma 8 migration workflow: emit → plan → migrate (replaces migrate dev/deploy)
• Explicit join tables give you full control over many-to-many relations
• TypeScript migrations are type-checked against your contract
• Industry best practices
-->

---

# Questions?

Ready to build a real application? 🚀

<!--
Speaker Notes:
• Any questions before diving into exercises?
• Transforming from simple prototype to production-ready architecture
• Big step but each piece builds on concepts you already know
• Focus on understanding the patterns, not memorizing syntax
• Apply these concepts in the hands-on exercises
-->
