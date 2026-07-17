'use client';

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { NAV_GROUPS } from '@/lib/nav';
import { ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

type Props = {
  currentLabel: string;
};

export function MobileNavDrawer({ currentLabel }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <footer className='bg-sidebar dark:bg-background fixed inset-x-0 bottom-0 z-30 flex h-12 shrink-0 items-center gap-2 border-t px-4 pb-[env(safe-area-inset-bottom)]'>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger className='flex cursor-pointer items-center gap-1 text-sm font-medium outline-none'>
          {currentLabel}
          <ChevronUp className='h-3.5 w-3.5 opacity-60' />
        </DrawerTrigger>
        <DrawerContent className='max-h-[70vh]'>
          <DrawerHeader>
            <DrawerTitle>메뉴</DrawerTitle>
          </DrawerHeader>
          <div className='overflow-y-auto px-4 pb-4'>
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className='mb-4'>
                <p className='text-muted-foreground mb-1 text-xs'>{group.label}</p>
                <SidebarMenu>
                  {group.items.map(({ label, href, icon: Icon }) => (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton asChild isActive={pathname === href} onClick={() => setOpen(false)}>
                        <Link href={href}>
                          <Icon />
                          <span>{label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
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
