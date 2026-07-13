// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: {
      entry: "server",
    },
    serverFns: {
      disableCsrfMiddlewareWarning: true,
    },
  },
  // The wrapper's `nitro` type only names preset/output/cloudflare, but it
  // spreads the whole object into nitro's vite plugin, so vercel.* passes
  // through — hence the cast.
  nitro: {
    preset: "vercel",
    vercel: {
      functions: {
        // image generation waits on pollinations.ai (frequently 10-40s per
        // image); Vercel's default 10s function limit kills those requests
        // mid-flight and the client sees a bare 500
        maxDuration: 60,
      },
    },
  } as { preset: string },
});