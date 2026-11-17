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

const signalHandlers = new Map();
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  // Next CLI는 SIGHUP을 정리하지 않으므로 서버 후손까지 종료하는 SIGTERM으로 보낸다.
  const forward = () => child.kill(signal === 'SIGHUP' ? 'SIGTERM' : signal);
  signalHandlers.set(signal, forward);
  process.on(signal, forward);
}

function removeSignalHandlers() {
  for (const [signal, handler] of signalHandlers) process.off(signal, handler);
}

child.on('error', (error) => {
  removeSignalHandlers();
  console.error(`개발 서버 실행 실패: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  // 자기 자신에게 종료 신호를 보내기 전에 전달 리스너를 없애야 다시 자식에게 보내지 않는다.
  removeSignalHandlers();
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
