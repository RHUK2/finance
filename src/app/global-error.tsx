'use client';

import { ThemeProvider } from 'next-themes';

import { Button } from '@/components/ui/button';
import { SITE_NAME } from '@/lib/nav';

import './globals.css';

// root layout을 대신하는 마지막 오류 화면. 같은 예외를 다시 던질 수 있는 길잡이는 재사용하지 않는다.
// 전역 스타일·테마와 문서 제목은 이 화면에서 직접 제공한다.
// 다시 시도가 reset이 아니라 retry인 이유는 error.tsx에 적었다.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang='ko' suppressHydrationWarning>
      <body className='bg-background antialiased'>
        <title>{`오류 · ${SITE_NAME}`}</title>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
          <main className='flex min-h-svh flex-col items-start justify-center gap-2 p-6'>
            <h1 className='text-sm font-semibold'>화면을 그리는 중에 오류가 났습니다</h1>
            <p className='text-sm/relaxed text-muted-foreground'>잠시 뒤 다시 시도하십시오.</p>
            <Button variant='outline' size='sm' onClick={() => retry()}>
              다시 시도
            </Button>
            {/* 루트 오류에서 문서를 새로 받도록 일반 링크를 사용한다. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href='/' className='text-sm underline underline-offset-4'>
              홈으로 이동하십시오.
            </a>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
