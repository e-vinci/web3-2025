---
marp: true
theme: default
paginate: true
header: 'Web 3 2026 - Environments, forms and migration'
footer: 'Web 3 2026 - Vinci'
---

# End of lesson 2 : Render Assessment

> What we want to achieve: automatically reproduce a workspace environment where we automatically build backend application and update frontend files from git directory.

At this state we should have (final objectives of prev. week):
- a PostGRSQP database with some data:
  - This database is a declared as a service in Redender,
  - we should have a private URL linked to that database,
- a backend application that can connect to the database
  - the connection is performed with an environment variable in the backend project,
- a frontend application that can connect to the backend application
  - the connection is "created" into the environment variable of the frontend project,

---

## The environments

- The "dev" env:
  - backend: Express, local port : 3000
  - frontend: vite server, local port : 5317
  - database: docker 
    - the database port inside the contener: 5432
    - the vm port: 5333 (-> see error during previous ex. session " authentification error")
- The "production" env:
  - in the Saas solution : Render
  - 3 local VM with backend, frontend, db
  - defined with private/public URL
- (still a good practice) The "staging" env

<!--
The staging env is the environment where we test the application before deploying it to the production environment. We are "as close as possible" to the production environment with dummy data.
-->

> One place to configure the environments : `.venv` files

---

# End of lesson 2 : PRISMA
<!--TODO: find a better explanation, trop brouillon-->

(also an objective of last week exercice)

- Prisma is an ORM (Object-Relational Mapping) tool for Node.js and TypeScript.
  - "it leaves between the backend and the database".
  - It allows you to define your database schema in a declarative way using a schema file.
    - You are using it in any service that deals with a ressource in db (user, expense, etc.).
    - "data base schema": you define the object in a `.prisma` file where you declare variables and types. It abstracts the real declaration in the database.

---

## Prisma Client

- prisma client: an executable installed in the project (see `package.json` "devDependencies" section package "@prisma/cli-engine"), located in the `node_modules` folder.
  - example: `npx prisma generate` (npx = node package executor)
  - Note: not present in production env in `package.json`
- prisma client generated code in our code based 
- Some code we can use to interact with your database:
  - `src/prisma/db.ts`
    - see the usage of the env varibale

```ts
// src/prisma/db.ts
export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});
```

### Contracts

```ts
// src/prisma/db.ts
export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});
```

The "db" object has two inputs :
- The DATABASE_URL
- Contract Type.

The `contract.d.ts` file is autogenerate by the prisma client. We we perform a `prisma generate` command, the prisma client will generate the `contract.d.ts` file based on the schema defined in the `.prisma` file.

> We want to run the command `prisma generate` command every time we update our database object files.

> We emit the contract on the git.

<!--
TODO: find valid arguments about publishing on the git. Need to dig.
-->

---

### package.json

See that prisma client updated your `package.json` file in our backend ? It added a command

```json
{
  "scripts":{
    "contract:emit": "prisma contract emit"
  }
}
```

With prisma our builds become a litter more complex

```json
{
  "scripts":{
    "build": "npm install && npm run contract:emit && npx prisma db update",
    "contract:emit": "prisma contract emit"
  }
}
```

<!--TODO: find a valid template, this is just mine.-->

---

How are ***your environments*** deployed ?

- dev ?
  - docker ? working ? (auth error -> change port in docker "5433:5432")
- prod ?
  - db ? private URL ?
  - backend ? npm cmds ? env configured ?
  - frontend ? should be fine if env configured ;)
- In Red

<!--
Rise your hands if it's working in dev ? Prod ?
-->

> After the intro that's your starting point if it's not working!

---

> And now ... something different ... !

---

# Lesson 3.1 : Forms

---

## HTML Forms: The Basics

- **Form**: Collects user input and sends it to the server.
- **Elements**: `<form>`, `<input>`, `<select>`, `<button>`, etc.
- **Submit**: Sends the data to server and handle response (usually redisplay or redirect).

```html
<form action="/api/expenses" method="post">
  <input name="description" />
  <input name="amount" type="number" />
  <button type="submit">Add</button>
</form>
```

---

## Why Forms Are Complex in React

- **Interactivity**: React wants to control form state for instant feedback.
- **Controlled Components**: Each input's value is tied to React state.
- **Validation**: Must check user input before submit.
- **Error Handling**: Show errors, disable submit, etc.
- **Boilerplate**: Lots of code for even simple forms.

---

```tsx
import { useState } from 'react';

function ExpenseAdd() {
  /* One state per input field */
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<{ description?: string; amount?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    const newErrors: typeof errors = {};
    if (!description) newErrors.description = 'Description required';
    if (!amount || parseFloat(amount) < 0.01) newErrors.amount = 'Amount required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      console.log({ description, amount: parseFloat(amount) });
      // TODO: Reset form's values, then send to API
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
      {errors.description && <span>{errors.description}</span>}
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
      {errors.amount && <span>{errors.amount}</span>}
      <button type="submit">Add</button>
    </form>
  );
}
```

---

## Benefits of React Hook Form

