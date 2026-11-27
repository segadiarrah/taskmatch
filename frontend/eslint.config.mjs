import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  // React Compiler is not enabled. Preserve the existing hooks contract during
  // this security upgrade; compiler migration is separate from runtime fixes.
  { rules: {
    "react-hooks/set-state-in-effect": "off",
    "react-hooks/refs": "off",
    "react-hooks/immutability": "off",
  } },
  globalIgnores([".next/**", ".next-e2e/**", "node_modules/**", "next-env.d.ts"]),
]);
