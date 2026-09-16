'use client';

import { ExplainerPage } from '@/components/explainer-page';
import { SimTabs } from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { Attacker } from './attacker';
import { Checksum } from './checksum';
import { KeyOrigin } from './key-origin';
import { Reproducible } from './reproducible';
import { Signature } from './signature';

export function ReleaseVerifyView() {
  return (
    <ExplainerPage
      title='해시를 맞춰 봤다고 무엇이 증명되는가'
      intro={
        <>
          거의 아무것도 증명되지 않는다. 지갑 소프트웨어를 받으면 해시를 대조하고 서명을 확인하라고들 하는데, 그 절차가
          실제로 막아 주는 범위는 대부분이 생각하는 것보다 훨씬 좁다. 검증은 신뢰를 없애 주지 않는다. 해시는 서명으로,
          서명은 공개키로, 공개키는 결국 어딘가의 사람에게로 신뢰를 밀어낼 뿐이다. 이 페이지는 그 사슬이 어디서
          멈추는지, 그리고 멈춘 자리 너머에 무엇이 남는지를 본다. 체크섬과 서명은 브라우저가 실제로 계산하는 진짜
          값이다.
        </>
      }
    >
      <Card className='gap-2 border-amber-500/40 bg-amber-500/5 p-4 text-sm/relaxed'>
        <span className='font-semibold text-amber-600 dark:text-amber-400'>검증 안내서가 아니다</span>
        <p className='text-muted-foreground'>
          이 페이지에는 실제 프로젝트의 공개키 지문도, 그대로 복사해 실행할 검증 명령도 없다. 지문은 여기가 아니라 서로
          독립인 여러 채널에서 대조하고, 절차는 각 프로젝트의 공식 문서를 따른다.
        </p>
      </Card>

      <SimTabs
        defaultValue='checksum'
        tabs={[
          { value: 'checksum', label: '체크섬', node: <Checksum /> },
          { value: 'signature', label: '릴리스 서명', node: <Signature /> },
          { value: 'key', label: '키의 출처', node: <KeyOrigin /> },
          { value: 'build', label: '재현 가능한 빌드', node: <Reproducible /> },
          { value: 'attacker', label: '공격자의 시점', node: <Attacker /> },
        ]}
      />
    </ExplainerPage>
  );
}
