/**
 * 문서 맨 위로 부드럽게 올린다. 하단 바의 맨 위로 버튼(모바일)과 떠 있는 버튼(데스크탑)이
 * 같은 움직임을 쓰도록 여기 한 곳에 둔다.
 */
export function scrollToTop(duration = 300) {
  const start = window.scrollY;
  const startTime = performance.now();
  function step(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    window.scrollTo(0, start * (1 - ease));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
