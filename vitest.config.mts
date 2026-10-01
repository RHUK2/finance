import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

// 모델 회귀 테스트. 순수 계산만 재므로 node 환경이고, 화면(DOM)은 띄우지 않는다.
// 별칭은 tsconfig.json paths(`@/*` → `./src/*`)와 같게 둔다. 한쪽만 고치면 앱과 테스트가
// 서로 다른 파일을 읽는다.
//
// `server-only`는 Next가 번들할 때만 의미가 있는 표식이라 패키지로 설치돼 있지 않다.
// 테스트가 서버 전용 모듈(src/lib/loaders 등)을 import하면 이 빈 모듈을 대신 물린다.
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) },
      { find: /^server-only$/, replacement: fileURLToPath(new URL('./test/server-only.ts', import.meta.url)) },
    ],
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
