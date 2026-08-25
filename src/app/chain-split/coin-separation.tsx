'use client';

import { useState } from 'react';

import { Building2, HandCoins, Scissors, Usb } from 'lucide-react';

import { ExplainCard, MarkTable, SectionIntro, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { SEPARATION_METHODS } from './models';

const ROWS = SEPARATION_METHODS.map(({ id, label, sub, marks }) => ({ id, label, sub, marks }));

export function CoinSeparation() {
  const [selected, setSelected] = useState(SEPARATION_METHODS[0].id);
  const method = SEPARATION_METHODS.find((m) => m.id === selected) ?? SEPARATION_METHODS[0];

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='코인 분리란 한쪽에서만 유효한 트랜잭션을 일부러 만드는 일이다'>
        리플레이를 끊는 방법은 결국 하나다. 두 체인 중 한쪽에서만 검증을 통과하는 트랜잭션을 만드는 것. 갈리는 것은
        유효성을 무엇으로 가르느냐다. 입력으로 가르거나, 규칙 차이로 가르거나, 서명 자체로 가른다. 세 방법이 어느 분기
        유형에서 통하고 개인이 실제로 쓸 만한지를 같은 잣대로 재 본다.
      </SectionIntro>

      <MarkTable
        title='세 가지 분리 방법'
        icon={<Scissors className='size-4 text-sky-600 dark:text-sky-400' />}
        headers={['방법', '소프트포크 분기', '하드포크 분기', '개인이 직접']}
        rows={ROWS}
        selected={selected}
        onSelect={setSelected}
      />

      <Card className='gap-1.5 p-4'>
        <span className='text-sm font-semibold'>{method.label}</span>
        <p className='text-muted-foreground text-sm/relaxed'>{method.body}</p>
      </Card>

      <StatusBanner tone='good' icon={<HandCoins className='size-5 shrink-0' />}>
        <div>
          <p className='font-semibold'>개인에게 현실적인 최선은 아무것도 하지 않는 것이다</p>
          <p className='text-muted-foreground mt-0.5 text-xs font-normal'>
            리플레이는 트랜잭션을 브로드캐스트해야 시작된다. 분기 전후로 송금하지 않으면 노출될 트랜잭션 자체가 없다.
            분기 코인이 값이 붙을지는 나중에 확인해도 늦지 않고, 값이 붙지 않으면 서둘러 분리할 이유도 없다. 위 세
            방법은 분리를 해야만 하는 사정이 있을 때 무엇이 가능한지를 아는 용도다. 실제 실행은 자신이 쓰는 지갑과
            거래소의 공지를 따라야 한다.
          </p>
        </div>
      </StatusBanner>

      <ExplainCard
        icon={<Usb className='size-4 text-amber-500' />}
        title='하드웨어 지갑 사용자가 특히 위험한 이유'
        preview='분기 코인을 받으려고 시드를 다른 지갑에 넣는 순간 두 위험이 겹친다'
        body={
          <div className='flex flex-col gap-2'>
            <p>
              분기 코인은 같은 개인키로 지배되므로, 받으려면 그 키를 새 체인을 지원하는 소프트웨어에 넣어야 한다. 여기서
              두 가지가 동시에 일어난다. 첫째, 검증되지 않은 지갑 소프트웨어에 시드 문구를 직접 입력하게 된다. 분기
              때마다 이 심리를 노린 가짜 청구 지갑이 등장하고, 시드를 한 번 넘기면 분기 코인이 아니라 본체를 잃는다.
            </p>
            <p>
              둘째, 그 지갑이 리플레이 보호 없이 트랜잭션을 만들면 분기 코인을 옮기는 동작이 그대로 본체 체인으로
              복사된다. 2026년 8월의 eCash 분기가 정확히 이 구성이었다. 완전한 리플레이 보호가 없는 상태로 1:1 크레딧이
              배포되어, 분기 코인을 청구하는 행위 자체가 위험하다는 경고가 나왔다.
            </p>
            <p>
              하드웨어 지갑을 쓰는 사람이 더 위험한 것은 기술을 몰라서가 아니라 반대다. 평소 시드를 기기 밖으로 꺼낼
              일이 없던 사람이 분기 코인 때문에 처음으로 꺼내게 되고, 그 한 번이 가장 위험한 한 번이 된다.
            </p>
          </div>
        }
      />

      <ExplainCard
        icon={<Building2 className='size-4 text-sky-500' />}
        title='거래소가 분기 전후로 입출금을 막는 이유'
        preview='보유자를 보호하려는 것이기도 하지만, 먼저 자기 장부를 지키려는 것이다'
        body={
          <div className='flex flex-col gap-2'>
            <p>
              거래소는 고객 잔고를 한 뭉치로 모아 관리한다. 분기 직후 출금 요청을 그대로 처리하면 그 트랜잭션이 반대편
              체인으로 복사되어, 지원할 생각도 없던 체인에서 자기 보유고가 함께 빠져나간다. 고객 한 명의 출금이 거래소
              전체의 분기 체인 잔고를 깎는 셈이다.
            </p>
            <p>
              그래서 순서가 정해져 있다. 분기 높이 전에 입출금을 멈추고, 두 체인의 상태를 각각 확정한 뒤, 분리가
              안전하게 가능해지면 재개한다. 이 순서를 지키면 재개 이후의 출금분이 곧 한쪽 체인에만 존재하는 UTXO가 되어,
              위 표 첫째 방법의 재료를 시장에 공급하는 역할까지 한다.
            </p>
            <p>
              거래소가 분기 코인을 지원하지 않기로 하는 것과 보유자 몫을 보존하지 않는 것은 다른 문제다. 어느 거래소도
              분기 코인을 상장할 의무는 없지만, 보존 없이 처리하면 고객 몫이 조용히 사라진다. 2026년 8월의 두 분기에서
              주요 거래소가 상장을 확약하지 않으면서도 입출금은 먼저 멈춘 이유가 여기 있다.
            </p>
          </div>
        }
      />
    </div>
  );
}
