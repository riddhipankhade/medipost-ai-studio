---
name: verify
description: How to build, run, and visually verify medipost-ai-studio changes at runtime
---

# Verifying medipost-ai-studio changes

## Build / launch
- `npm run dev` → Vite dev server; picks the next free port from 8080 (the user often has their own servers on 8080–8082 — read the startup output for the actual port).
- `npm run build` → production build (vercel/nitro output). Fast (~1 min).
- Browser automation: no playwright in the repo. Install `playwright-core` in the session scratchpad and launch with `channel: "msedge"` (system Edge exists; Chrome too). Use `waitUntil: "domcontentloaded"` + explicit selector waits — `networkidle` never settles under Vite HMR.

## Auth gate (important)
- Everything under `/_app/*` (generate, dashboard, brand, history) requires a real Supabase session; AppShell redirects to `/` without one.
- **Signup cannot be automated**: email confirmation is ENABLED in this Supabase project, and only anon keys exist in `.env.local` (no service_role). A scripted register lands on "Check your email".
- Server fns (`generateContent`, `generateImage`) are also auth-gated (credit deduction per user), so the AI path can't be curl'd either.
- → For UI verification of preview/creative components, use the **static harness pattern** below. For true end-to-end generation, ask the user to run it or provide a confirmed test login.

## Static harness pattern (verifies real components without auth)
1. Create `public/__verify-harness.html`:
   - a `#root` div, then a module script that installs the react-refresh preamble (`import RefreshRuntime from "/@react-refresh"; ...injectIntoGlobalHook...; window.__vite_plugin_react_preamble_installed__ = true;`) — without it `@vitejs/plugin-react` throws "can't detect preamble",
   - then `<script type="module" src="/src/__verify-harness.tsx">`.
2. Create `src/__verify-harness.tsx`: **must `import "./styles.css"` first** (Tailwind classes silently no-op otherwise and every layout collapses), then mount the component under test with fixture props via `createRoot`. Presentational exports that take plain props (e.g. `SlideCanvas` from `@/routes/_app.generate`, `defaultBrandKit` from `@/lib/brand-kit`) mount fine outside the router.
3. Screenshot with playwright-core at `http://localhost:<port>/__verify-harness.html`.
4. **Delete both harness files afterwards** and confirm `git status` is clean of them.

## Gotchas
- The repo has three separate rendering systems (single post + carousel → SlideCanvas archetypes; festive → FestivePreview; story → StoryPreview). Verify in the one the diff touches.
- The user frequently has uncommitted parallel work — diff only the files you changed; don't be alarmed by extra modified/staged files.
