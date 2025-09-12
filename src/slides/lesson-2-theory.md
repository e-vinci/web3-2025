---
marp: true
theme: default
paginate: true
header: 'Web 3 2025 - Deploy & Persistence'
footer: 'Web 3 2025 - Vinci'
---


# Theoretical Introduction

## Lesson 2 – Deployment and Persistence

---

# Hosting

---

> I don't care that it runs on your machine - we are not shipping your machine

---

## Hosting: From Bare Metal to PaaS

- **Bare Metal**: Physical servers you manage yourself
- **Virtual Machines (IaaS)**: Cloud providers (AWS EC2, Azure VM) give you virtual servers (you get the machine & the OS, rest is on you)
- **Containers (CaaS)**: Run your app in containers (Docker, Kubernetes)
- **Platform as a Service (PaaS)**: Providers like Render, Heroku, Vercel manage the platform for you (easy deploy, scaling, SSL, etc)
- **Managed Database**: A database service (Postgres, MySQL, MongoDB, etc) where the provider handles backups, scaling, security, and updates for you

---

> In small teams, we want to focus our time on shipping feature. Infrastructure #1 perk is "can be put online in 30 minutes tops

> People are more expensive than servers. Anything that double your server cost but reduce dev hours of work is almost certainly a win, financially speaking

---

## What is Render?

- **PaaS**: Platform as a Service for web apps, APIs, static sites, and databases
- **Features**: Easy Git-based deploys, free SSL, custom domains, background workers, cron jobs
- **Managed Postgres**: One-click database setup, automatic backups
- **Great for students and prototypes**: Free tier, simple UI

> We selected it because they have a free tier that does not ask for a credit card, so good fit for us. There are limitation, but we'll live with them.

[Render Documentation](https://render.com/docs)

---

## Environments & Environment Variables

- **Local**: Your development machine (localhost)
- **Production**: The live, public version of your app
- **Environment Variables**: Key-value pairs (API keys, DB URLs, secrets) set outside your code
- **.env files**: Store environment variables for local dev, never commit secrets to git!

> Same code, different data, different variables

```env
# .env example
VITE_API_URL=http://localhost:3000
DATABASE_URL=postgres://user:pass@host:port/db
```

---

# Prisma and ORMs

---

## What is an ORM?

- **Object-Relational Mapping**: Library that lets you interact with your database using objects and methods instead of SQL
- **Pros**:
  - Write less SQL, more readable code
  - Type safety (with TypeScript)
  - Easier migrations and schema changes
  - Database-agnostic (switch DBs more easily)
- **Cons**:
  - Can hide performance issues
  - Sometimes less efficient for complex queries
  - You still need to understand SQL (to debug, check performance, etc)

---

## Prisma: Modern TypeScript ORM

- **Code Generation**: Generates a type-safe client based on your schema
- **Schema as Source of Truth**: Edit `schema.prisma`, then generate code
- **Push/Pull CLI**:
  - `prisma db push`: Update DB schema from your code
  - `prisma db pull`: Update your code from the DB schema
- **Migration**: Version and apply schema changes
- **Great DX**: Autocomplete, type safety, easy to use

```bash
npx prisma db push   # Push schema changes to DB
npx prisma db pull   # Pull DB schema into code
npx prisma generate  # Generate client code
```

---

```prisma
model Expense {
  id        Int      @id @default(autoincrement())
  date      String
  description String
  amount    Float
  paidBy    String
  participants String
}
```

---

# Forms

---

## HTML Forms: The Basics

- **Form**: Collects user input and sends it to the server
- **Elements**: `<form>`, `<input>`, `<select>`, `<button>`, etc.
- **Submit**: By default, reloads the page and sends data as a POST request

```html
<form action="/api/expenses" method="post">
  <input name="description" />
  <input name="amount" type="number" />
  <button type="submit">Add</button>
</form>
```

---

## Why Forms Are Complex in React

- **Interactivity**: React wants to control form state for instant feedback
- **Controlled Components**: Each input's value is tied to React state
- **Validation**: Must check user input before submit
- **Error Handling**: Show errors, disable submit, etc.
- **Boilerplate**: Lots of code for even simple forms

---

## Benefits of React Hook Form

- **Less Boilerplate**: Register fields, get values, and validate with minimal code
- **Performance**: Minimizes re-renders
- **Easy Validation**: Integrates with libraries like Zod
- **Better UX**: Built-in error handling, field-level validation
- **Flexible**: Works with controlled and uncontrolled components

[React Hook Form Docs](https://react-hook-form.com/)

---


```tsx
import { useState } from 'react';

function ExpenseAdd() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<{ description?: string; amount?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!description) newErrors.description = 'Description required';
    if (!amount || parseFloat(amount) < 0.01) newErrors.amount = 'Amount required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      console.log({ description, amount: parseFloat(amount) });
      // Reset form or send to API
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description"
      />
      {errors.description && <span>{errors.description}</span>}
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Amount"
      />
      {errors.amount && <span>{errors.amount}</span>}
      <button type="submit">Add</button>
    </form>
  );
}
```

---

## Issues with Basic React Forms

- Lots of boilerplate: state for every field, manual validation, error handling
- Harder to scale for big forms
- More code to maintain and test
- Easy to forget edge cases (reset, validation, etc)


