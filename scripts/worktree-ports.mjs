/**
 * 워크트리마다 개발 서버 포트를 다르게 준다.
 *
 * 왜 필요한가:
 *   포트가 상수로 박혀 있으면 두 워크트리에서 동시에 dev를 띄울 수 없고,
 *   띄웠다 해도 브라우저 주소가 같아 어느 브랜치를 보고 있는지 구분되지 않는다.
 *
 * 배치:
 *   3000 + slot. 기준 체크아웃이 0번이라 늘 3000이고, 워크트리는 3001부터 가져간다.
 *
 * 슬롯을 정하는 법:
 *   워크트리는 이름의 해시로 1번 이후를 고른다. 같은 워크트리는 언제 띄워도 같은 주소라
 *   북마크가 산다. 이미 다른 워크트리가 쓰는 슬롯이면 다음 빈 슬롯으로 밀린다. 한 번
 *   정해진 슬롯은 기준 체크아웃의 .worktree-ports.json에 적혀 고정된다(gitignore).
 *   사라진 워크트리의 항목은 읽을 때마다 정리되어 슬롯이 회수된다.
 *
 * 수동 지정:
 *   FINANCE_PORT_SLOT=3 으로 한 번만 덮어쓸 수 있다. 레지스트리에는 기록하지 않는다.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

export const BASE_PORT = 3000;
export const SLOT_COUNT = 10;

const REGISTRY_NAME = '.worktree-ports.json';

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

/** 워크트리 루트(여기서 dev를 띄우는 체크아웃). */
export function worktreeRoot(cwd = process.cwd()) {
  return git(['rev-parse', '--show-toplevel'], cwd);
}

/**
 * 기준 체크아웃. 레지스트리를 여기에 둬야 모든 워크트리가 같은 장부를 본다.
 * link-worktree-files.sh와 같은 규칙(= `git worktree list`의 첫 항목)을 쓴다.
 */
export function baseCheckout(cwd = process.cwd()) {
  const first = git(['worktree', 'list', '--porcelain'], cwd)
    .split('\n')
    .find((line) => line.startsWith('worktree '));

  return first ? first.slice('worktree '.length) : worktreeRoot(cwd);
}

function readRegistry(path) {
  if (!existsSync(path)) return {};

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    // 손상된 장부는 버리고 다시 만든다. 슬롯은 언제든 해시에서 다시 뽑을 수 있다.
    return {};
  }
}

function writeRegistry(path, registry) {
  mkdirSync(dirname(path), { recursive: true });

  // 임시 파일에 쓰고 rename 한다. 두 워크트리가 동시에 시작해도 반쯤 쓰인 장부는 남지 않는다.
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(registry, null, 2)}\n`);
  renameSync(tmp, path);
}

function preferredSlot(name) {
  const digest = createHash('sha1').update(name).digest();
  return digest.readUInt32BE(0) % SLOT_COUNT;
}

function lockRegistry(registryPath) {
  const lockPath = `${registryPath}.lock`;
  const deadline = Date.now() + 5000;
  const wait = new Int32Array(new SharedArrayBuffer(4));

  // mkdir는 프로세스 사이에서도 원자적이다. 장부를 읽기 전부터 쓰기가 끝날 때까지 잠근다.
  for (;;) {
    try {
      mkdirSync(lockPath);
      return () => rmdirSync(lockPath);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (Date.now() >= deadline) {
        // 시간만으로 잠금을 빼앗으면 느린 프로세스와 다시 경쟁할 수 있으므로 자동 삭제하지 않는다.
        throw new Error(
          `포트 장부 잠금 대기 시간 초과. 다른 ports/dev 실행이 끝났는지 확인하고, 비정상 종료로 남은 잠금이면 ${lockPath}를 삭제한다.`,
        );
      }
      Atomics.wait(wait, 0, 0, 25);
    }
  }
}

function claimSlot(root, base, name, registryPath) {
  // 호출자가 장부 잠금을 가진 동안만 읽고 갱신한다.
  const registry = readRegistry(registryPath);

  // 사라진 워크트리의 슬롯을 회수한다.
  for (const path of Object.keys(registry)) {
    if (!existsSync(path)) delete registry[path];
  }

  // 슬롯 0은 기준 체크아웃 몫으로 묶어 둔다. 문서·북마크의 3000이 계속 메인 체크아웃을
  // 가리키게 하려는 것이다. 워크트리는 1번부터 가져간다.
  registry[base] = 0;

  if (typeof registry[root] === 'number') {
    writeRegistry(registryPath, registry);
    return registry[root];
  }

  const taken = new Set(Object.values(registry));
  const wanted = preferredSlot(name);

  for (let i = 0; i < SLOT_COUNT; i += 1) {
    const slot = (wanted + i) % SLOT_COUNT;

    if (taken.has(slot)) continue;

    registry[root] = slot;
    writeRegistry(registryPath, registry);
    return slot;
  }

  throw new Error(
    `빈 포트 슬롯이 없다(최대 ${SLOT_COUNT}개). 다 쓴 워크트리를 지우거나 ${registryPath}에서 항목을 덜어낸다.`,
  );
}

/** 이 워크트리가 쓸 슬롯과 포트. */
export function resolvePort(cwd = process.cwd()) {
  const root = worktreeRoot(cwd);
  const name = basename(root);

  const override = process.env.FINANCE_PORT_SLOT;

  if (override !== undefined && override !== '') {
    const slot = Number(override);

    if (!Number.isInteger(slot) || slot < 0 || slot >= SLOT_COUNT) {
      throw new Error(`FINANCE_PORT_SLOT은 0~${SLOT_COUNT - 1}의 정수여야 한다: ${override}`);
    }

    return { root, name, slot, pinned: true, port: BASE_PORT + slot };
  }

  const base = baseCheckout(cwd);
  const registryPath = join(base, REGISTRY_NAME);
  const unlock = lockRegistry(registryPath);
  try {
    const slot = claimSlot(root, base, name, registryPath);
    return { root, name, slot, pinned: false, port: BASE_PORT + slot };
  } finally {
    unlock();
  }
}

function main() {
  const { name, slot, pinned, port } = resolvePort();

  if (process.argv.includes('--port')) {
    process.stdout.write(String(port));
    return;
  }

  console.log(`워크트리 ${name} · 슬롯 ${slot}${pinned ? ' (FINANCE_PORT_SLOT 지정)' : ''}`);
  console.log(`  http://localhost:${port}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
