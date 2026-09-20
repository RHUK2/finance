/**
 * 워크트리 슬롯에 맞춘 포트로 next dev를 띄운다.
 *
 *   node scripts/dev.mjs [next dev에 넘길 인자...]
 *
 * 환경 파일은 link-worktree-files.sh가 기준 체크아웃으로의 심볼릭 링크로 만들어 두므로
 * 실체가 하나다. 워크트리마다 다른 포트를 거기에 적을 수 없어 포트는 파일이 아니라
 * 이 런처가 정한다.
 */
import { spawn } from 'node:child_process';
import { resolvePort } from './worktree-ports.mjs';

const { name, slot, port } = resolvePort();

console.log(`워크트리 ${name} · 슬롯 ${slot} → http://localhost:${port}\n`);

const child = spawn('next', ['dev', '--port', String(port), ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
