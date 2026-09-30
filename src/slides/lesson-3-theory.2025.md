---
marp: true
theme: default
paginate: true
header: 'Web 3 2025 - Navigation & Style'
footer: 'Web 3 2025 - Vinci'
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

## Tailwind CSS Deep Dive

### Library Ideology: Utility-First

- **Traditional approach**: Write custom CSS classes
- **Utility-first approach**: Compose styles from small utility classes

```html
<!-- Traditional CSS -->
<div class="card">
  <h2 class="card-title">Title</h2>
</div>

<!-- Tailwind utility-first -->
<div class="bg-white rounded-lg shadow-md p-6">
  <h2 class="text-xl font-bold text-gray-800">Title</h2>
</div>
```

**Benefits**: Faster development, consistent design system, no CSS bloat

---

## Tailwind Build System

### How Tailwind Avoids CSS Bloat

- **Problem**: Tailwind has thousands of utility classes (~3MB full CSS)
- **Solution**: **Purging/Tree-shaking** - only include used classes in production

```javascript
// Tailwind scans your code for used classes
<div className="bg-blue-500 text-white p-4"> // ✅ Included
<div className="bg-red-500 text-black p-2"> // ❌ Not used, excluded
```

**Result**: Production CSS is typically <10KB instead of 3MB

**Build process**: Tailwind CLI scans your files → generates minimal CSS

---

## Tailwind Configuration & Variables

---

### Modern CSS Configuration (2024+)

```css
/* imports... */

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
  }
}

/* Usage in components */
.my-component {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

---

**Benefits**: CSS custom properties, better IDE support, easier theming

---

## Tailwind: The Bad Parts

### Goes Against Traditional CSS Best Practices

**Traditional CSS principles Tailwind violates:**

1. **Separation of Concerns**: Mix styling directly in HTML

   ```html
   <!-- Traditional: Clean HTML, styles in CSS -->
   <div class="card">Content</div>

   <!-- Tailwind: Styling mixed with markup -->
   <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">Content</div>
   ```

---

2. **Don't Repeat Yourself (DRY)**: Copy-paste styling everywhere
   ```html
   <!-- Same button styling repeated 10 times -->
   <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
     <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"></button>
   </button>
   ```

---

3. **Semantic CSS**: Utility classes are non-semantic

   ```css
   /* Semantic (good) */
   .submit-button {
     /* clearly describes purpose */
   }

   /* Non-semantic (Tailwind) */
   .bg-blue-500 {
     /* describes appearance, not meaning */
   }
   ```

**Critics say**: "It's just inline styles with extra steps!"

---

## Tailwind: The Good Parts

**1. "Separation of Concerns" is outdated in component-based apps:**

```tsx
// React component = HTML + CSS + JS together anyway
function Button({ children }) {
  return <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">{children}</button>;
}
// Component encapsulates ALL concerns, not just HTML
```

---

**2. DRY violation solved by components, not CSS:**

```tsx
// Extract to reusable component, not CSS class
<PrimaryButton>Submit</PrimaryButton>
<PrimaryButton>Cancel</PrimaryButton>
// No repetition, and you see ALL styling context immediately
```

---

**3. Utility classes are MORE maintainable:**

```html
<!-- Traditional: What does "card-header" actually look like? Need to check CSS -->
<div class="card-header">
  <!-- Tailwind: Styling is immediately visible and predictable -->
  <div class="text-xl font-bold text-gray-800 mb-4"></div>
</div>
```

---

## Component Libraries Overview

### What are Component Libraries?

Pre-built, reusable UI components that speed up development:

- **Material UI (MUI)**: Google's Material Design for React

  ```tsx
  import { Button, TextField } from '@mui/material';
  <Button variant="contained">Click me</Button>;
  ```

- **Chakra UI**: Simple, modular and accessible

  ```tsx
  import { Button, Input } from '@chakra-ui/react';
  <Button colorScheme="blue">Click me</Button>;
  ```

- **Shadcn/ui**: Modern, customizable, copy-paste components
  ```tsx
  import { Button } from '@/components/ui/button';
  <Button variant="outline">Click me</Button>;
  ```

---

## Headless Libraries

---

### What is a "Headless" Library?

**Headless library**: Provides functionality and behavior WITHOUT styling

```tsx
// Radix UI (headless) - logic only, no styles
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root>
  <Dialog.Trigger className="my-custom-button">Open</Dialog.Trigger>
  <Dialog.Content className="my-custom-modal">{/* You style this however you want */}</Dialog.Content>
</Dialog.Root>;
```

---

**Benefits**:

- Complete control over appearance
- Accessibility handled automatically
- Framework agnostic

**Examples**: Radix UI, Headless UI, React Hook Form

---

## Shadcn/ui Philosophy

### Installation Ideology: "Copy, Don't Import"

**Traditional libraries**: Install via npm, import components

```bash
npm install @mui/material  # Library in node_modules
import { Button } from '@mui/material';
```

**Shadcn approach**: Copy component source code into your project

```bash
npx shadcn-ui@latest add button  # Copies code to your src/
import { Button } from "@/components/ui/button";  # Your local file
```

**Benefits**: Full customization, no dependency bloat, you own the code

---

## What NPX Does

### Understanding `npx shadcn-ui add button`

1. **Downloads**: Fetches the latest Button component code
2. **Installs dependencies**: Adds required packages (like `@radix-ui/react-slot`)
3. **Copies files**: Places component in `src/components/ui/button.tsx`
4. **Updates config**: Modifies import paths and styling

**Result**: You have a fully customizable Button component in your codebase

---

## Shadcn + Radix Integration

---

### Built on Radix Primitives

Shadcn/ui components are **styled wrappers** around Radix headless components:

```tsx
// Shadcn Button component (simplified)
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot'; // Headless primitive

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
```

**Radix provides**: Accessibility, keyboard navigation, focus management
**Shadcn provides**: Beautiful default styling with Tailwind

---

## Shadcn Theming Options

---

### Customization Approaches

1. **CSS Variables**: Change theme colors globally

```css
:root {
  --primary: 221.2 83.2% 53.3%; /* Blue theme */
  --secondary: 210 40% 98%;
}

[data-theme='dark'] {
  --primary: 217.2 91.2% 59.8%; /* Darker blue */
  --secondary: 217.2 32.6% 17.5%;
}
```

---

2. **Tailwind Config**: Extend color palette

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
      },
    },
  },
};
```

---

3. **Component Variants**: Modify component styling directly

```tsx
const buttonVariants = cva('inline-flex items-center justify-center rounded-md text-sm font-medium', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      // Add your custom variant
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    },
  },
});
```

---

> The user thinks the interface is the software - and they're right

---

## UX Best Practices

- Clear interfaces and visible actions
- Fast user feedback (loading, errors)
- Smooth and intuitive navigation

---

## Key Takeaways

- **Tailwind**: Utility-first approach with smart build optimization
- **Component libraries**: Speed up development with pre-built components
- **Headless libraries**: Behavior without styling constraints
- **Shadcn/ui**: Copy-paste approach gives you full control
- **Modern tooling**: CSS variables and build systems work together

---

**Next: Advanced state management and multi-user support!**
