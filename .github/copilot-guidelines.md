# GitHub Copilot Guidelines for Web3-2025 Course Project

## Project Overview

This is an educational course website built with **Astro 5.0** and **Tailwind CSS** for teaching advanced web techniques. The project focuses on modern web development practices, TypeScript, and full-stack development concepts.

## Global Guidelines

- This is an educational project focused on teaching modern web development. Always prioritize clarity, maintainability, and learning value over clever optimizations.
- Update the `.github/copilot-guidelines.md` file with any new guidelines or changes to the project structure.

## Tech Stack

- **Astro 5.0** - Static site generator with island architecture
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework
- **MDX** - Markdown with JSX components for content
- **ESLint** & **Prettier** - Code quality and formatting
- **Node.js** (^18.17.1 || ^20.3.0 || >= 21.0.0)

## Project-Specific Guidelines

### File Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Generic UI components
│   ├── widgets/        # Page-specific widgets
│   ├── blog/           # Blog-related components
│   └── common/         # Shared utilities
├── layouts/            # Page layout templates
├── pages/              # Route-based pages
├── content/            # Content collections
├── data/              # Static data and posts
│   └── post/          # Blog posts and course modules
│       └── course-modules/  # Course module files
├── assets/            # Images, styles, static assets
└── utils/             # Helper functions and utilities
```

### Course Module Management

#### Location & Naming
- Store course modules in `src/data/post/course-modules/`
- Follow naming pattern: `module-{number}-{title}.md`
- Course is **English only**
- Prefer default official tools and libraries, or tools adopted by the vast majority of the industry.


#### Module Structure
Each module must include:
1. **Overview** - Global explanation of what will be covered
2. **Reading List** - Priority resources (Full Stack Open, official docs first)
3. **Exercises** - Step-by-step practical exercises (1-2 main exercises)
4. **Additional Exercise** - Optional complex challenge
5. **Summary** - Key takeaways in bullet points

#### Frontmatter Template
```yaml
---
publishDate: 2025-01-15T00:00:00Z
title: "Module X: Topic Name"
excerpt: "Brief description of the module content"
tags:
  - react
  - javascript
  - course
---
```

### Course Focus Areas
1. **React Basics Recap** - Components, props, state, events
2. **Advanced State Management** - Context, Redux, Zustand, XState
3. **Forms and Side Effects** - useEffect, validation, data fetching
4. **APIs and Persistence** - REST APIs, localStorage, databases
5. **Routing and Navigation** - Client-side routing, protected routes
6. **GraphQL** - Schema, queries, mutations, Apollo

### Educational Content Guidelines
- **Clear explanations** - Start with concepts, then implementation
- **Step-by-step exercises** - Provide detailed instructions
- **Progressive complexity** - Build from simple to advanced
- **Real-world examples** - Use practical scenarios
- **Resource links** - Link to official documentation and quality tutorials

## Standard Practices

### Code Quality
- Follow the usual guidelines about **TypeScript** best practices
- Follow the usual guidelines about **ESLint** and **Prettier** formatting
- Follow the usual guidelines about **Git workflow** and conventional commits

### Astro Development
- Follow the usual guidelines about **Astro** component structure and best practices
- Follow the usual guidelines about **content collections** and schema definitions
- Use `output: 'static'` configuration for performance

### Styling
- Follow the usual guidelines about **Tailwind CSS** utility-first approach
- Follow the usual guidelines about **responsive design** and mobile-first development
- Follow the usual guidelines about **accessibility** (a11y) standards

### Performance & Security
- Follow the usual guidelines about **web performance** optimization
- Follow the usual guidelines about **web security** best practices
- Follow the usual guidelines about **dependency management** and updates

## Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Quality Assurance
npm run check        # Run all checks (Astro, ESLint, Prettier)
npm run fix          # Fix ESLint and Prettier issues
```

## Quick Reference

### Key Files
- `src/data/post/course-modules/module-X-title.md` - Course modules
- `src/config.yaml` - Site configuration
- `astro.config.ts` - Astro configuration
- `.github/copilot-guidelines.md` - This file (keep updated)

### File Extensions
- `.astro` - Astro components
- `.ts` - TypeScript files
- `.md` - Markdown content
- `.mdx` - MDX content with components
