---
marp: true
theme: default
paginate: true
header: 'Web3-2025 - Lesson 1'
footer: 'JS2 Recap & Project Kickoff'
---

# Theoretical Introduction
## Lesson 1 – JS2 Recap & Project Kickoff

---

## Lesson Objectives
- Refresh React and Express fundamentals
- Understand the structure of a modern fullstack app
- Prepare the foundation for a collaborative expense-sharing application

---

## Key React Concepts
- **Components**: Reusable UI building blocks
- **Props**: Passing data between components
- **State**: Local state management
- **TypeScript**: Static typing for robustness

[React Documentation](https://reactjs.org/docs/hello-world.html)

```typescript
export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
}
```

---

## Key Express Concepts
- **Minimalist HTTP server**
- **Routing**: Handling endpoints
- **Persistence**: JSON files (for starters)
- **Modularity**: Separate services and routes

[Express Routing](https://expressjs.com/en/starter/basic-routing.html)

```js
const express = require('express');
const app = express();
app.get('/api/expenses', (req, res) => {
  // return the list of expenses
});
```

---

## Tooling & Project Structure
- **Vite**: Fast React frontend setup
- **Express Generator**: Bootstrap the backend
- **npm**: Dependency management
- **Frontend/backend separation**

```bash
npm create vite@latest frontend -- --template react-ts
npx express-generator --no-view backend
```

---

## Useful Links
- [Vite – Getting Started](https://vitejs.dev/guide/)
- [Node.js File System (fs)](https://nodejs.org/api/fs.html)
- [Last year's JS2 course](https://e-vinci.github.io/js2)

---

## Key Takeaways
- Use props for clarity and reusability
- Keep a modular structure
- Start simple, add complexity later

**Next: Deploy and move to a real database!**
