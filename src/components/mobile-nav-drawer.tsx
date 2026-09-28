'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUp, ChevronUp } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { NAV_GROUPS, navLabel } from '@/lib/nav';
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

// 모바일 길잡이. 데스크탑 헤더가 메뉴와 검색을 쓰는 것과 달리 여기는 하단 바 하나와
// 전체 목록 드로어다. 좁은 화면에서는 그룹 여섯을 가로로 늘어놓을 자리가 없다.
//
// 맨 위로 버튼이 이 바 안에 있는 것은 예전에 그것이 오른쪽 아래에 떠 있으면서 워크스루의
// 이전·다음 알약과 겹쳤기 때문이다. 겹침을 피하려고 페이지마다 버튼을 끄는 prop을 두고
// 있었는데(hideScrollTop), 바 안으로 들이니 겹칠 면 자체가 없어져 그 prop이 사라졌다.
// 데스크탑은 알약이 가운데, 버튼이 오른쪽이라 겹치지 않으므로 떠 있는 채로 둔다.
//
// 진행 막대는 바의 윗 테두리 자리에 겹쳐 그린다. 새 층을 만들지 않으므로 화면에 더해지는
// 높이가 0이다.
export function MobileNavDrawer() {
  const pathname = usePathname();
  const currentLabel = navLabel(pathname) ?? '';
  const [open, setOpen] = useState(false);
  const { progress, scrolled } = useScrollProgress();

  return (
    <footer className='fixed inset-x-0 bottom-0 z-30 h-12 border-t bg-sidebar pb-safe-bottom md:hidden dark:bg-background'>
      <div className='absolute inset-x-0 top-0 h-0.5 bg-primary' style={{ width: `${progress * 100}%` }} />

      <div className='flex h-12 items-center gap-2 px-4'>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger className='flex min-w-0 cursor-pointer items-center gap-1 text-sm font-medium outline-none'>
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
                          className={cn(
                            'flex h-11 items-center gap-2 rounded-md px-2 text-sm hover:bg-muted',
                            pathname === href && 'bg-muted font-medium',
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
          <button
            type='button'
            onClick={() => scrollToTop()}
            aria-label='맨 위로'
            aria-hidden={!scrolled}
            tabIndex={scrolled ? 0 : -1}
            className={cn(
              'flex size-9 items-center justify-center rounded-md transition-opacity',
              scrolled ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          >
            <ArrowUp className='size-4' />
          </button>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
