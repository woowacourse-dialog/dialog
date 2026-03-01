# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server on http://localhost:5173
npm run build        # Production build (outputs to /dist)
npm run lint         # ESLint (flat config, ESLint 9)
npm run preview      # Preview production build

# E2E tests (Playwright, Chromium only)
npm run test:e2e           # Headless
npm run test:e2e:headed    # With browser UI
npm run test:e2e:ui        # Playwright UI mode
npx playwright test e2e/some.spec.js   # Single test file
```

Node version: 22.16.0 (see `.nvmrc`)

## Architecture

React 19 SPA built with Vite. Pure JavaScript (no TypeScript). Cookie-based auth with a Spring Boot backend.

### Key Layers

- **`src/api/`** — Axios instances and endpoint functions. Base URL from `VITE_API_URL`. Timeout 5s, `withCredentials: true`.
- **`src/context/AuthContext.jsx`** — Single Context provider for auth state (`isLoggedIn`, `currentUser`). Exports `AuthProvider` and `useAuth()`.
- **`src/hooks/`** — Custom hooks for data fetching with cursor-based pagination and infinite scroll (`useDiscussionList`, `useMyDiscussionList`, `useScrapDiscussionList`, `useNotificationPolling`).
- **`src/pages/`** — Route-level components, organized by feature (`discussion/create/`, `discussion/detail/`, etc.).
- **`src/components/`** — Shared UI components (Header, SearchBar, DiscussionCard, Comment, MarkdownEditor, Notification).

### Routing (React Router v7)

```
/                          → Home (discussion list + filters)
/discussion                → Home (alias)
/discussion/new            → Create discussion
/discussion/my             → My discussions
/discussion/scrap          → Scraped discussions
/discussion/:id            → Discussion detail
/discussion/:id/edit       → Edit discussion
/discussion/:id/complete   → Creation completion
/discussion/search         → Search results
/signup                    → Signup
/signup/complete            → Signup completion
/mypage                    → User profile
```

### Styling

Hybrid approach: CSS Modules (`*.module.css`) for scoped components + global CSS files (`App.css`, `reset.css`). CSS custom properties defined in `:root` for theming (`--primary-color`, `--text-color`, etc.). Responsive breakpoints at 768px and 480px.

### External Services

- **Firebase** — Push notifications via Cloud Messaging (VAPID key, service worker at `firebase-messaging-sw.js`)
- **GitHub OAuth** — Primary login method, URL at `VITE_GITHUB_AUTH_URL`

### Patterns

- URL query params sync for filters/search (via `useSearchParams`)
- Intersection Observer for infinite scroll triggers
- `useMemo` on context values to prevent unnecessary re-renders

## Environment Variables

All prefixed with `VITE_`. Firebase config keys, `VITE_API_URL` (backend base URL), OAuth URLs. See `.env` for full list.
