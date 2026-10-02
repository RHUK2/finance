import type { Metadata } from 'next';
import Link from 'next/link';

import { MobileNavDrawer } from '@/components/mobile-nav-drawer';
import { PageMain } from '@/components/page-main';

// 없는 경로. 대시보드도 설명형도 아니라 껍데기는 하단 바와 본문 하나뿐이다. 데스크탑 사이드바는
// layout이 그린다. 하단 바가 없으면 모바일에서 다른 페이지로 갈 길이 사라진다.
export const metadata: Metadata = { title: '페이지 없음' };

export default function NotFound() {
  return (
    <>
      <MobileNavDrawer label='페이지 없음' />
      <PageMain>
        <div className='flex flex-col gap-2'>
          <p className='text-sm font-semibold'>없는 페이지입니다</p>
          <p className='text-sm/relaxed text-muted-foreground'>
            주소가 바뀌었거나 잘못 입력되었을 수 있습니다. 메뉴에서 페이지를 고르거나{' '}
            <Link href='/' className='underline underline-offset-2'>
              첫 화면
            </Link>
            으로 돌아가십시오.
          </p>
        </div>
      </PageMain>
    </>
  );
}
