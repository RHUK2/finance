'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUp, ChevronUp } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { isCurrentPath, NAV_GROUPS, navLabel } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { scrollToTop } from '@/lib/scroll';

/** 문서 맨 위에서 맨 아래까지의 진행도(0~1)와 맨 위로 버튼을 보일 만큼 내려왔는지. */
function useScrollProgress() {
  const [state, setState] = useState({ progress: 0, scrolled: false });

  useEffect(() => {
    function read() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setState({ progress: max > 0 ? Math.min(1, window.scrollY / max) : 0, scrolled: window.scrollY > 300 });
    }
    read();
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, []);

  return state;
}

// 모바일 길잡이. 데스크탑 사이드바가 목록과 거르는 칸을 상시로 보이는 것과 달리 여기는 하단 바 하나와
// 전체 목록 드로어다. 좁은 화면에서는 그룹 여섯을 가로로 늘어놓을 자리가 없다.
//
// 맨 위로 버튼이 이 바 안에 있는 것은 예전에 그것이 오른쪽 아래에 떠 있으면서 워크스루의
// 이전·다음 알약과 겹쳤기 때문이다. 겹침을 피하려고 페이지마다 버튼을 끄는 prop을 두고
// 있었는데(hideScrollTop), 바 안으로 들이니 겹칠 면 자체가 없어져 그 prop이 사라졌다.
// 데스크탑은 떠 있는 채로 둔다. 지금 화면 아래에 뜨는 것은 신용창조의 워크스루 독(simulation.tsx
// StepDock)뿐이고, 독이 버튼 자리(오른쪽 5rem)를 비워 둔다.
//
// 진행 막대는 바의 윗 테두리 자리에 겹쳐 그린다. 새 층을 만들지 않으므로 화면에 더해지는
// 높이가 0이다.
//
// 바의 높이는 줄(h-12)에 안전 영역 인셋을 더한 값이다. 높이를 h-12로만 두고 pb-safe-bottom을 주면
// 인셋이 생기는 기기에서 패딩이 높이 안에서 잘려 줄이 홈 인디케이터 위로 내려앉는다. 본문 여백
// (page-main.tsx의 4rem + 인셋)과 워크스루 독(3.5rem + 인셋)도 같은 높이를 전제한다.
//
// label은 nav.ts에 없는 화면(없는 경로, 오류)만 넘긴다. 목록에 있는 페이지의 이름은 경로로 끌어온다.
export function MobileNavDrawer({ label }: { label?: string } = {}) {
  const pathname = usePathname();
  const currentLabel = label ?? navLabel(pathname) ?? '';
  const [open, setOpen] = useState(false);
  const { progress, scrolled } = useScrollProgress();

  return (
    <footer className='fixed inset-x-0 bottom-0 z-30 h-[calc(3rem+var(--spacing-safe-bottom))] border-t bg-sidebar pb-safe-bottom md:hidden dark:bg-background'>
      <div className='absolute inset-x-0 top-0 h-0.5 bg-primary' style={{ width: `${progress * 100}%` }} />

      <div className='flex h-12 items-center gap-2 px-4'>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger className='flex min-w-0 cursor-pointer items-center gap-1 rounded-md text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50'>
            <span className='truncate'>{currentLabel}</span>
            <ChevronUp className='size-3.5 shrink-0 opacity-60' />
          </DrawerTrigger>
          <DrawerContent className='max-h-[70vh]'>
            <DrawerHeader>
              <DrawerTitle>메뉴</DrawerTitle>
            </DrawerHeader>
            <div className='overflow-y-auto px-4 pb-4'>
              {NAV_GROUPS.map((group) => (
                <div key={group.label} className='mb-4'>
                  <p className='mb-1 text-xs text-muted-foreground'>{group.label}</p>
                  <ul className='flex flex-col gap-0.5'>
                    {group.items.map(({ label, href, icon: Icon }) => (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={() => setOpen(false)}
                          aria-current={isCurrentPath(pathname, href) ? 'page' : undefined}
                          className={cn(
                            'flex h-11 items-center gap-2 rounded-md px-2 text-sm hover:bg-muted',
                            isCurrentPath(pathname, href) && 'bg-muted font-medium',
                          )}
                        >
                          <Icon className='size-4 shrink-0' />
                          <span className='truncate'>{label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </DrawerContent>
        </Drawer>

        <div className='ml-auto flex shrink-0 items-center gap-1'>
          {/* 자리를 늘 차지하고 투명도만 바꾼다. 나타났다 사라지면서 옆 버튼이 움직이지 않게 */}
          <Button
            variant='ghost'
            size='icon'
            onClick={() => scrollToTop()}
            aria-label='맨 위로'
            aria-hidden={!scrolled}
            tabIndex={scrolled ? 0 : -1}
            className={cn('transition-opacity', scrolled ? 'opacity-100' : 'pointer-events-none opacity-0')}
          >
            <ArrowUp className='size-4' />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