`react-hook-form` is a popular **library** for handling forms in React.

- **Less Boilerplate**: Register fields, get values, and validate with minimal code.
- **Performance**: Minimizes re-renders.
- **Easy Validation**: Integrates with libraries like Zod.
- **Better UX**: Built-in error handling, field-level validation.
- **Flexible**: Works with controlled and uncontrolled components.

[React Hook Form Docs](https://react-hook-form.com/)

---

## Example: React Hook Form with Validation

```tsx
import { useForm } from 'react-hook-form';

function ExpenseAdd() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const onSubmit = (data) => console.log(data); // define what to do with validated data

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('description', {
          required: 'Description required',
          maxLength: { value: 100, message: 'Max 100 chars' },
        })}
        placeholder="Description"
      />
      {errors.description && <span>{errors.description.message}</span>}
      <input
        type="number"
        step="0.01"
        {...register('amount', { required: 'Amount required', min: { value: 0.01, message: 'Must be positive' } })}
        placeholder="Amount"
      />
      {errors.amount && <span>{errors.amount.message}</span>}
      <button type="submit">Add</button>
    </form>
  );
}
```

---

## Introducing Zod: TypeScript-first Schema Validation

`zod` is a popular **library** for schema validation in TypeScript.

<!-- - **Zod** is a TypeScript-first schema declaration and validation library -->
- **Why Zod?**
  - Type-safe validation for objects, forms, and APIs
  - Works great with React Hook Form
  - Generates types from schemas automatically
- **Alternatives**: Yup, Joi, class-validator

[Zod Documentation](https://zod.dev/)

---

## Example: Validating an Expense with Zod

```typescript
import { z } from 'zod';

// Define a schema for an expense
const ExpenseSchema = z.object({
  description: z.string().min(1, 'Description required').max(100, 'Max 100 chars'),
  amount: z.number().min(0.01, 'Amount must be positive'),
  payer: z.enum(['Alice', 'Bob'], { errorMap: () => ({ message: 'Payer must be Alice or Bob' }) }),
  date: z.string().optional(),
});

// Example usage
const result = ExpenseSchema.safeParse({
  description: '',
  amount: -5,
  payer: 'Charlie',
});

if (!result.success) {
  console.log(result.error.format());
  // Shows validation errors for each field
}
```

--- 

### Prisma and Zod

> Both use schema definitions to 
>   - validate data (Zod)
>   - generate types (Prisma) in order to "abstract" the database

Schema definition  
- ways to easily manage the future modifications of data/properties management along the time.
- define the structure of the data
- define the validation rules for the data
- define the types for the data

---

# Lesson 3.2 : Migration

What We're Building Today

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

## Feature-Based Architecture (layer 1: Controller)

```typescript
// routes/expense.router.ts
expensesRouter.post("/", async (req, res) => {
  try {
    const expense: Expense = req.body;
    if (!isValidNewExpense(expense)) {
      return res.status(400).json({ error: "Invalid expense" });
    }
    const expenses = await ExpensesService.addExpense(expense);
    res.status(201).json(expenses);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
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

## Feature-Based Architecture (layer 2: Service)

```typescript
// services/expense.service.ts
public static async addExpense(newExpense: NewExpense): Promise<Expense> {  
  try {
    const expense = await db.orm.public.Expense.create(newExpense);
    return {
      id: expense.id.toString(),
      date: expense.date,
      amount: expense.amount,
      description: expense.description,
      payer: expense.payer,
    };
  } catch (error) {
    console.error("Error adding expense:", error);
    throw error;
  }
}
```
<!--
Speaker Notes:
• Service handles business logic
• Keeps controllers thin and focused on HTTP concerns
• Makes code more testable and maintainable
Repositories handle data access
• Managed by Prisma
-->

---

## Prisma: prisma.config.ts

Config is automatically generated by `npm init prisma`.

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
• Connection string and file paths live in prisma.config.ts
• Import from @prisma/orm-postgres/config — this is what selects PostgreSQL
• Run: npm install @prisma/orm-postgres
• The contract key points at your contract.prisma file
-->

---

## Prisma: Many-to-Many Relations

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

## Prisma: Migration Workflow

### Development

```bash
npx prisma contract emit                              
npx prisma migration plan --name add-users-and-transfers
npx prisma db migrate --advance-ref db              
```

First command generates the contract files (contract.json and contract.d.ts) from the contract.prisma file.

Second command generates the migration file (migration.ts) from the contract files.

Third command applies the migration to the development database.

### Production

```bash
npx prisma db migrate
```

This command applies the migration to the production database.

<!--
Speaker Notes:
• Three-step loop: emit → plan → migrate
• prisma contract emit reads contract.prisma, writes contract.json + contract.d.ts
• prisma migration plan generates a TypeScript migration.ts file to review
• prisma db migrate applies pending migrations to the database
• --advance-ref db records which contract state was applied (for dev)
• No more db push — use db init (new DB) or db update (existing DB) instead
-->

---

# Custom Migration: TypeScript

File automatically generated by the command `prisma migration plan`.

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


