'use client';

import { useState } from 'react';

import { Wrench } from 'lucide-react';

import { MarkTable, SectionIntro } from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { TOOL_DETAIL, TOOL_HEADERS, TOOL_ROWS } from './models';

export function Tools() {
  const [selected, setSelected] = useState('sparrow');
  const detail = TOOL_DETAIL[selected];

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='네 도구는 어디서 끝나는가'>
        여기까지는 원리였고 이제 실물이다. 넷 다 소프트웨어이고 형태가 서로 다르다. 데스크탑 앱 하나, 풀노드 실행 파일
        하나, 그리고 사용자가 직접 굽는 부팅 이미지와 기기 펌웨어가 하나씩이다. 잣대는 앞 탭들이 세운 것을 그대로
        가져왔다. 공개키를 바이너리와 다른 곳에서 받을 수 있는가, 서명하는 사람이 둘 이상인가, 남이 재현해 본 기록이
        공개돼 있는가, 이미 믿고 있는 것이 다음 것을 검증해 주는가. 빈칸은 결함이 아니라 대개 프로젝트 규모와 목적이
        부른 선택이다. 기여자가 몇 안 되는 곳에서 서명자가 하나인 것은 태만이 아니다.
      </SectionIntro>

      <MarkTable
        title='릴리스 검증 구조'
        icon={<Wrench className='size-4 text-emerald-500' />}
        headers={TOOL_HEADERS}
        rows={TOOL_ROWS}
        selected={selected}
        onSelect={setSelected}
      />

      <Card className='gap-2 p-4'>
        <span className='text-sm font-semibold'>{detail.title}</span>
        <p className='text-muted-foreground text-sm/relaxed'>{detail.body}</p>
      </Card>

      <p className='text-muted-foreground text-sm/relaxed'>
        넷 중 둘은 하드웨어를 함께 파는 제품이 아니다. 하나는 사용자가 따로 구한 라즈베리파이에 굽는 부팅 이미지이고,
        다른 하나는 기성 기기에 올리는 펌웨어다. 봉인된 상자를 사서 전원을 켜는 것이 아니라 독자가 부품을 모으고 직접
        굽는다. 그래서 이 둘에서는 릴리스 검증이 여러 안전장치 중 하나가 아니라 사실상 유일한 것이 된다. 데스크탑 앱은
        운영체제의 코드 서명이 한 겹 더 붙어 엉뚱한 것을 실행하면 경고라도 뜨지만, 카드에 이미지를 굽는 과정에는 그
        자리를 대신 봐 줄 주체가 없다. 에어갭도 그 사정을 나아지게 해 주지 않는다. 기기가 네트워크에 닿지 않는다는 말은
        검증을 대신 해 줄 PC가 필요하다는 뜻이고, 그 PC가 이미 감염됐을 수 있다는 것이 문제의 본질이다. 한쪽은 그 사정을
        펌웨어 안으로 끌어들여 다음 펌웨어의 서명을 스스로 확인하고, 다른 쪽은 카드 한 장이 신뢰 경계 전부라고 말하며
        다시 굽는 비용을 낮추는 쪽을 골랐다. 어느 쪽이든 첫 설치 한 번은 PC에서 끝나야 한다.
      </p>
    </div>
  );
}
