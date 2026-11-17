import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { BASE_PORT, SLOT_COUNT, preferredSlot, resolvePort } from './worktree-ports.mjs';

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

/** 커밋 하나를 가진 저장소. 워크트리를 붙이려면 HEAD가 있어야 한다. */
function repo(t, prefix = 'finance-ports-') {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), prefix)));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  git(['init', '-q', '-b', 'main', dir], tmpdir());
  git(['config', 'user.email', 'test@example.com'], dir);
  git(['config', 'user.name', 'test'], dir);
  git(['commit', '-q', '--allow-empty', '-m', 'init'], dir);

  return dir;
}

function worktree(base, name) {
  const path = join(base, name);
  git(['worktree', 'add', '-q', '-b', name, path], base);
  return realpathSync(path);
}

function env(t, key, value) {
  const previous = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
  t.after(() => {
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  });
}

test('기준 체크아웃은 언제나 0번 슬롯을 갖는다', (t) => {
  env(t, 'FINANCE_PORT_SLOT', undefined);
  const base = repo(t);

  const { slot, port } = resolvePort(base);

  assert.equal(slot, 0);
  assert.equal(port, BASE_PORT);
});

test('워크트리는 1번 이후를 받고 다시 물어도 같은 슬롯이다', (t) => {
  env(t, 'FINANCE_PORT_SLOT', undefined);
  const base = repo(t);
  const wt = worktree(base, 'feature');
  t.after(() => rmSync(wt, { recursive: true, force: true }));

  const first = resolvePort(wt);
  const second = resolvePort(wt);

  assert.ok(first.slot >= 1, `워크트리가 0번을 가져갔다: ${first.slot}`);
  assert.equal(first.slot, second.slot);
  assert.equal(first.port, BASE_PORT + first.slot);
});

test('워크트리 둘은 서로 다른 슬롯을 받는다', (t) => {
  env(t, 'FINANCE_PORT_SLOT', undefined);
  const base = repo(t);
  const one = worktree(base, 'one');
  const two = worktree(base, 'two');
  t.after(() => {
    rmSync(one, { recursive: true, force: true });
    rmSync(two, { recursive: true, force: true });
  });

  const ports = new Set([resolvePort(base).port, resolvePort(one).port, resolvePort(two).port]);

  assert.equal(ports.size, 3);
});

test('장부는 기준 체크아웃에만 생기고 사라진 워크트리의 슬롯은 회수된다', (t) => {
  env(t, 'FINANCE_PORT_SLOT', undefined);
  const base = repo(t);
  const wt = worktree(base, 'gone');
  const registryPath = join(base, '.worktree-ports.json');

  const { slot } = resolvePort(wt);
  assert.ok(existsSync(registryPath), '장부가 기준 체크아웃에 없다');
  assert.equal(JSON.parse(readFileSync(registryPath, 'utf8'))[wt], slot);
  assert.equal(existsSync(join(wt, '.worktree-ports.json')), false);

  rmSync(wt, { recursive: true, force: true });
  resolvePort(base);

  assert.deepEqual(JSON.parse(readFileSync(registryPath, 'utf8')), { [base]: 0 });
});

test('FINANCE_PORT_SLOT은 장부를 건드리지 않고 덮어쓴다', (t) => {
  const base = repo(t);
  env(t, 'FINANCE_PORT_SLOT', '7');

  const { slot, port, pinned } = resolvePort(base);

  assert.equal(slot, 7);
  assert.equal(port, BASE_PORT + 7);
  assert.equal(pinned, true);
  assert.equal(existsSync(join(base, '.worktree-ports.json')), false);
});

test('범위를 벗어난 FINANCE_PORT_SLOT은 거부한다', (t) => {
  const base = repo(t);
  env(t, 'FINANCE_PORT_SLOT', '10');

  assert.throws(() => resolvePort(base), /FINANCE_PORT_SLOT/);
});

for (const saved of [-1, SLOT_COUNT, 1.5, '2', null, 0]) {
  test(`워크트리의 잘못된 슬롯 ${JSON.stringify(saved)}은 다시 배정한다`, (t) => {
    env(t, 'FINANCE_PORT_SLOT', undefined);
    const base = repo(t);
    const wt = worktree(base, 'invalid');
    const registryPath = join(base, '.worktree-ports.json');
    writeFileSync(registryPath, JSON.stringify({ [base]: 0, [wt]: saved }));

    const { slot } = resolvePort(wt);

    assert.ok(Number.isInteger(slot) && slot > 0 && slot < SLOT_COUNT);
    assert.equal(JSON.parse(readFileSync(registryPath, 'utf8'))[wt], slot);
    assert.equal(resolvePort(base).slot, 0);
  });
}

