'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { MobileNavDrawer } from '@/components/mobile-nav-drawer';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { navLabel } from '@/lib/nav';

type BreadcrumbEntry = { label: string; href?: string };

type Props = {
  /**
   * 여러 단계를 직접 그려야 할 때만 넘긴다. 넘기지 않으면 경로로 nav에서 이름을
   * 찾아 한 단계를 그린다. 페이지 이름의 단일 출처는 `src/lib/nav.ts`다.
   */
  breadcrumbs?: BreadcrumbEntry[];
};

// 모바일·데스크탑 껍데기를 둘 다 그리고 CSS로 하나만 보인다. 중단점을 JS로 판정하면
// 서버와 첫 렌더가 뷰포트를 모르므로 데스크탑 헤더가 한 번 그려졌다가 바뀌고, 그때
// sticky 헤더가 차지하던 3rem이 사라지면서 본문이 위로 튄다(CLS 0.06). 사이드바가
// 이미 `hidden md:block`으로 같은 문제를 CSS로 푸는 것과 같은 방식이다.
export function AppHeader({ breadcrumbs }: Props) {
  const pathname = usePathname();
  // nav에 없는 경로는 이름을 지어낼 곳이 없다. 빈 목록을 그려 두면 화면이
  // 조용히 비므로, 그런 페이지는 breadcrumbs를 직접 넘겨야 한다.
  const trail = breadcrumbs ?? (navLabel(pathname) ? [{ label: navLabel(pathname)! }] : []);

  return (
    <>
      <MobileNavDrawer currentLabel={trail.at(-1)?.label ?? ''} />
      <header className='sticky top-0 z-30 hidden h-12 shrink-0 items-center gap-2 border-b bg-sidebar px-4 md:flex dark:bg-background'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' />
        <Breadcrumb>
          <BreadcrumbList>
            {trail.map((item, i) => {
              const isLast = i === trail.length - 1;
              return (
                // BreadcrumbList는 <ol>, Item·Separator는 각각 <li>다. 감싸는 엘리먼트를 두면
                // <ol>의 직계 자식이 <li>가 아니게 되므로 Fragment로 나란히 놓는다.
                <Fragment key={item.label}>
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link href={item.href ?? '/'} />}>{item.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <div className='ml-auto'>
          <ThemeToggle />
        </div>
      </header>
    </>
  );
}
