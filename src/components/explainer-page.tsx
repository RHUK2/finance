'use client';

import { AppHeader } from '@/components/app-header';
import { PageMain } from '@/components/page-main';

// 설명형 페이지의 껍데기. 사이트에는 성격이 다른 두 부류가 있고 껍데기 규약도
// 갈리는데(CLAUDE.md "페이지 두 갈래"), 이 컴포넌트를 쓰면 설명형, AppHeader와
// PageMain을 직접 쓰면 데이터 대시보드다. 대시보드는 다섯뿐이고 h1도 폭 제한도 없다.
//
// breadcrumb은 prop이 아니라 경로로 nav에서 끌어온다. 페이지 이름을 여기와
// nav.ts 두 곳에 적어 두면 한쪽만 고쳤을 때 같은 페이지가 두 이름으로 보인다.
// 설명형 페이지는 모두 최상위라 한 단계면 되고, 계층이 생기면 AppHeader에
// breadcrumbs를 직접 넘기면 된다.
//
// intro가 ReactNode인 것은 인트로 문단에 다른 페이지로 가는 링크나 <i>, 보간값이
// 섞이기 때문이다. 감싸는 <p>와 그 클래스는 여기서만 정한다.
export function ExplainerPage({
  title,
  intro,
  children,
  hideScrollTop,
}: {
  title: string;
  intro: React.ReactNode;
  children: React.ReactNode;
  /** 하단 상시 패널과 겹칠 때 스크롤-투-톱 버튼을 숨긴다 */
  hideScrollTop?: boolean;
}) {
  return (
    <>
      <AppHeader />
      <PageMain hideScrollTop={hideScrollTop}>
        <div className='mx-auto flex max-w-5xl flex-col gap-4'>
          <div>
            <h1 className='text-xl font-semibold'>{title}</h1>
            <p className='text-muted-foreground mt-1 text-sm/relaxed'>{intro}</p>
          </div>
          {children}
        </div>
      </PageMain>
    </>
  );
}
