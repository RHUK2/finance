import { plugin as shadcn } from '@shadcn/lint';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    ...betterTailwindcss.configs.correctness,
    rules: {
      ...betterTailwindcss.configs.correctness.rules,
      'better-tailwindcss/enforce-canonical-classes': 'error',
    },
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/app/globals.css',
      },
    },
  },
  // 디자인 시스템 규약. 룰 여섯 중 넷을 끈 이유를 함께 둔다. 켜고 끄는 판단이 이 파일 밖에 있으면
  // 다음 사람이 "왜 안 켰지" 하고 다시 켰다가 소음만 얻는다.
  //
  //   no-unknown-classes    better-tailwindcss/correctness와 중복이라 끈다.
  //   no-inline-styles      이 레포의 인라인 스타일 33곳 중 31곳이 모델이 내놓은 색·기하다
  //                         (BTC_COLOR, width: `${pct}%`, gridTemplateRows). Tailwind로 표현할
  //                         수 있는 대상이 아니라서 켜면 정당한 코드를 막는다.
  //   require-static-classes  걸리는 4곳이 전부 룩업 테이블(TAG_STYLE[tag])이다. 그게 동적 클래스의
  //                         권장 패턴이라 "고치면" 호출부에 분기가 인라인된다.
  //   no-restyle            Card 재스타일 부채를 갚은 뒤 켠다.
  //
  // no-raw-colors와 no-arbitrary-values의 기존 위반은 eslint-suppressions.json에 동결돼 있다.
  // 새로 생기는 것만 막고, 기존 것은 파일 단위로 갚아 나간다.
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { shadcn },
    rules: {
      'shadcn/no-raw-colors': 'error',
      'shadcn/no-arbitrary-values': 'error',
    },
  },
  // shadcn 등 vendored 컴포넌트는 upstream 원본을 그대로 유지 — lint가 원본과 다른 표기를 강제하면
  // diff/update 시 노이즈만 커진다.
  {
    ignores: ['src/components/ui/**'],
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
