/**
 * 갚은 lint 빚을 동결 파일(eslint-suppressions.json)에서 회수한다.
 *
 * 왜 감싸는가:
 *   `eslint --prune-suppressions`는 동결 파일이 없어도 끝에 빈 파일(`{}`)을 써 버린다.
 *   이 레포는 빚이 0이라는 사실을 그 파일의 부재로 드러내므로(eslint.config.mjs), 파일이
 *   없을 때는 eslint를 부르지 않는다. 파일이 있으면 eslint의 종료 코드를 그대로 돌려준다.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const SUPPRESSIONS_FILE = 'eslint-suppressions.json';

if (!existsSync(SUPPRESSIONS_FILE)) {
  console.log(`${SUPPRESSIONS_FILE}이 없어 회수할 동결이 없다.`);
} else {
  const run = spawnSync('eslint', ['.', '--no-cache', '--prune-suppressions'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (run.error) throw run.error;
  process.exitCode = run.status ?? 1;
}
