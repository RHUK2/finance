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
  //
  // no-raw-colors와 no-arbitrary-values는 도입할 때 위반이 665건이라 eslint-suppressions.json에
  // 동결해 두고 시작했는데, 지금은 다 갚아서 동결 파일이 없다. 남은 빚이 0이라는 사실이 파일의
  // 부재로 드러나는 상태가 정상이다.
  //
  // 다시 동결할 일이 생기면 `eslint --suppress-rule <룰>`로 만들고, 갚은 뒤에는 반드시
  // `pnpm lint:prune`을 돌린다. 동결은 파일·룰별 건수로 세므로 고치기만 하고 카운트를 줄이지 않으면
  // 그 파일은 남은 예산만큼 새 위반을 조용히 통과시킨다.
  //
  // no-restyle의 정책은 한 문장이다: 컴포넌트는 자기 상자(패딩·모양·기본 표면)를 소유하고,
  // 호출부는 배치와 그 인스턴스의 강조(색·그림자·전환)를 소유한다. 그래서 전역 allow가
  // layout·color·effects·motion이다. 아래 contract 넷은 그 문장이 안 맞는 경우만 연다.
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { shadcn },
    rules: {
      // 색은 두 축이다. 판정(good·bad·warn)과 계열(series-1~4). globals.css가 정본이고,
      // 어느 쪽인지는 "좋고 나쁨의 뜻이 있는가"로 가른다.
      // fill-none·stroke-none은 색이 아니라 none인데 룰이 색 이름으로 읽는다.
      'shadcn/no-raw-colors': ['error', { allow: ['fill-none', 'stroke-none'] }],
      // 스케일이 있는 것(간격·모양·글자 크기)만 본다. 아래는 스케일이 없는 값이라 정확한 수치를
      // 쓰는 것이 정상이다: 격자 템플릿, 콘텐츠 상자 크기(차트 캔버스 높이·가로 스크롤 최소폭),
      // 계산된 위치 보정, 4px부터 시작하는 블러 스케일이 표현 못 하는 1px, 임의 속성과 CSS 변수 선언.
      'shadcn/no-arbitrary-values': [
        'error',
        {
          allow: [
            'grid-cols-*',
            'grid-rows-*',
            'h-*',
            'min-h-*',
            'max-h-*',
            'min-w-*',
            'max-w-*',
            'left-*',
            'bottom-*',
            'backdrop-blur-*',
            '[*',
          ],
        },
      ],
      'shadcn/no-restyle': [
        'error',
        {
          allow: ['layout', 'color', 'effects', 'motion'],
          componentImports: ['@/components/panel'],
          contracts: [
            // Panel은 설명형 페이지가 강조에 쓰는 상자라 테두리·링까지 인스턴스가 정한다.
            {
              pattern: '^Panel$',
              allow: ['layout', 'color', 'effects', 'motion', 'typography', 'gap-*', 'ring-*', 'border-*'],
            },
            // 이 둘은 Radix 프리미티브를 그대로 흘려보내는 껍데기라 base 클래스가 하나도 없다.
            // 소유한 것이 없으므로 침범할 것도 없다.
            {
              pattern: '^(CollapsibleTrigger|DrawerTrigger)$',
              allow: ['layout', 'color', 'effects', 'motion', 'typography', 'spacing', 'shape'],
            },
            // 자리표시자의 크기와 모양은 자기가 아니라 뒤에 올 내용이 정한다.
            { pattern: '^Skeleton$', allow: ['layout', 'color', 'effects', 'motion', 'shape'] },
            // 값의 서체(해시는 고정폭)와 좌우 여백(아이콘을 겹쳐 놓는 자리)은 필드마다 다르다.
            { pattern: '^Input$', allow: ['layout', 'color', 'effects', 'motion', 'typography', 'pl-*', 'pr-*'] },
          ],
        },
      ],
    },
  },
  // mempool.space의 보라 블록 생김새를 따라 그린 삽화다. 네 단계 명도가 서로 묶여 있어
  // 토큰 하나로 못 바꾸고, 토큰으로 올리면 "우리 팔레트에 보라 4단계가 있다"는 거짓말이 된다.
  // 디자인 시스템 색이 아니므로 이 파일만 연다.
  {
    files: ['src/app/mempool/components.tsx'],
    rules: { 'shadcn/no-raw-colors': 'off' },
  },
  // shadcn 등 vendored 컴포넌트는 lint에서 뺀다. 원본과 다른 표기를 강제하면 diff/update 시
  // 노이즈만 커진다. 다만 "upstream 원본 그대로"는 더 이상 참이 아니다. 호출부가 기본값을
  // 덮고 있던 넷(card·button·sidebar·tabs)은 기본값 쪽을 고쳤다. 재설치 시 재적용할 목록은
  // ADR 0010에 있다.
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
