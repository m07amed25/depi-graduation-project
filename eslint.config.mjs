import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "**/*.min.js",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Allow inline styles for dynamic runtime values (virtualization, canvas, progress bars)
      // These are necessary for performance and cannot be moved to CSS
      "react/forbid-dom-props": "off",
      "react/forbid-component-props": "off",
    },
  },
]);

export default eslintConfig;
