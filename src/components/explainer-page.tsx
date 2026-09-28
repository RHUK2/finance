'use client';

import { MobileNavDrawer } from '@/components/mobile-nav-drawer';
import { PageMain } from '@/components/page-main';

// 설명형 페이지의 껍데기. 사이트에는 성격이 다른 두 부류가 있고 껍데기 규약도
// 갈리는데(CLAUDE.md "페이지 두 갈래"), 이 컴포넌트를 쓰면 설명형, MobileNavDrawer와
// PageMain을 직접 쓰면 데이터 대시보드다. 대시보드는 다섯뿐이고 h1도 폭 제한도 없다.
//
// 페이지 이름은 여기에 적지 않는다. 데스크탑 사이드바와 모바일 하단 바가 경로로
// nav.ts에서 끌어오므로 이름의 단일 출처는 거기다. title은 화면에 그리는 h1이고
// 길잡이가 부르는 이름과 달라도 된다.
//
// intro가 ReactNode인 것은 인트로 문단에 다른 페이지로 가는 링크나 <i>, 보간값이
// 섞이기 때문이다. 감싸는 <p>와 그 클래스는 여기서만 정한다.
export function ExplainerPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <MobileNavDrawer />
      <PageMain>
        <div className='mx-auto flex max-w-5xl flex-col gap-4'>
          <div>
            <h1 className='text-xl font-semibold'>{title}</h1>
            <p className='mt-1 text-sm/relaxed text-muted-foreground'>{intro}</p>
          </div>
          {children}
        </div>
      </PageMain>
    </>
  );
}
