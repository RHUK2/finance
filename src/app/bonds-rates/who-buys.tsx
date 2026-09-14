'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Banknote, Building2, Globe, Landmark, Users } from 'lucide-react';

import { MarkTable, type MarkRow, SectionIntro } from '@/components/simulation';
import { Card } from '@/components/ui/card';

// 세 잣대로 같은 질문을 던진다. 국채를 사는 이유가 수익률이 아닌 주체가 섞여 있다는
// 것이 이 표의 논지라, 첫 열이 갈리는 자리다.
const ROWS: MarkRow[] = [
  {
    id: 'foreign-cb',
    label: '외국 중앙은행',
    sub: '외환보유고',
    icon: Globe,
    marks: ['no', 'partial', 'yes'],
  },
  {
    id: 'central-bank',
    label: '자국 중앙은행',
    sub: '양적완화',
    icon: Landmark,
    marks: ['no', 'partial', 'yes'],
  },
  {
    id: 'institutions',
    label: '은행·보험·연기금',
    sub: '규제와 부채 대응',
    icon: Building2,
    marks: ['partial', 'yes', 'partial'],
  },
  {
    id: 'private',
    label: '개인·자산운용사',
    sub: '투자',
    icon: Users,
    marks: ['yes', 'yes', 'no'],
  },
];

const DETAIL: Record<string, { title: string; body: string }> = {
  'foreign-cb': {
    title: '수익률을 보고 사지 않는다',
    body: '무역 흑자로 쌓인 달러를 어딘가에 두어야 하는데, 그만한 규모를 언제든 팔 수 있게 담아 둘 곳이 미국 국채 말고는 마땅치 않다. 금리가 낮아도 산다. 팔 수는 있지만 대량으로 팔면 자국 통화가 절상되고 보유고 가치가 흔들려 쉽게 움직이지 못한다. 달러 체제가 왜 최악이라면서도 대체되지 않는지는 달러 패권 페이지가 다룬다.',
  },
  'central-bank': {
    title: '값을 누르려고 산다',
    body: '중앙은행은 수익을 내려고 국채를 사는 것이 아니라 장기금리를 끌어내리려고 산다. 살 돈은 어디서 오는가. 없던 지급준비금을 새로 만들어 낸다. 이 과정이 신용창조 페이지가 다루는 돈이 생기는 자리 중 하나다. 그래서 중앙은행의 매입은 금리를 낮추는 쪽으로 가장 확실하게 작동하고, 거꾸로 보유 국채를 줄이기 시작하면(양적긴축) 그 힘이 반대로 걸린다.',
  },
  institutions: {
    title: '수익률도 보지만 규제도 본다',
    body: '은행은 유동성 규제 때문에, 보험사와 연기금은 수십 년 뒤의 지급 약속에 만기를 맞추려고 국채를 산다. 특히 연기금은 부채의 듀레이션이 길어 장기물을 사야 하고, 그래서 수익률이 낮아도 장기 국채 수요가 일정하게 깔린다. 다만 이들은 시가평가를 하므로 금리가 오르면 평가손이 곧바로 드러난다. 앞 탭에서 본 2023년 지역은행 사례가 여기서 나온다.',
  },
  private: {
    title: '값이 맞아야 산다',
    body: '개인과 자산운용사는 다른 자산과 견줘 국채가 매력적일 때만 산다. 금리가 낮으면 주식이나 회사채로 옮겨 가고, 금리가 높으면 돌아온다. 넷 중 유일하게 수익률에만 반응하는 쪽이라, 앞의 셋이 물러난 자리를 이들이 메우려면 그만한 금리를 쳐 줘야 한다. 재정적자가 커질 때 장기금리가 밀려 올라가는 경로가 이것이다.',
  },
};

export function WhoBuys() {
  const [selected, setSelected] = useState('foreign-cb');
  const detail = DETAIL[selected];

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='국채를 사는 사람이 다 같은 이유로 사지는 않는다'>
        앞의 세 탭은 채권 한 장을 값을 보고 사고파는 물건으로 다뤘다. 그런데 국채 시장의 큰 손 중 상당수는 수익률을 보고
        사지 않는다. 외환보유고를 담아 둘 곳이 필요해서, 장기금리를 눌러야 해서, 규제가 요구해서 산다. 누가 어떤 이유로
        들고 있는지가 갈리면 금리가 왜 그 자리에 있는지도 갈린다.
      </SectionIntro>

      <MarkTable
        title='국채 보유 주체'
        icon={<Banknote className='size-4 text-emerald-500' />}
        headers={['보유 주체', '수익률 보고 산다', '자유롭게 판다', '금리를 낮춘다']}
        rows={ROWS}
        selected={selected}
        onSelect={setSelected}
      />

      <Card className='gap-2 p-4'>
        <span className='text-sm font-semibold'>{detail.title}</span>
        <p className='text-muted-foreground text-sm/relaxed'>{detail.body}</p>
      </Card>

      <p className='text-muted-foreground text-sm/relaxed'>
        중앙은행이 국채를 살 돈이 어디서 나오는지는{' '}
        <Link href='/money-creation' className='underline underline-offset-2'>
          신용창조
        </Link>
        가, 외국 중앙은행이 왜 달러 국채를 떠안는지는{' '}
        <Link href='/dollar-hegemony' className='underline underline-offset-2'>
          달러 패권
        </Link>
        이 다룬다. 그 국채 금리가 예금의 구매력을 어떻게 갉는지는{' '}
        <Link href='/inflation' className='underline underline-offset-2'>
          구매력 붕괴
        </Link>
        로 이어진다.
      </p>
    </div>
  );
}
