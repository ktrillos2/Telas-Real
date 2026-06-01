---
applyTo: '**'
---
Provide project context and coding guidelines that the AI must follow when generating code, answering technical questions, or reviewing changes.

## General principles

- Always prioritize clean, maintainable, and readable code over “clever” or overly compact solutions.
- Prefer composition and reusable pieces instead of large, monolithic functions or files.
- Follow the existing project architecture, naming conventions, and folder structure whenever they are known or provided.
- Avoid introducing new patterns, libraries, or frameworks unless explicitly requested or already used in the project.

## Components-first rule

- Whenever it makes sense, **implement new UI or logic as reusable components** (e.g. React/Vue/Svelte components, helper modules, services, hooks, etc.).
- Do **not** dump large blocks of inline code directly into pages or entry files when they can be extracted into components.
- Split big components into smaller, focused components if:
  - They handle multiple responsibilities, or
  - They exceed a reasonable length / complexity.
- Reuse existing components if they already cover the required behavior, instead of duplicating logic.

## File and project structure

- Place each new component or module in the appropriate folder based on the project’s current structure (e.g. `components/`, `hooks/`, `services/`, `utils/`, `pages/`).
- When updating or extending behavior, **modify the file that is actually used by the application**, instead of creating isolated example files.
- Keep filenames and component names consistent and descriptive (e.g. `UserCard.tsx`, `useAuth.ts`, `formatCurrency.ts`).

## Best practices

- Follow the language and framework best practices (React, Next.js, Vue, Node.js, etc.) as applicable.
- Keep functions and components small, with a single clear responsibility.
- Use meaningful names for variables, functions, and components.
- Avoid unnecessary global state; prefer local state or dedicated state management patterns already in use.
- Handle errors gracefully and explicitly where relevant (try/catch, fallbacks, default states).
- Avoid hard-coding values that should be configuration or constants; extract them to config/constant files when appropriate.
- Write code that is easy to test; avoid tight coupling and hidden side effects.

## Type safety & documentation

- When using TypeScript, always type props, function parameters, return values, and important objects.
- Prefer interfaces/types over `any` or untyped data.
- Add brief inline comments or JSDoc only where they add clarity (complex logic, non-obvious decisions), not everywhere.
- Keep documentation in sync with the actual implementation.

## UI & UX guidelines

- Keep components focused: UI components should not contain heavy business logic when it can be moved to hooks/services.
- Use composition (children, slots, render props) instead of deeply nested conditionals where applicable.
- Ensure accessibility and semantic HTML when generating UI (proper tags, ARIA where needed).

## Code examples & snippets

- When the AI provides code snippets as an answer:
  - Prefer showing **component-based implementations** instead of raw inline code.
  - Indicate clearly in which file or folder each piece of code should live.
  - Ensure snippets are consistent and would compile together when integrated into the project.

By default, the AI must:
1. Think in terms of **components and reusable modules first**.
2. Implement or modify code **in the real, used files** of the project.
3. Follow and preserve **clean architecture and best practices** in every generated solution.