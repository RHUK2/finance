'use client';

import { useState } from 'react';

import { ShieldAlert, Swords } from 'lucide-react';

import { MarkTable, SectionIntro, StatusBanner } from '@/components/simulation';
import { Panel } from '@/components/panel';

import { ATTACK_DETAIL, ATTACK_HEADERS, ATTACK_ROWS } from './models';

export function Attacker() {
  const [selected, setSelected] = useState('web');
  const detail = ATTACK_DETAIL[selected];
  const unreachable = selected === 'dev' || selected === 'fake';

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='어디를 쥐면 무엇이 통과하는가'>
        앞의 네 탭을 공격자 쪽에서 다시 본다. 행은 공격자가 장악한 곳이고 열은 독자가 쓰는 검증 수단이다. 칸은 그 수단이
        그 공격을 막는지를 나타낸다. 이 표에서 읽을 것은 어느 수단이 가장 강한가가 아니다. 검증이 어디까지 닿고 어디서
        멈추는가다.
      </SectionIntro>

      <MarkTable
        title='검증의 사정거리'
        icon={<Swords className='size-4 text-rose-500' />}
        headers={ATTACK_HEADERS}
        rows={ATTACK_ROWS}
        selected={selected}
        onSelect={setSelected}
      />

      <Panel className='gap-2'>
        <span className='text-sm font-semibold'>{detail.title}</span>
        <p className='text-sm/relaxed text-muted-foreground'>{detail.body}</p>
      </Panel>

      {unreachable && (
        <StatusBanner icon={<ShieldAlert className='size-4' />} tone='bad'>
          이 줄은 네 수단 모두 막지 못한다. 검증이 닿지 않는 곳이다
        </StatusBanner>
      )}

      <p className='text-sm/relaxed text-muted-foreground'>
        표를 위에서 아래로 읽으면 방어선이 한 칸씩 물러난다. 체크섬은 첫 줄에서 끝나고, 서명은 셋째 줄에서 끝나고, 채널
        대조도 같은 자리에서 끝나며, 재현 기록은 다섯째 줄에서 끝난다. 마지막 두 줄에는 아무것도 남지 않는다. 그러니
        모든 절차를 통과했다는 말의 정확한 뜻은 이것이다. 위 네 줄에 해당하는 공격은 받지 않았다. 아래 두 줄에 대해서는
        아무 말도 하지 않았다.
      </p>
    </div>
  );
}
