import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';

import { AppSidebar } from '@/components/app-sidebar';
import { QueryProvider } from '@/components/query-provider';

import './globals.css';
import { SITE_NAME } from '@/lib/nav';

// 페이지 제목은 각 page.tsx가 nav.ts의 pageMetadata(경로)로 준다. 제목이 페이지마다 달라야
// Next의 경로 알림이 클라이언트 이동을 보조기술에 알린다. 제목을 주지 않은 페이지는 default를 쓴다.
export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: '비트코인과 거시경제 지표를 보여 주고, 그 지표를 움직이는 원리를 시뮬레이션으로 설명한다',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_NAME,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // 모바일 브라우저 크롬 색. globals.css의 --background(라이트 oklch(1 0 0) = 흰색, 다크
  // oklch(0.148 0.004 228.8) = 거의 검정)를 sRGB hex로 옮긴 값이다. 메타 태그는 CSS 변수를 읽지
  // 못해 값을 따로 적으므로 --background를 바꾸면 여기도 함께 바꾼다. 미디어 쿼리로만 갈리므로
  // 테마 토글로 고른 테마와는 어긋날 수 있다.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#090b0c' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='ko' suppressHydrationWarning>
      <body className='bg-background antialiased'>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
          <QueryProvider>
            {/* 데스크탑 길잡이는 사이드바 하나다. 상단 헤더가 없어 본문이 화면 꼭대기에서 시작한다 */}
            <div className='flex min-h-svh w-full'>
              <AppSidebar />
              <div className='flex min-w-0 flex-1 flex-col bg-sidebar dark:bg-background'>{children}</div>
            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
