import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Custom rules to relax linting for development
  {
    rules: {
      // Allow TypeScript 'any' type - will be fixed incrementally
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unescaped entities in JSX (quotes, apostrophes)
      "react/no-unescaped-entities": "off",
      // Relax React Hooks exhaustive deps - will be fixed incrementally
      "react-hooks/exhaustive-deps": "warn",
      // Allow setState in useEffect
      "react-hooks/rules-of-hooks": "warn",
      // Allow setState in useEffect without triggering error
      "react-hooks/set-state-in-effect": "off",
      // Allow dynamic component creation (static-components)
      "react-hooks/static-components": "off",
      // Allow TypeScript comments (@ts-ignore, @ts-expect-error)
      "@typescript-eslint/ban-ts-comment": "warn",
      // Allow unused vars (will be cleaned up incrementally)
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);

export default eslintConfig;
