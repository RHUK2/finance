import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('./dev.mjs', import.meta.url));

function launch(t, source) {
  const dir = mkdtempSync(join(tmpdir(), 'finance-dev-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  if (source) {
    writeFileSync(join(dir, 'next'), `#!${process.execPath}\n${source}`);
    chmodSync(join(dir, 'next'), 0o755);
  }
  const launcher = spawn(process.execPath, [SCRIPT], {
    env: { PATH: `${dir}:/usr/bin:/bin`, FINANCE_PORT_SLOT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => launcher.kill('SIGKILL'));
  return launcher;
}

for (const [signal, childSignal] of [
  ['SIGINT', 'SIGINT'],
  ['SIGTERM', 'SIGTERM'],
  ['SIGHUP', 'SIGTERM'],
]) {
  test(`런처 PID의 ${signal}을 자식에게 전달하고 종료를 기다린다`, { timeout: 5000 }, async (t) => {
    const launcher = launch(
      t,
      `
      process.on('${childSignal}', () => {
        setTimeout(() => { console.log('stopped'); process.exit(0); }, 50);
      });
      console.log('ready:' + process.pid);
      setInterval(() => {}, 1000);
    `,
    );
    const exited = once(launcher, 'close');
    let output = '';
    launcher.stdout.on('data', (chunk) => {
      output += chunk;
    });
    while (!output.includes('ready:')) await once(launcher.stdout, 'data');
    const childPid = Number(output.match(/ready:(\d+)/)[1]);
    t.after(() => {
      try {
        process.kill(childPid, 'SIGKILL');
      } catch {}
    });
    launcher.kill(signal);
    assert.deepEqual(await exited, [0, null]);
    assert.match(output, /stopped/);
    assert.throws(() => process.kill(childPid, 0), { code: 'ESRCH' });
  });
}

test('자식이 신호로 종료하면 런처도 같은 신호로 종료한다', { timeout: 5000 }, async (t) => {
  const launcher = launch(t, "process.kill(process.pid, 'SIGTERM');");
  launcher.stdout.resume();
  assert.deepEqual(await once(launcher, 'exit'), [null, 'SIGTERM']);
});

test('next 실행 실패는 원인을 출력하고 1로 종료한다', { timeout: 5000 }, async (t) => {
  const launcher = launch(t);
  let stderr = '';
  launcher.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  launcher.stdout.resume();
  assert.deepEqual(await once(launcher, 'close'), [1, null]);
  assert.match(stderr, /개발 서버 실행 실패:.*ENOENT/);
});
