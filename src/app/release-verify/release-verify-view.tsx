'use client';

import Link from 'next/link';

import { ExplainerPage } from '@/components/explainer-page';
import { SimTabs } from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { Attacker } from './attacker';
import { Checksum } from './checksum';
import { KeyOrigin } from './key-origin';
import { Reproducible } from './reproducible';
import { Signature } from './signature';
import { Tools } from './tools';

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
          이 페이지에는 실제 프로젝트의 공개키 지문도, 그대로 복사해 실행할 검증 명령도 없다. 일부러 뺐다. 지문을 여기
          적어 두면 이 페이지가 스스로 비판하는 그 신뢰 앵커 노릇을 하게 되고, 키가 바뀌는 날부터는 조용히 틀린 값이
          된다. 지문은 여기가 아니라 서로 독립인 여러 채널에서 대조하고, 절차는 각 프로젝트의 공식 문서를 따른다.
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

      <Tools />

      <p className='text-muted-foreground text-sm/relaxed'>
        서명이 수학적으로 어떻게 성립하는지는{' '}
        <Link href='/ecdsa' className='underline underline-offset-2'>
          ECDSA·타원곡선
        </Link>
        에서, 검증을 마친 지갑이 실제로 키를 어떻게 만들어 내는지는{' '}
        <Link href='/wallet-keys' className='underline underline-offset-2'>
          지갑 키 생성
        </Link>
        에서 다룬다. 여기서 쓴 릴리스 서명 키와 그 지갑 키는 원리만 같을 뿐 서로 아무 관계가 없다.
      </p>
    </ExplainerPage>
  );
}
