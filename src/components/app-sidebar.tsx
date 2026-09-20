'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { NAV_GROUPS } from '@/lib/nav';

// 접은 그룹만 저장한다. 열린 그룹 목록을 저장하면 나중에 그룹이 늘 때, 저장된 적 없는
// 새 그룹이 접힌 채로 등장한다. 기본값은 언제나 전부 열림이다(ADR 0008).
const STORAGE_KEY = 'sidebar:collapsed-groups';

// localStorage를 useEffect + setState로 읽으면 cascading render 경고가 뜨고, 초기
// state에서 바로 읽으면 서버 렌더와 어긋난다. useSyncExternalStore는 hydration 동안
// 서버 스냅샷(전부 열림)을 쓰고 그 뒤에 실제 값으로 한 번 갱신한다.
const EMPTY: string[] = [];
const listeners = new Set<() => void>();

let snapshot: string[] = EMPTY;
let snapshotRaw: string | null = null;

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  // getSnapshot은 렌더마다 불리므로 같은 문자열이면 같은 배열 참조를 돌려줘야 한다
  if (raw !== snapshotRaw) {
    snapshotRaw = raw;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      snapshot = Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : EMPTY;
    } catch {
      snapshot = EMPTY;
    }
  }
  return snapshot;
}

function write(next: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 저장이 막힌 환경(프라이빗 모드 등)에서도 여닫기 자체는 동작해야 한다
    snapshotRaw = null;
    snapshot = next;
  }
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // 다른 탭에서 접었다 폈을 때도 따라간다
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const collapsed = useSyncExternalStore(subscribe, read, () => EMPTY);

  function toggle(label: string, open: boolean) {
    write(open ? collapsed.filter((l) => l !== label) : collapsed.includes(label) ? collapsed : [...collapsed, label]);
  }

  return (
    <Sidebar>
      <SidebarHeader className='p-4'>
        <span className='text-base font-bold tracking-tight'>Finance</span>
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <Collapsible
            key={group.label}
            open={!collapsed.includes(group.label)}
            onOpenChange={(open) => toggle(group.label, open)}
            className='group/nav'
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className='w-full cursor-pointer gap-1 hover:text-sidebar-foreground'>
                  {group.label}
                  <ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/nav:rotate-90' />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map(({ label, href, icon: Icon }) => (
                      <SidebarMenuItem key={href}>
                        <SidebarMenuButton asChild isActive={pathname === href} onClick={() => setOpenMobile(false)}>
                          <Link href={href}>
                            <Icon />
                            <span>{label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