test('다른 워크트리와 중복된 슬롯은 점유하지 않은 슬롯으로 다시 배정한다', (t) => {
  env(t, 'FINANCE_PORT_SLOT', undefined);
  const base = repo(t);
  const wt = worktree(base, 'duplicate');
  const other = worktree(base, 'other');
  const registryPath = join(base, '.worktree-ports.json');
  writeFileSync(registryPath, JSON.stringify({ [base]: 0, [wt]: 1, [other]: 1 }));

  const { slot } = resolvePort(wt);

  assert.ok(slot > 1 && slot < SLOT_COUNT);
  assert.equal(resolvePort(other).slot, 1);
  assert.equal(JSON.parse(readFileSync(registryPath, 'utf8'))[wt], slot);
});

test('워크트리에 0이 적혀 있어도 기준 체크아웃은 0을 유지한다', (t) => {
  env(t, 'FINANCE_PORT_SLOT', undefined);
  const base = repo(t);
  const wt = worktree(base, 'zero');
  writeFileSync(join(base, '.worktree-ports.json'), JSON.stringify({ [wt]: 0 }));

  assert.equal(resolvePort(base).slot, 0);
  assert.ok(resolvePort(wt).slot > 0);
});

test('선호 슬롯이 점유되면 다음 빈 슬롯으로 밀린다', (t) => {
  env(t, 'FINANCE_PORT_SLOT', undefined);
  const base = repo(t);
  const wt = worktree(base, 'collision');
  const other = worktree(base, 'occupant');
  const wanted = preferredSlot('collision');
  assert.notEqual(wanted, 0, '충돌 fixture는 기준 체크아웃 이외의 슬롯을 사용한다');
  writeFileSync(join(base, '.worktree-ports.json'), JSON.stringify({ [base]: 0, [other]: wanted }));
  const next = (wanted + 1) % SLOT_COUNT || 1;

  assert.equal(resolvePort(wt).slot, next);
  assert.equal(resolvePort(other).slot, wanted);
});

test('모든 슬롯이 점유되면 장부를 보존하고 잠금을 해제하며 오류를 낸다', (t) => {
  env(t, 'FINANCE_PORT_SLOT', undefined);
  const base = repo(t);
  const wt = worktree(base, 'overflow');
  const registryPath = join(base, '.worktree-ports.json');
  const registry = { [base]: 0 };
  for (let slot = 1; slot < SLOT_COUNT; slot += 1) {
    const path = join(base, `occupied-${slot}`);
    mkdirSync(path);
    registry[path] = slot;
  }
  const contents = JSON.stringify(registry);
  writeFileSync(registryPath, contents);

  assert.throws(() => resolvePort(wt), /빈 포트 슬롯이 없다/);
  assert.equal(readFileSync(registryPath, 'utf8'), contents);
  assert.equal(existsSync(`${registryPath}.lock`), false);
});

test('잠금 대기 시간이 초과되면 안내하고 기존 잠금은 지우지 않는다', (t) => {
  env(t, 'FINANCE_PORT_SLOT', undefined);
  const base = repo(t);
  const registryPath = join(base, '.worktree-ports.json');
  const lockPath = `${registryPath}.lock`;
  mkdirSync(lockPath);

  assert.throws(
    () => resolvePort(base),
    (error) => {
      assert.match(error.message, /포트 장부 잠금 대기 시간 초과/);
      assert.ok(error.message.includes(lockPath));
      return true;
    },
  );
  assert.equal(existsSync(lockPath), true);
  assert.equal(existsSync(registryPath), false);
});

for (const contents of ['{broken', '[]', 'null', '42']) {
  test(`손상되거나 객체가 아닌 장부를 복구한다 (${contents})`, (t) => {
    env(t, 'FINANCE_PORT_SLOT', undefined);
    const base = repo(t);
    const wt = worktree(base, 'recovery');
    const registryPath = join(base, '.worktree-ports.json');
    writeFileSync(registryPath, contents);

    const { slot } = resolvePort(wt);

    assert.ok(Number.isInteger(slot) && slot > 0 && slot < SLOT_COUNT);
    assert.deepEqual(JSON.parse(readFileSync(registryPath, 'utf8')), { [base]: 0, [wt]: slot });
    assert.equal(existsSync(`${registryPath}.lock`), false);
  });
}

test('CLI는 경로에 한글·공백이 있어도 포트를 출력한다', (t) => {
  env(t, 'FINANCE_PORT_SLOT', undefined);
  const base = repo(t, 'finance 차트 정리-');
  // 판정이 보는 것은 cwd가 아니라 스크립트 자신의 경로라 사본을 그 저장소 안에 둔다.
  const script = join(base, 'scripts', 'worktree-ports.mjs');
  mkdirSync(dirname(script));
  copyFileSync(fileURLToPath(new URL('./worktree-ports.mjs', import.meta.url)), script);

  const out = execFileSync('node', [script], { cwd: base, encoding: 'utf8' });

  assert.match(out, new RegExp(`http://localhost:${BASE_PORT}`));
});
