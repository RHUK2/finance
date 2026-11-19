import { createElement, isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';

import { Button } from '@/components/ui/button';

import GlobalError from './global-error';

// 오류를 던지는 길잡이 컴포넌트가 전역 오류 화면에 재도입되는 것을 막는 mock이다.
vi.mock('@/components/app-sidebar', () => ({
  AppSidebar: () => {
    throw new Error('sidebar failed');
  },
}));
vi.mock('@/components/mobile-nav-drawer', () => ({
  MobileNavDrawer: () => {
    throw new Error('navigation failed');
  },
}));

function retryClick(node: ReactNode): (() => void) | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = retryClick(child);
      if (found) return found;
    }
  }
  if (!isValidElement<{ children?: ReactNode; onClick?: () => void }>(node)) return;
  return node.type === Button ? node.props.onClick : retryClick(node.props.children);
}

it('renders root recovery even when shared navigation throws', () => {
  const html = renderToStaticMarkup(createElement(GlobalError, { error: new Error('root failed'), retry: vi.fn() }));
  expect(html).toContain('다시 시도');
  expect(html).toContain('<html');
  expect(html).toContain('<body');
  expect(html).toMatch(/<a\b[^>]*href="\/"[^>]*>/);
});

it('calls retry when the recovery button is clicked', () => {
  const retry = vi.fn();
  const onClick = retryClick(GlobalError({ error: new Error('root failed'), retry }));
  onClick?.();
  expect(retry).toHaveBeenCalledOnce();
});
