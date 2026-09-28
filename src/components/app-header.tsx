'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Search } from 'lucide-react';

import { CommandPalette } from '@/components/command-palette';
import { Button } from '@/components/ui/button';
import { MobileNavDrawer } from '@/components/mobile-nav-drawer';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NAV_GROUPS, navLabel } from '@/lib/nav';
import { cn } from '@/lib/utils';

// 데스크탑 길잡이는 세로 사이드바가 아니라 이 헤더가 맡는다. 페이지 이름의 단일 출처는
// 여전히 src/lib/nav.ts이고, 그룹은 메뉴로, 개별 페이지는 그 아래 드롭다운으로 걸린다.
//
// 항목이 마흔 개가 넘어 메뉴만으로는 어느 그룹인지 먼저 맞혀야 한다. 그래서 오른쪽에
// 검색을 함께 둔다(⌘K). 사이드바가 하던 "훑다가 눈에 띄면 누른다"를 그쪽이 대신한다.
//
// 모바일은 이 헤더를 그리지 않는다. 하단 고정 바와 드로어가 그대로 길잡이다. 중단점을
// JS로 판정하지 않고 둘 다 그린 뒤 CSS로 하나만 보이는 것은 예전 그대로다. 판정하면
// 서버 HTML과 첫 페인트가 어긋나 본문이 튄다.
export function AppHeader() {
  const pathname = usePathname();
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const current = navLabel(pathname);

  return (
    <>
      <MobileNavDrawer currentLabel={current ?? ''} />

      <header className='sticky top-0 z-30 hidden h-12 shrink-0 items-center gap-1 border-b bg-sidebar px-4 md:flex dark:bg-background'>
        <Link href='/' className='mr-3 shrink-0 text-sm font-bold tracking-tight'>
          Finance
        </Link>

        <nav className='flex min-w-0 items-center gap-0.5'>
          {NAV_GROUPS.map((group) => {
            const active = group.items.some((i) => i.href === pathname);
            return (
              <DropdownMenu key={group.label}>
                <DropdownMenuTrigger render={<Button variant='ghost' size='xs' />}>
                  {/* 지금 페이지가 속한 그룹을 굵게. 굵기를 Button이 아니라 안쪽 span에 거는 것은
                      Button이 자기 타이포그래피를 갖기 때문이다(shadcn/no-restyle) */}
                  <span className={cn('whitespace-nowrap', active && 'font-semibold')}>{group.label}</span>
                  <ChevronDown className='opacity-60' />
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start' className='min-w-52'>
                  {group.items.map(({ label, href, icon: Icon }) => (
                    <DropdownMenuItem key={href} render={<Link href={href} />}>
                      <Icon className='size-4' />
                      <span className={cn('truncate', pathname === href && 'font-medium')}>{label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </nav>

        <div className='ml-auto flex shrink-0 items-center gap-1'>
          <Button
            variant='outline'
            size='xs'
            onClick={() => setPalette(true)}
            className='max-w-56 text-muted-foreground'
          >
            <Search />
            <span className='truncate'>{current ?? '페이지 찾기'}</span>
            <kbd className='shrink-0 rounded border px-1 text-3xs'>⌘K</kbd>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* 열 때마다 새로 마운트해 지난 검색어를 비운다 */}
      <CommandPalette key={String(palette)} open={palette} onClose={() => setPalette(false)} />
    </>
  );
}
