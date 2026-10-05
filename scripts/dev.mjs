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

// Node의 fetch는 주소마다 연결을 250ms만 기다리고 다음 주소로 넘어간다(happy eyeballs).
// 로컬(WSL)에서 mempool.space까지 TCP 연결이 280ms 남짓이라 IPv4 주소가 전부 잘리고
// IPv6은 경로가 없어 `fetch failed`로 끝난다. curl은 같은 주소에 붙는다. Vercel은 가까워서
// 이 문제가 없으므로 dev 런처에서만 늘린다. NODE_OPTIONS라 next가 띄우는 워커도 물려받는다.
const NODE_OPTIONS = [process.env.NODE_OPTIONS, '--network-family-autoselection-attempt-timeout=2000']
  .filter(Boolean)
  .join(' ');

const child = spawn('next', ['dev', '--port', String(port), ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, NODE_OPTIONS },
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
