'use client';

import { useState } from 'react';

import {
  Banknote,
  Building2,
  Check,
  FileSignature,
  Gavel,
  HeartHandshake,
  Hourglass,
  Landmark,
  Lock,
  PenLine,
  PieChart,
  Receipt,
  Scale,
  Stamp,
  Vote,
  X,
} from 'lucide-react';

import { ExplainCard, SectionIntro } from '@/components/simulation';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Row = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  natural: boolean;
  legal: boolean;
  detail: string;
};

const ROWS: Row[] = [
  {
    id: 'contract',
    label: '계약을 맺는다',
    icon: FileSignature,
    natural: true,
    legal: true,
    detail:
      "계약서의 당사자란에는 '주식회사 A'가 적힌다. 다만 실제로 펜을 드는 건 대표이사이고, 계약에서 생기는 권리와 의무는 대표 개인이 아니라 회사에 달라붙는다.",
  },
  {
    id: 'property',
    label: '부동산을 소유한다',
    icon: Building2,
    natural: true,
    legal: true,
    detail:
      '등기부의 소유자란에 회사 이름이 그대로 올라간다. 대표가 바뀌어도, 주주가 전부 물갈이돼도 소유자는 변하지 않는다. 회사 건물은 대표의 것이 아니다.',
  },
  {
    id: 'bank',
    label: '계좌를 만들고 돈을 빌린다',
    icon: Banknote,
    natural: true,
    legal: true,
    detail:
      '법인 명의 계좌와 법인 대출이 따로 존재하고, 신용등급도 대표 개인과 별개로 매겨진다. 은행이 대표 개인 연대보증을 요구하는 건, 이 분리를 계약으로 다시 붙이는 행위다.',
  },
  {
    id: 'sue',
    label: '소송의 당사자가 된다',
    icon: Gavel,
    natural: true,
    legal: true,
    detail:
      "'주식회사 A'가 원고나 피고가 되고, 판결의 효력도 회사에 미친다. 회사를 상대로 이겨서 받은 판결로는 대표 개인 재산에 손을 댈 수 없다.",
  },
  {
    id: 'tax',
    label: '세금을 낸다',
    icon: Receipt,
    natural: true,
    legal: true,
    detail:
      '자연인은 소득세, 법인은 법인세를 낸다. 회사가 번 돈에 법인세를 물고, 남은 돈을 배당하면 받는 주주가 다시 소득세를 낸다. 인격이 둘이라 과세도 두 번이다.',
  },
  {
    id: 'own',
    label: '다른 회사의 주주가 된다',
    icon: PieChart,
    natural: true,
    legal: true,
    detail:
      '법인이 법인을 소유할 수 있다. 지주회사가 자회사 지분을 들고, 그 자회사가 손자회사를 드는 구조가 여기서 나온다. 사람이 사람을 소유할 수는 없지만 법인은 가능하다.',
  },
  {
    id: 'sign',
    label: '스스로 서명한다',
    icon: PenLine,
    natural: true,
    legal: false,
    detail:
      "법인에는 의사도, 손도 없다. 그래서 법은 회사의 '기관'을 따로 정해 둔다. 뜻을 정하는 주주총회·이사회, 그 뜻을 바깥에 대고 실행하는 대표이사. 대표가 없으면 회사는 아무것도 못 한다.",
  },
  {
    id: 'vote',
    label: '투표하고 혼인한다',
    icon: Vote,
    natural: true,
    legal: false,
    detail:
      '법인격은 법이 목적 범위 안에서 빌려준 것이라, 태생과 몸에 얽힌 권리는 주어지지 않는다. 선거권·혼인·상속 같은 신분상 권리는 자연인만의 몫이다.',
  },
  {
    id: 'jail',
    label: '감옥에 간다',
    icon: Lock,
    natural: true,
    legal: false,
    detail:
      '가둘 몸이 없으니 회사에는 벌금·영업정지·해산명령이 내려진다. 대신 위법행위를 실제로 저지른 임직원 개인은 따로 처벌받는다. 회사와 사람 양쪽을 함께 벌하는 양벌규정이다.',
  },
  {
    id: 'die',
    label: '수명이 있다',
    icon: Hourglass,
    natural: true,
    legal: false,
    detail:
      '법인격은 설립등기로 태어나 청산종결로 소멸한다. 그사이에는 늙지 않는다. 창업자가 죽어도 회사는 그대로 남고, 주식만 상속인에게 넘어간다. 사람보다 오래 사는 인격이다.',
  },
];

// 표의 헤더 줄과 각 행이 같은 열 폭을 써야 하므로 한곳에서 관리한다.
const TABLE_COLS = 'grid grid-cols-[1fr_3rem_3rem] items-center gap-x-2 sm:grid-cols-[1fr_4rem_4rem]';

const BIRTH_STEPS = [
  { label: '정관 작성', sub: '회사의 목적·상호·자본을 정한다' },
  { label: '출자 납입', sub: '주주가 돈을 내고 주식을 받는다' },
  { label: '설립등기', sub: '등기부에 회사가 기재된다' },
  { label: '법인격 발생', sub: '이 순간부터 법이 사람으로 취급한다' },
];

