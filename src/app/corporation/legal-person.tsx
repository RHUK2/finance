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
      "계약서의 당사자란에는 '주식회사 A'가 적힌다. 다만 실제로 펜을 드는 건 대표이사 같은 기관이나 권한을 위임받은 사용인이고, 계약에서 생기는 권리와 의무는 그 개인이 아니라 회사에 달라붙는다.",
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
      '자연인은 소득세, 법인은 법인세를 낸다. 회사가 번 돈에 법인세를 물고, 남은 돈을 배당하면 받는 주주가 다시 소득세를 낸다. 인격이 둘이라 과세도 두 번이다. 다만 같은 소득에 두 번 물리는 몫은 배당세액공제로 일부 덜어 준다.',
  },
  {
    id: 'own',
    label: '다른 회사의 주주가 된다',
    icon: PieChart,
    natural: true,
    legal: true,
    detail:
      '법인이 법인을 소유할 수 있다. 지주회사가 자회사 지분을 들고, 그 자회사가 손자회사를 드는 구조가 여기서 나온다. 자연인은 다른 자연인을 소유할 수 없지만, 법인격은 지분이라는 형태로 통째로 소유될 수 있다.',
  },
  {
    id: 'sign',
    label: '스스로 서명한다',
    icon: PenLine,
    natural: true,
    legal: false,
    detail:
      "자연인은 스스로 뜻을 정하고 그 뜻을 표시하지만, 법인격에는 그럴 수단이 없다. 그래서 법은 회사의 '기관'을 따로 정해 둔다. 뜻을 정하는 주주총회·이사회, 그 뜻을 바깥에 대고 표시하는 대표이사. 대표가 없으면 회사는 아무것도 못 한다.",
  },
  {
    id: 'vote',
    label: '투표하고 혼인한다',
    icon: Vote,
    natural: true,
    legal: false,
    detail:
      '법인격에는 재산상 권리만 주어진다. 선거권·혼인·상속처럼 자연인의 신분에서 비롯되는 권리는 법인격의 범위 밖이다. 법인은 목적 사업을 수행하기 위해 만들어진 인격이기 때문이다.',
  },
  {
    id: 'jail',
    label: '감옥에 간다',
    icon: Lock,
    natural: true,
    legal: false,
    detail:
      '자유형은 자연인에게만 집행할 수 있어 법인에 과할 수 있는 형벌은 벌금·과료·몰수뿐이다. 영업정지는 행정처분, 해산명령은 법원의 명령이라 형벌과는 층이 다르다. 위법행위를 실제로 저지른 임직원을 처벌하는 데 더해 법인에도 벌금을 물리는 것이 양벌규정이다.',
  },
  {
    id: 'die',
    label: '수명이 있다',
    icon: Hourglass,
    natural: true,
    legal: false,
    detail:
      '자연인의 인격은 사망으로 끝나지만 법인격에는 따로 정하지 않는 한 존속기간의 제한이 없다. 설립등기로 발생해 청산종결로 소멸할 뿐이라, 창업자가 사망해도 회사는 그대로 남고 그가 가졌던 주식만 상속인에게 넘어간다. 정관에 존립기간을 적어 두면 그 만료가 해산사유가 되지만, 이는 스스로 수명을 정해 둔 경우다.',
  },
];

// 표의 헤더 줄과 각 행이 같은 열 폭을 써야 하므로 한곳에서 관리한다.
const TABLE_COLS = 'grid grid-cols-[1fr_3rem_3rem] items-center gap-x-2 sm:grid-cols-[1fr_4rem_4rem]';

const BIRTH_STEPS = [
  { label: '정관 작성', sub: '회사의 목적·상호·자본을 정한다' },
  { label: '출자 납입', sub: '주주가 돈을 내고 주식을 받는다' },
  { label: '설립등기', sub: '등기부에 회사가 기재된다' },
  { label: '법인격 발생', sub: '이 순간부터 권리·의무의 주체가 된다' },
];

export function LegalPerson() {
  const [selected, setSelected] = useState('contract');
  const row = ROWS.find((r) => r.id === selected) ?? ROWS[0];

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='법인격이란 무엇인가'>
        법이 인정하는 인격에는 두 종류가 있다. 태어나면서 인격을 갖는 자연인, 그리고 등기라는 절차로 인격을 부여받는
        법인이다. 인격을 가진다는 것은 자기 이름으로 권리를 갖고 의무를 진다는 뜻이라, 법인도 회사 이름으로 땅을 사고
        돈을 빌리고 소송의 당사자가 된다. 다만 법인격은 법이 목적 범위 안에서 부여한 것이므로 자연인의 인격과 범위가
        같지 않다. 어디까지 겹치고 어디부터 갈라지는지 짚어 보자.
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
        title='왜 인격을 하나 더 만들었을까'
        preview='자연인의 인격 하나로는 사업의 실패와 출자자의 파산을 떼어 놓을 수 없었다.'
        body={
          <>
            <p>
              큰 사업에는 여러 출자자의 돈이 필요하다. 그런데 인격이 자연인 하나뿐이면 사업의 채무가 곧 출자자 개인의
              채무가 된다. 사업이 망할 때마다 전 재산을 잃는다면 아무도 남의 사업에 돈을 넣지 않는다. 그래서 사업 자체에
              별도의 인격을 세우고, 채권자가 쫓아갈 수 있는 범위를 그 인격이 가진 재산으로 한정했다. 출자자는 낸 돈만
              잃는다.
            </p>
            <p className='mt-2'>
              분리는 반대 방향으로도 작동한다. 회사 재산은 주주의 것이 아니므로 주주가 개인 채무를 져도 채권자가 회사
              공장을 가져갈 수 없다. 주주가 바뀌어도 회사가 맺은 계약은 그대로 살아 있다. 두 인격의 운명을 끊어 놓은 이
              장치 덕분에 서로 모르는 출자자끼리 자본을 모을 수 있게 됐고, 주식이라는 지분 조각을 사고파는 시장도 여기서
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
