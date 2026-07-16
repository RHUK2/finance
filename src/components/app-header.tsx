'use client';

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
import { ThemeToggle } from '@/components/theme-toggle';
import { MobileNavDrawer } from '@/components/mobile-nav-drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import Link from 'next/link';

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
              <span key={item.label} className='flex items-center gap-1.5'>
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
              </span>
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
