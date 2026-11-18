let cancelScroll: (() => void) | undefined;

/**
 * 문서 맨 위로 부드럽게 올린다. 하단 바의 맨 위로 버튼(모바일)과 떠 있는 버튼(데스크탑)이
 * 같은 움직임을 쓰도록 여기 한 곳에 둔다.
 */
export function scrollToTop(duration = 300) {
  cancelScroll?.();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || duration <= 0) {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    return;
  }
  let raf = 0;
  const cancel = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('wheel', cancel);
    window.removeEventListener('touchstart', cancel);
    cancelScroll = undefined;
  };
  cancelScroll = cancel;
  window.addEventListener('wheel', cancel, { passive: true });
  window.addEventListener('touchstart', cancel, { passive: true });
  const start = window.scrollY;
  const startTime = performance.now();
  function step(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    window.scrollTo({ top: start * (1 - ease), left: 0, behavior: 'instant' });
    if (progress < 1) raf = requestAnimationFrame(step);
    else cancel();
  }
  raf = requestAnimationFrame(step);
}
