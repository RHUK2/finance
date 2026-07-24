import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import onlyWarn from "eslint-plugin-only-warn";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  { plugins: { onlyWarn } },
  {
    ...betterTailwindcss.configs.correctness,
    rules: {
      ...betterTailwindcss.configs.correctness.rules,
      "better-tailwindcss/enforce-canonical-classes": "error",
    },
    settings: {
      "better-tailwindcss": {
        entryPoint: "src/app/globals.css",
      },
    },
  },
  // shadcn 등 vendored 컴포넌트는 upstream 원본을 그대로 유지 — lint가 원본과 다른 표기를 강제하면
  // diff/update 시 노이즈만 커진다.
  {
    ignores: ["src/components/ui/**"],
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
