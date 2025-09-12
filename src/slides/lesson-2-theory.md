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

## Lesson Objectives

- Deploy a fullstack application to the Internet
- Replace file-based persistence with a real database
- Discover Prisma ORM and the deployment workflow

---

## Key Deployment Concepts

- **Environments**: local vs production
- **Environment variables**: secure secrets/API URLs
- **Cloud services**: Render to host backend and frontend
- **Build & Publish**: Compilation and static publishing

[Render – Documentation](https://render.com/docs)

---

## Persistence with Prisma

- **ORM**: Object ↔ database mapping
- **Prisma**: Generates a type-safe client
- **Migration**: Versioning the database schema
- **SQLite/PostgreSQL**: Choose the DB according to context

[Prisma ORM (docs)](https://www.prisma.io/docs/orm/overview/introduction/what-is-prisma)

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

## Validation and Forms

- **React Hook Form**: Form management in React
- **Zod**: Data validation on frontend and backend

[React Hook Form](https://react-hook-form.com/)
[Zod Intro](https://zod.dev/)

---

## Best Practices

- Always use environment variables for URLs/API keys
- Commit & push before every deployment
- Test on the public URL after deployment

---

## Key Takeaways

- Deployment = accessible to everyone
- Persistence = data reliability
- Prisma simplifies DB access and schema migration

**Next: Improve user experience and interface!**
