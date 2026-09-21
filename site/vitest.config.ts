import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests only — the browser-level checks live in scripts/shots.mjs, which runs the
// real export in a real browser. This config exists so `@/` resolves the same way Next
// resolves it; without the alias every import in a test would have to be relative.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { environment: "node", include: ["**/*.test.ts"], exclude: ["node_modules/**", "out/**", ".next/**"] },
});
