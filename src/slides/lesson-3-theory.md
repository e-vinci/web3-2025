---
marp: true
theme: default
paginate: true
header: 'Web3-2025 - Lesson 3'
footer: 'Navigation & Style'
---

# Theoretical Introduction

## Lesson 3 – Navigation and Style

---

## Lesson Objectives

- Move from a technical POC to a real usable application
- Improve user experience (UX)
- Discover routing and modern design

---

## Key Routing Concepts

- **Navigation**: Split the app into pages (Welcome, List, Add)
- **Navigation state**: Manage the current page
- **React Router**: Routing library for React

[React Router (docs)](https://reactrouter.com/)

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Welcome />} />
    <Route path="/list" element={<List />} />
    <Route path="/add" element={<AddExpense />} />
  </Routes>
</BrowserRouter>;
```

---

## Key Styling Concepts

- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Modern, accessible UI components
- **Responsive design**: Adaptation to all screens

[Tailwind CSS](https://tailwindcss.com/docs/styling-with-utility-classes)
[shadcn/ui](https://ui.shadcn.com/)

---

## UX Best Practices

- Clear interfaces and visible actions
- Fast user feedback (loading, errors)
- Smooth and intuitive navigation

---

## Key Takeaways

- Design and navigation are essential for adoption
- Use modern libraries to save time
- Always test on different devices

**Next: Advanced state management and multi-user support!**
