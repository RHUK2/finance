'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { NAV_GROUPS } from '@/lib/nav';
import { cn } from '@/lib/utils';

// 사이드바를 걷어내면서 "훑어 내려가다 눈에 띄면 누른다"는 길이 사라졌다. 그 자리를
// 이름으로 찾는 길이 대신한다. 마흔 개가 넘는 페이지를 헤더 메뉴만으로 다니려면
// 그룹을 먼저 맞혀야 하는데, 어느 그룹인지 모르는 페이지가 늘 있다.
//
// 목록은 전부 클라이언트에 있는 NAV_GROUPS 하나에서 나온다. 검색 색인을 따로 두지 않는다.

type Hit = { label: string; href: string; group: string; icon: React.ComponentType<{ className?: string }> };

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const items: Hit[] = useMemo(() => NAV_GROUPS.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label }))), []);

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    // 빈 입력일 때는 지금 페이지를 뺀 앞쪽 여덟 개를 보인다. 빈 상자보다 고를 것이 낫다.
    if (!q) return items.filter((i) => i.href !== pathname).slice(0, 8);
    return items.filter((i) => i.label.toLowerCase().includes(q) || i.group.toLowerCase().includes(q)).slice(0, 10);
  }, [items, query, pathname]);

  // 검색어가 바뀌면 고른 줄을 맨 위로 되돌린다. 그러지 않으면 결과가 줄었을 때
  // 커서가 목록 밖을 가리켜 엔터가 아무것도 안 하는 것처럼 보인다.
  const clampedCursor = Math.min(cursor, Math.max(0, hits.length - 1));

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function move(delta: number) {
    setCursor((c) => {
      const from = Math.min(c, Math.max(0, hits.length - 1));
      return Math.max(0, Math.min(hits.length - 1, from + delta));
    });
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-24'
      onClick={onClose}
      role='presentation'
    >
      <div
        className='w-full max-w-lg overflow-hidden rounded-xl border bg-popover shadow-xl'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center gap-2 border-b px-3'>
          <Search className='size-4 shrink-0 text-muted-foreground' />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                move(1);
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                move(-1);
              }
              if (e.key === 'Enter') {
                const hit = hits[clampedCursor];
                if (hit) {
                  router.push(hit.href);
                  onClose();
                }
              }
            }}
            placeholder='페이지 이름으로 찾기'
            className='h-11 min-w-0 flex-1 bg-transparent text-sm outline-none'
            aria-label='페이지 찾기'
          />
          <kbd className='shrink-0 rounded border px-1.5 py-0.5 text-3xs text-muted-foreground'>esc</kbd>
        </div>

        <ul ref={listRef} className='max-h-80 overflow-y-auto p-1'>
          {hits.map((hit, i) => (
            <li key={hit.href}>
              <Link
                href={hit.href}
                onClick={onClose}
                onMouseEnter={() => setCursor(i)}
                className={cn('flex items-center gap-2 rounded-md p-2 text-sm', i === clampedCursor && 'bg-muted')}
              >
                <hit.icon className='size-4 shrink-0 text-muted-foreground' />
                <span className='truncate'>{hit.label}</span>
                <span className='ml-auto shrink-0 text-3xs text-muted-foreground'>{hit.group}</span>
              </Link>
            </li>
          ))}
          {hits.length === 0 && (
            <li className='px-3 py-6 text-center text-sm text-muted-foreground'>찾는 이름이 없습니다</li>
          )}
        </ul>
      </div>
    </div>
  );
}
