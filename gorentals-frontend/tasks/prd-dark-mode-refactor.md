# PRD: Global Dark Mode Refactoring

## 1. Goal
Refactor the GoRentals frontend to fully support dark mode by replacing all hardcoded Tailwind color utility classes with semantic design tokens defined in `globals.css`.

## 2. Context
The `ThemeToggle` component correctly toggles the `.dark` class on the `<html>` element. However, there are over 172 instances of hardcoded light-mode classes (e.g., `bg-white`, `bg-slate-50`, `text-slate-900`) scattered across the application's `.tsx` files in `src/app` and `src/components`. These hardcoded classes ignore the dark mode state, causing pages like the browser (`/search`), stores (`/stores`), and the dashboard to appear incorrectly in dark mode.

## 3. Requirements
- Identify all `.tsx` files in `src/app` and `src/components`.
- Perform a global replacement of hardcoded colors with their semantic equivalents:
  - `bg-white` → `bg-card` (or `bg-bg` for main layouts)
  - `bg-slate-50` / `bg-gray-50` → `bg-subtle`
  - `text-slate-900` / `text-black` → `text-text`
  - `text-slate-600` / `text-slate-500` → `text-muted`
  - `text-slate-400` → `text-faint`
  - `border-slate-50` / `border-slate-100` / `border-gray-100` → `border-border`
- Ensure that the refactoring does not break existing layouts.
- Verify that pages correctly switch to dark mode when the `.dark` class is active.

## 4. User Stories
### US-001: Refactor Public Pages
- **Description:** Replace hardcoded color classes in all public-facing pages (`src/app/(public)/**/*.tsx`).
- **Acceptance Criteria:** Search and Stores pages fully support dark mode.

### US-002: Refactor Auth Pages
- **Description:** Replace hardcoded color classes in authentication pages (`src/app/(auth)/**/*.tsx`).
- **Acceptance Criteria:** Login, Signup, and Forgot Password pages fully support dark mode.

### US-003: Refactor Dashboard Pages
- **Description:** Replace hardcoded color classes in dashboard pages and layouts (`src/app/dashboard/**/*.tsx` and `src/app/(protected)/**/*.tsx`).
- **Acceptance Criteria:** Admin and Owner dashboards, settings, and profile pages fully support dark mode.

### US-004: Refactor Components
- **Description:** Replace hardcoded color classes in all reusable components (`src/components/**/*.tsx`).
- **Acceptance Criteria:** Cards, modals, inputs, and other UI elements render correctly in both light and dark modes.
