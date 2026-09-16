// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Public backend connection values (publishable/anon — safe in the client bundle).
// These are the build-time fallback so the PRODUCTION bundle always has them, even
// when the build environment doesn't provide the VITE_ variables (e.g. builds from
// the git repo, where .env is not committed). Local/preview env still wins.
const PUBLIC_SUPABASE_URL = "https://ofktpalnttfdjunljqgt.supabase.co";
const PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_McGJkUVjwAmn-YOGsOcalA_WdiwtcE6";
const PUBLIC_SUPABASE_PROJECT_ID = "ofktpalnttfdjunljqgt";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        process.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"] || PUBLIC_SUPABASE_URL,
      ),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
          process.env["SUPABASE_PUBLISHABLE_KEY"] ||
          PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      ),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
        process.env["VITE_SUPABASE_PROJECT_ID"] ||
          process.env["SUPABASE_PROJECT_ID"] ||
          PUBLIC_SUPABASE_PROJECT_ID,
      ),
    },
  },
});
