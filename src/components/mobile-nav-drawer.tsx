'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronUp } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { NAV_GROUPS } from '@/lib/nav';
import { cn } from '@/lib/utils';

type Props = {
  currentLabel: string;
};

// 모바일 길잡이. 데스크탑 헤더가 메뉴와 검색을 쓰는 것과 달리 여기는 하단 바 하나와
// 전체 목록 드로어다. 좁은 화면에서는 그룹 여섯을 가로로 늘어놓을 자리가 없다.
export function MobileNavDrawer({ currentLabel }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <footer className='fixed inset-x-0 bottom-0 z-30 flex h-12 shrink-0 items-center gap-2 border-t bg-sidebar px-4 pb-safe-bottom md:hidden dark:bg-background'>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger className='flex cursor-pointer items-center gap-1 text-sm font-medium outline-none'>
          {currentLabel}
          <ChevronUp className='size-3.5 opacity-60' />
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
      <div className='ml-auto'>
        <ThemeToggle />
      </div>
    </footer>
  );
}
