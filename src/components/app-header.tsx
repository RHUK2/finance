'use client';

import { Fragment } from 'react';
import Link from 'next/link';

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
import { useIsMobile } from '@/hooks/use-mobile';

type BreadcrumbEntry = { label: string; href?: string };

type Props = {
  breadcrumbs: BreadcrumbEntry[];
};

export function AppHeader({ breadcrumbs }: Props) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileNavDrawer currentLabel={breadcrumbs.at(-1)?.label ?? ''} />;
  }

  return (
    <header className='bg-sidebar dark:bg-background sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b px-4'>
      <SidebarTrigger className='-ml-1' />
      <Separator orientation='vertical' />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((item, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              // BreadcrumbList는 <ol>, Item·Separator는 각각 <li>다. 감싸는 엘리먼트를 두면
              // <ol>의 직계 자식이 <li>가 아니게 되므로 Fragment로 나란히 놓는다.
              <Fragment key={item.label}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.href ?? '/'}>{item.label}</Link>
                    </BreadcrumbLink>
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
  );
}
