'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import { NAV_GROUPS } from '@/lib/nav';
import { cn } from '@/lib/utils';

// 데스크탑 길잡이. 상단 헤더는 없다. 길잡이가 왼쪽에 상시로 있는데 위에 한 줄을 더 두면
// 같은 일(현재 위치·검색·테마)을 두 곳이 나눠 갖게 되고, 본문은 세로 48px을 잃는다.
// 헤더가 담던 셋을 전부 이 안으로 들였다. 위에 검색, 가운데 목록, 아래 테마다.
//
// 검색은 팔레트를 여는 버튼이 아니라 목록을 그 자리에서 거르는 입력이다. 사이드바가 이미
// 마흔한 개를 보이고 있으므로 같은 목록을 따로 띄울 이유가 없다. 거르면 결과가 남은
// 그룹만 머리글과 함께 남는다.
//
// 그룹을 접었다 펴는 기능은 두지 않는다. 목록의 자리가 화면마다 같아야 어디쯤에 무엇이
// 있는지를 몸이 기억한다. 길면 스크롤로 푼다.
//
// 모바일에는 그려지지 않는다(`md:flex`). 좁은 화면의 길잡이는 하단 바와 드로어다.
export function AppSidebar() {
  const pathname = usePathname();
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV_GROUPS;
    return NAV_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.label.toLowerCase().includes(q)),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  return (
    <aside className='sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r bg-sidebar md:flex dark:bg-background'>
      <Link href='/' className='p-3 text-base font-bold tracking-tight'>
        Finance
      </Link>

      <div className='px-3 pb-2'>
        <div className='flex items-center gap-1.5 rounded-md border px-2'>
          <Search className='size-3.5 shrink-0 text-muted-foreground' />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='거르기'
            className='h-8 min-w-0 flex-1 bg-transparent text-sm outline-none'
            aria-label='페이지 거르기'
          />
          {query && (
            <button type='button' onClick={() => setQuery('')} aria-label='지우기'>
              <X className='size-3.5 text-muted-foreground' />
            </button>
          )}
        </div>
      </div>

      <nav className='flex-1 overflow-y-auto px-2 pb-2'>
        {groups.map((group) => (
          <div key={group.label} className='mb-3'>
            <p className='px-2 pb-1 text-xs text-muted-foreground'>{group.label}</p>
            <div className='flex flex-col gap-0.5'>
              {group.items.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted',
                    pathname === href && 'bg-muted font-medium',
                  )}
                >
                  <Icon className='size-4 shrink-0' />
                  <span className='truncate'>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <p className='px-2 py-6 text-center text-sm text-muted-foreground'>찾는 이름이 없습니다</p>
        )}
      </nav>

      <div className='flex items-center justify-between border-t px-3 py-2'>
        <span className='text-3xs text-muted-foreground'>테마</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
