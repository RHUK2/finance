import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';

import GlobalError from './global-error';

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

it('renders root recovery even when shared navigation throws', () => {
  const html = renderToStaticMarkup(createElement(GlobalError, { error: new Error('root failed'), retry: vi.fn() }));
  expect(html).toContain('다시 시도');
  expect(html).toContain('<html');
  expect(html).toContain('<body');
});
