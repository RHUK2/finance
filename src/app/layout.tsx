import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

import { QueryProvider } from '@/components/query-provider';

import './globals.css';

export const metadata: Metadata = {
  title: 'Finance Dashboard',
  description: '개인 경제 지표 대시보드',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Finance',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // 모바일 브라우저 크롬 색. globals.css의 --background(라이트 흰색 / 다크 남색)와 맞춘다.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='ko' suppressHydrationWarning>
      <body className='bg-background antialiased'>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
          <QueryProvider>
            {/* 사이드바가 없다. 길잡이는 데스크탑 헤더(AppHeader)와 모바일 하단 바가 맡는다 */}
            <div className='flex min-h-svh w-full min-w-0 flex-col bg-sidebar dark:bg-background'>{children}</div>
          </QueryProvider>
          <Toaster position='top-center' richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
