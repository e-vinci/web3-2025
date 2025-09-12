---
marp: true
theme: default
paginate: true
header: 'Web 3 2025 - Complex state management'
footer: 'Web 3 2025 - Vinci'
---

# Theoretical Introduction

## Lesson 4 – Advanced State Management

---

## Lesson Objectives

- Manage multiple users and money transfers
- Structure global state on frontend and backend
- Use Prisma for complex relations
- Use React Router Data APIs and global context

---

## Key Backend Concepts

- **Express + TypeScript**: Professional structure
- **Prisma relations**: Model User, Expense, Transfer
- **Migrations**: Schema evolution
- **Seed**: Generate test data

[Prisma Relations](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations)
[Express + TS Template](https://github.com/edwinhern/express-typescript)

```prisma
model User {
  id    Int    @id @default(autoincrement())
  name  String
  expenses Expense[]
  transfersSent Transfer[] @relation("Sender")
  transfersReceived Transfer[] @relation("Receiver")
}

model Expense {
  id        Int    @id @default(autoincrement())
  amount    Float
  paidById  Int
  paidBy    User   @relation(fields: [paidById], references: [id])
}

model Transfer {
  id         Int    @id @default(autoincrement())
  fromUserId Int
  toUserId   Int
  amount     Float
  sender     User   @relation("Sender", fields: [fromUserId], references: [id])
  receiver   User   @relation("Receiver", fields: [toUserId], references: [id])
}
```

---

## Key Frontend Concepts

- **React Router Loaders/Actions**: Data loading and mutation
- **Global context**: Share state between components
- **Unified transactions**: Merge expenses and transfers

[React Router Data Loading](https://reactrouter.com/en/main/routers/picking-a-router#data-loading)

```tsx
// Example React Router loader
export async function loader() {
  const res = await fetch('/api/transactions');
  return res.json();
}
```

---

## Best Practices

- Refactor to separate business logic and UI
- Use TypeScript typing everywhere
- Test migrations and seed before coding the UI
- Deploy and test regularly

---

## Key Takeaways

- Advanced state management enables powerful collaborative apps
- Prisma makes modeling complex relations easier
- React Router and global context simplify UI/backend sync

**Congrats, you're ready for advanced collaborative web apps!**
