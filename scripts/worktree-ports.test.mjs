import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { BASE_PORT, resolvePort } from './worktree-ports.mjs';

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

/** 커밋 하나를 가진 저장소. 워크트리를 붙이려면 HEAD가 있어야 한다. */
function repo(t) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'finance-ports-')));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  git(['init', '-q', '-b', 'main', dir], tmpdir());
  git(['config', 'user.email', 'test@example.com'], dir);
  git(['config', 'user.name', 'test'], dir);
  git(['commit', '-q', '--allow-empty', '-m', 'init'], dir);

  return dir;
}

function worktree(base, name) {
  const path = join(base, '..', `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
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