export function LegalPerson() {
  const [selected, setSelected] = useState('contract');
  const row = ROWS.find((r) => r.id === selected) ?? ROWS[0];

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='법인격이란 무엇인가'>
        법인은 비유가 아니다. 법은 회사를 실제로 권리와 의무의 주체로 취급한다. 회사 이름으로 땅을 사고, 돈을 빌리고,
        소송을 걸 수 있다. 다만 태생부터 인격을 가진 자연인과 달리 법인의 인격은 등기라는 절차로 부여된 것이라, 목적
        범위 안에서만 사람이다. 어디까지 사람이고, 어디부터는 아닌지 짚어 보자.
      </SectionIntro>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <Stamp className='size-4 text-rose-500' />
          법인격이 생기는 순서
        </span>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
          {BIRTH_STEPS.map((s, i) => (
            <div key={s.label} className='flex flex-col gap-1 rounded-md border p-3'>
              <span className='text-muted-foreground text-xs tabular-nums'>{i + 1}단계</span>
              <span className='text-sm font-medium'>{s.label}</span>
              <span className='text-muted-foreground text-xs/snug'>{s.sub}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className='gap-0 overflow-hidden p-0'>
        <div className='flex flex-col gap-1 p-4'>
          <span className='flex items-center gap-1.5 text-sm font-semibold'>
            <Scale className='size-4 text-sky-500' />
            자연인과 법인, 어디까지 같은가
          </span>
          <span className='text-muted-foreground text-xs'>항목을 누르면 표 아래에 설명이 열린다</span>
        </div>
        <div className={cn(TABLE_COLS, 'text-muted-foreground border-y px-4 py-2 text-xs')}>
          <span>할 수 있는가</span>
          <span className='text-center'>자연인</span>
          <span className='text-center'>법인</span>
        </div>
        {ROWS.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelected(r.id)}
            className={cn(
              TABLE_COLS,
              'border-b px-4 py-2.5 text-left text-sm transition-colors last:border-b-0',
              selected === r.id ? 'bg-muted' : 'hover:bg-muted/50',
            )}
          >
            <span className='flex items-center gap-2'>
              <r.icon className='text-muted-foreground size-4 shrink-0' />
              {r.label}
            </span>
            <Mark ok={r.natural} />
            <Mark ok={r.legal} />
          </button>
        ))}
      </Card>

      <Card className='gap-2 p-4'>
        <span className='flex items-center gap-1.5 font-semibold'>
          <row.icon className='size-4' />
          {row.label}
        </span>
        <p className='text-muted-foreground text-sm/relaxed'>{row.detail}</p>
      </Card>

      <ExplainCard
        icon={<Landmark className='size-4 text-amber-500' />}
        title='왜 굳이 사람을 하나 더 만들었을까'
        preview='자본을 모으려면, 사업의 실패가 사람의 파산으로 번지지 않아야 했다.'
        body={
          <>
            <p>
              큰 사업에는 여러 사람의 돈이 필요하다. 그런데 사업이 망할 때마다 출자자 전원이 전 재산을 잃는다면 아무도
              모르는 사람의 사업에 돈을 넣지 않는다. 그래서 사업 자체에 별도의 인격을 주고, 채권자가 쫓아갈 수 있는
              범위를 그 인격이 가진 재산으로 한정했다. 출자자는 낸 돈만 잃는다.
            </p>
            <p className='mt-2'>
              분리는 반대 방향으로도 작동한다. 회사 재산은 주주의 것이 아니므로 주주가 개인 빚을 져도 채권자가 회사
              공장을 가져갈 수 없다. 주주가 바뀌어도 회사가 맺은 계약은 그대로 살아 있다. 사람과 사업의 운명을 끊어 놓은
              이 장치 덕분에 낯선 사람끼리 자본을 모을 수 있게 됐고, 주식이라는 지분 조각을 사고파는 시장도 여기서
              출발한다.
            </p>
          </>
        }
      />

      <ExplainCard
        icon={<HeartHandshake className='size-4 text-sky-500' />}
        title='회사는 누구의 것인가'
        preview='주주는 회사 재산이 아니라 회사에 대한 지분을 가진다.'
        body={
          <>
            <p>
              흔한 오해는 주주가 회사 재산의 주인이라는 생각이다. 법적으로 회사 재산의 소유자는 회사 자신이다. 주주가
              가진 것은 회사라는 인격에 대한 지분, 곧 의결권과 이익 배당·잔여재산 분배를 요구할 권리다. 지분 100%
              주주라도 회사 금고의 돈을 마음대로 꺼내 쓰면 횡령이 된다.
            </p>
            <p className='mt-2'>
              그래서 주주가 회사에서 돈을 빼는 경로는 정해져 있다. 배당을 받거나, 주식을 팔거나, 회사가 자기 주식을 사
              줄 때 응하거나, 청산 후 남은 재산을 나눠 받는 것. 이 통로 밖으로 새는 돈은 전부 다른 이름이 붙는다.
            </p>
          </>
        }
      />
    </div>
  );
}

function Mark({ ok }: { ok: boolean }) {
  return (
    <span className='flex justify-center'>
      {ok ? (
        <Check className='size-4 text-emerald-600 dark:text-emerald-400' />
      ) : (
        <X className='size-4 text-rose-600 dark:text-rose-400' />
      )}
    </span>
  );
}
