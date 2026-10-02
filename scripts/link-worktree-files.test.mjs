import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('../link-worktree-files.sh', import.meta.url));

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

/** 임시 상위 디렉터리. 기준 체크아웃과 이웃 디렉터리를 나란히 둔다. */
function sandbox(t) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'finance-link-')));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** 커밋 하나와 공유 항목 `.scratch/marker`를 가진 저장소. */
function repo(path, marker) {
  mkdirSync(path, { recursive: true });
  git(['init', '-q', '-b', 'main', path], path);
  git(['config', 'user.email', 'test@example.com'], path);
  git(['config', 'user.name', 'test'], path);
  git(['commit', '-q', '--allow-empty', '-m', 'init'], path);
  mkdirSync(join(path, '.scratch'));
  writeFileSync(join(path, '.scratch', 'marker'), marker);
  return path;
}

function worktree(base, path) {
  git(['worktree', 'add', '-q', '-b', 'topic', path], base);
  return realpathSync(path);
}

/** 기준 체크아웃 cwd가 아니라 fixture 워크트리 안에서만 부른다. */
function link(cwd, env = {}, args = []) {
  const inherited = { ...process.env };
  delete inherited.WORKTREE_LINK_BASE;
  return spawnSync('/bin/bash', [SCRIPT, ...args], { cwd, encoding: 'utf8', env: { ...inherited, ...env } });
}

test('공백 없는 기준 체크아웃의 공유 항목을 링크한다', (t) => {
  const root = sandbox(t);
  const base = repo(join(root, 'finance'), 'base');
  const wt = worktree(base, join(root, 'finance-topic'));

  const run = link(wt);

  assert.equal(run.status, 0, run.stderr);
  assert.equal(readlinkSync(join(wt, '.scratch')), join(base, '.scratch'));
});

test('기준 체크아웃 경로에 공백이 있어도 경로 전체를 기준으로 삼는다', (t) => {
  const root = sandbox(t);
  // 공백 앞까지 잘린 이름의 다른 저장소가 이웃에 있으면 잘못 잘랐을 때 조용히 그쪽으로 링크한다.
  repo(join(root, 'finance'), 'other');
  const base = repo(join(root, 'finance v2'), 'base');
  const wt = worktree(base, join(root, 'finance v2 차트 정리'));

  const run = link(wt);

  assert.equal(run.status, 0, run.stderr);
  assert.equal(readlinkSync(join(wt, '.scratch')), join(base, '.scratch'));
  assert.equal(readFileSync(join(wt, '.scratch', 'marker'), 'utf8'), 'base');
});

test('WORKTREE_LINK_BASE가 자동 탐색보다 앞선다', (t) => {
  const root = sandbox(t);
  const base = repo(join(root, 'finance'), 'base');
  const other = repo(join(root, 'elsewhere'), 'other');
  const wt = worktree(base, join(root, 'finance-topic'));

  const run = link(wt, { WORKTREE_LINK_BASE: other });

  assert.equal(run.status, 0, run.stderr);
  assert.equal(readlinkSync(join(wt, '.scratch')), join(other, '.scratch'));
});

test('기준에 없는 항목은 이름을 찍고 요약에 센다', (t) => {
  const root = sandbox(t);
  const base = repo(join(root, 'finance'), 'base');
  const wt = worktree(base, join(root, 'finance-topic'));

  const run = link(wt);

  assert.equal(run.status, 0, run.stderr);
  // fixture 기준에는 `.scratch`만 있다. `.vercel`은 ITEMS에 있지만 기준에 없다.
  assert.match(run.stdout, /\.vercel\s+기준에 없음/);
  assert.match(run.stdout, /링크 1개, 건너뜀 0개, 기준에 없음 \d+개/);
  assert.doesNotMatch(run.stdout, /기준에 없음 0개/);
});

test('사본이 기준과 다르면 건드리지 않고 2로 끝난다', (t) => {
  const root = sandbox(t);
  const base = repo(join(root, 'finance'), 'base');
  const wt = worktree(base, join(root, 'finance-topic'));
  mkdirSync(join(wt, '.scratch'));
  writeFileSync(join(wt, '.scratch', 'marker'), 'local');

  const run = link(wt);

  assert.equal(run.status, 2, run.stderr);
  assert.equal(readFileSync(join(wt, '.scratch', 'marker'), 'utf8'), 'local');
});

test('다른 곳을 가리키는 링크는 이미 링크로 넘기지 않고 2로 끝난다', (t) => {
  const root = sandbox(t);
  const base = repo(join(root, 'finance'), 'base');
  const stale = repo(join(root, 'finance-old'), 'stale');
  const wt = worktree(base, join(root, 'finance-topic'));
  symlinkSync(join(stale, '.scratch'), join(wt, '.scratch'));

  const run = link(wt);

  assert.equal(run.status, 2, run.stderr);
  assert.match(run.stdout, /\.scratch\s+다른 곳을 가리키는 링크/);
  assert.equal(readlinkSync(join(wt, '.scratch')), join(stale, '.scratch'));
});

test('다른 곳을 가리키는 링크도 --force면 기준으로 바꾸고 원래 대상은 지우지 않는다', (t) => {
  const root = sandbox(t);
  const base = repo(join(root, 'finance'), 'base');
  const stale = repo(join(root, 'finance-old'), 'stale');
  const wt = worktree(base, join(root, 'finance-topic'));
  symlinkSync(join(stale, '.scratch'), join(wt, '.scratch'));

  const run = link(wt, {}, ['--force']);

  assert.equal(run.status, 0, run.stderr);
  assert.equal(readlinkSync(join(wt, '.scratch')), join(base, '.scratch'));
  assert.equal(readFileSync(join(stale, '.scratch', 'marker'), 'utf8'), 'stale');
});

test('경로 표기만 다르고 같은 기준을 가리키는 링크는 이미 링크로 본다', (t) => {
  const root = sandbox(t);
  const base = repo(join(root, 'finance'), 'base');
  const wt = worktree(base, join(root, 'finance-topic'));
  // 손으로 건 상대 경로 링크. 문자열로 비교하면 "다른 곳을 가리키는 링크"로 오판한다.
  symlinkSync('../finance/.scratch', join(wt, '.scratch'));

  const run = link(wt);

  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /\.scratch\s+이미 링크/);
  assert.equal(readlinkSync(join(wt, '.scratch')), '../finance/.scratch');
});
