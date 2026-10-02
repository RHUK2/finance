'use client';

import { ThemeProvider } from 'next-themes';

import { AppSidebar } from '@/components/app-sidebar';
import { MobileNavDrawer } from '@/components/mobile-nav-drawer';
import { PageMain } from '@/components/page-main';
import { Button } from '@/components/ui/button';
import { SITE_NAME } from '@/lib/nav';

import './globals.css';

// root layout 자체에서 난 예외. 이 파일이 layout을 대신하므로 html·body·전역 스타일·테마와 두 길잡이
// (데스크탑 사이드바, 모바일 하단 바)를 layout.tsx와 같은 배치로 직접 둔다. 데이터를 읽지 않으므로
// QueryProvider는 두지 않는다. 오류 경계는 클라이언트 컴포넌트라 metadata를 쓸 수 없어 <title>로 준다.
// 다시 시도가 reset이 아니라 retry인 이유는 error.tsx에 적었다.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang='ko' suppressHydrationWarning>
      <body className='bg-background antialiased'>
        <title>{`오류 · ${SITE_NAME}`}</title>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
          <div className='flex min-h-svh w-full'>
            <AppSidebar />
            <div className='flex min-w-0 flex-1 flex-col bg-sidebar dark:bg-background'>
              <MobileNavDrawer label='오류' />
              <PageMain>
                <div className='flex flex-col items-start gap-2'>
                  <p className='text-sm font-semibold'>화면을 그리는 중에 오류가 났습니다</p>
                  <p className='text-sm/relaxed text-muted-foreground'>
                    잠시 뒤 다시 시도하거나 메뉴에서 다른 페이지로 이동하십시오.
                  </p>
                  <Button variant='outline' size='sm' onClick={() => retry()}>
                    다시 시도
                  </Button>
                </div>
              </PageMain>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
