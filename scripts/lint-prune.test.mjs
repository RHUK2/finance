import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('./lint-prune.mjs', import.meta.url));

test('동결 파일이 없으면 eslint를 부르지 않고 빈 동결 파일도 만들지 않는다', (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'finance-prune-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  // PATH를 비워 eslint를 부르면 실패하게 둔다. 부르지 않아야 0으로 끝난다.
  const out = execFileSync(process.execPath, [SCRIPT], { cwd: dir, encoding: 'utf8', env: { PATH: '' } });

  assert.match(out, /회수할 동결이 없다/);
  assert.equal(existsSync(join(dir, 'eslint-suppressions.json')), false);
});
