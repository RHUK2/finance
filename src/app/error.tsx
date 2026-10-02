'use client';

import { useEffect } from 'react';

import { MobileNavDrawer } from '@/components/mobile-nav-drawer';
import { PageMain } from '@/components/page-main';
import { Button } from '@/components/ui/button';

// 페이지 렌더 중 예외. root layout 안에서 그려지므로 데스크탑 사이드바는 그대로 있고, 하단 바만 여기서
// 그린다. 다시 시도는 retry다. reset은 클라이언트에서 다시 그리기만 해서 서버 컴포넌트(prefetch)에서 난
// 오류는 같은 결과로 돌아온다. retry는 그 구간을 서버에서 다시 받아 그린다.
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
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
    </>
  );
}
