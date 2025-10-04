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

---

# Database Relations with Prisma

```prisma
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

<!--
Speaker Notes:
• Introducing proper relational data modeling
• One user has many relationships: pays, participates, sends, receives
• Relation names required when multiple relations between same models
• Much better than storing comma-separated strings
• Database enforces referential integrity
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
```

<!--
Speaker Notes:
• One expense has one payer but multiple participants
• Prisma creates implicit join table for many-to-many relation
• Much cleaner than storing comma-separated participant names
• Database handles the complexity of relationships
• Can query participants easily with include
-->

---

# Prisma Migrations vs DB Push

## Development

```bash
npx prisma migrate dev --name add-users-and-transfers
```

## Production

```bash
npx prisma migrate deploy
```

<!--
Speaker Notes:
• Moving from db push to proper migrations
• Migrations give version control for database schema
• Can preserve data during schema changes
• Ensures consistent deployments across environments
• Dev creates and applies migrations, deploy only applies existing ones
• Critical for production applications
-->

---

# Custom Migration Example

```sql
-- Insert User records from existing Expense.payer data
INSERT INTO "User" ("name", "email")
SELECT DISTINCT
    "payer" as "name",
    LOWER(REGEXP_REPLACE("payer", '[^a-zA-Z0-9]', '.', 'g')) || '@expenso.dev' as "email"
FROM "Expense"
WHERE "payer" IS NOT NULL;

-- Add payerId column as nullable first
ALTER TABLE "Expense" ADD COLUMN "payerId" INTEGER;

-- Update payerId with corresponding User IDs
UPDATE "Expense"
SET "payerId" = "User"."id"
FROM "User"
WHERE "User"."email" = LOWER(REGEXP_REPLACE("Expense"."payer", '[^a-zA-Z0-9]', '.', 'g')) || '@expenso.dev';
```

<!--
Speaker Notes:
• Sometimes need custom migration logic to preserve data
• Converting string payers to User references
• Create users from existing data first
• Add foreign key column as nullable, populate it, then make required
• Prevents data loss during schema evolution
• SQL gives us fine control over migration process
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
- **Migrations > DB Push**: Version control for your database
- **Loaders > useEffect**: Declarative data fetching
- **Layout routes**: Share state and UI across pages
- **Type safety**: TypeScript prevents runtime errors
- **Separation of concerns**: Keep components focused on presentation

<!--
Speaker Notes:
• These patterns might seem like extra work now
• Pay dividends as application grows
• Make code more predictable, testable, maintainable
• Building habits for professional development
• Foundation for scaling to larger teams
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
