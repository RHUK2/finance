'use client';

import { useState } from 'react';

import { ArrowLeftRight, Check, Layers, Minus, Repeat, TrendingUp, X } from 'lucide-react';

import { ControlSlider, CostBar, ExplainCard, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// 교육용 예시 회사. 금액 단위는 억원, 주가는 원.
const BASE_SHARES = 10_000_000;
const CB_FACE = 100;
const CB_COUPON = 3; // 만기까지 받는 이자 총액
const CONV_PRICE = 20_000;
const CB_SHARES = (CB_FACE * 1e8) / CONV_PRICE;
const REDEEM = CB_FACE + CB_COUPON;
const CONV_STAKE = CB_SHARES / (BASE_SHARES + CB_SHARES);
const BREAKEVEN = REDEEM / CONV_STAKE;

const fmt = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}억`;
const fmtWon = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;

type Instrument = {
  id: string;
  label: string;
  principal: 'yes' | 'no' | 'partial';
  vote: 'yes' | 'no';
  upside: 'yes' | 'no' | 'partial';
  rank: string;
  detail: string;
};

const INSTRUMENTS: Instrument[] = [
  {
    id: 'bond',
    label: '회사채',
    principal: 'yes',
    vote: 'no',
    upside: 'no',
    rank: '채권',
    detail:
      '원금과 이자를 약속받는 대신 회사가 아무리 잘돼도 그 이상은 받지 못한다. 경영에 관여할 권한도 없다. 회사의 성패보다 갚을 능력이 있는지만 따지는 자리다.',
  },
  {
    id: 'cb',
    label: '전환사채',
    principal: 'partial',
    vote: 'no',
    upside: 'yes',
    rank: '채권 (전환 전)',
    detail:
      '전환하기 전까지는 채권이라 원금을 돌려받을 권리가 있고, 주가가 오르면 주식으로 바꿔 상방을 가져갈 수 있다. 아래는 막고 위는 열어 둔 구조라 표면금리가 보통 사채보다 낮다.',
  },
  {
    id: 'pref',
    label: '우선주',
    principal: 'no',
    vote: 'no',
    upside: 'partial',
    rank: '주식 (보통주보다 앞)',
    detail:
      '배당과 잔여재산 분배에서 보통주보다 앞서는 대신 의결권이 없다. 지배권을 내주지 않으면서 자본을 늘리려는 회사가 발행한다. 배당률이 정해진 종류라면 회사가 크게 성장해도 받는 몫은 그대로다.',
  },
  {
    id: 'common',
    label: '보통주',
    principal: 'no',
    vote: 'yes',
    upside: 'yes',
    rank: '맨 뒤',
    detail:
      '돌려받기로 약속된 것이 하나도 없는 대신, 앞의 모두를 만족시키고 남는 전부를 가져간다. 의결권으로 경영진을 세우고 갈아 치우는 것도 이 자리의 몫이다.',
  },
];

const COLS = 'grid grid-cols-[1fr_2.5rem_2.5rem_2.5rem] items-center gap-x-2 sm:grid-cols-[1fr_4rem_4rem_4rem]';

export function Hybrid() {
  const [value, setValue] = useState(1500);
  const [selected, setSelected] = useState('cb');
  const instrument = INSTRUMENTS.find((i) => i.id === selected) ?? INSTRUMENTS[1];

  const convValue = value * CONV_STAKE;
  const converts = convValue > REDEEM;
  const holder = converts ? convValue : REDEEM;
  const existing = value - holder;

  const priceConverted = (value * 1e8) / (BASE_SHARES + CB_SHARES);
  const priceRedeemed = ((value - REDEEM) * 1e8) / BASE_SHARES;
  const price = converts ? priceConverted : priceRedeemed;

  const barMax = Math.max(value, 1);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='채권과 주식 사이'>
        앞 탭의 워터폴은 층이 뚜렷하게 나뉜 그림이었다. 실제 자금 조달에는 그 사이에 걸친 증권이 많다. 평소에는 채권처럼
        원금을 약속받다가 회사가 잘되면 주식으로 갈아타는 전환사채, 주식이면서 배당은 먼저 받고 의결권은 포기하는
        우선주가 그렇다. 어느 성질을 얼마나 가져오느냐로 값이 정해진다.
      </SectionIntro>

      <Card className='gap-0 overflow-hidden p-0'>
        <div className='flex flex-col gap-1 p-4'>
          <span className='flex items-center gap-1.5 text-sm font-semibold'>
            <Layers className='size-4 text-violet-500' />네 가지 증권은 무엇을 주고 무엇을 받는가
          </span>
          <span className='text-muted-foreground text-xs'>항목을 누르면 표 아래에 설명이 열린다</span>
        </div>
        <div className={cn(COLS, 'text-muted-foreground border-y px-4 py-2 text-xs')}>
          <span>증권</span>
          <span className='text-center'>원금</span>
          <span className='text-center'>의결권</span>
          <span className='text-center'>상방</span>
        </div>
        {INSTRUMENTS.map((i) => (
          <button
            key={i.id}
            onClick={() => setSelected(i.id)}
            className={cn(
              COLS,
              'border-b px-4 py-2.5 text-left text-sm transition-colors last:border-b-0',
              selected === i.id ? 'bg-muted' : 'hover:bg-muted/50',
            )}
          >
            <span className='flex flex-col'>
              {i.label}
              <span className='text-muted-foreground text-xs'>{i.rank}</span>
            </span>
            <Mark state={i.principal} />
            <Mark state={i.vote} />
            <Mark state={i.upside} />
          </button>
        ))}
      </Card>

      <Card className='gap-2 p-4'>
        <span className='flex items-center gap-1.5 font-semibold'>
          <Layers className='size-4 text-violet-500' />
          {instrument.label}
        </span>
        <p className='text-muted-foreground text-sm/relaxed'>{instrument.detail}</p>
      </Card>

      <SectionIntro title='전환사채는 언제 주식이 되는가'>
        액면 {fmt(CB_FACE)}짜리 전환사채를 발행했다. 만기까지 들고 있으면 원금과 이자를 합쳐 {fmt(REDEEM)}을 받고,
        주식으로 바꾸면 전환가 {fmtWon(CONV_PRICE)} 기준으로 {CB_SHARES.toLocaleString('ko-KR')}주를 받는다. 회사가
        얼마나 커졌느냐에 따라 보유자의 선택이 갈린다.
      </SectionIntro>

      <Card className='p-4'>
        <ControlSlider
          icon={<TrendingUp className='size-4 text-emerald-500' />}
          label='만기 시점의 회사 가치'
          value={value}
          onChange={setValue}
          min={200}
          max={5000}
          step={50}
          format={fmt}
          hint={`기존 주식 ${BASE_SHARES.toLocaleString('ko-KR')}주에 전환사채 하나만 있는 회사다. 전환하면 지분의 ${(CONV_STAKE * 100).toFixed(2)}%를 가져간다.`}
        />
      </Card>

      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <Metric
          label='상환받으면'
          value={fmt(REDEEM)}
          tone={converts ? undefined : 'good'}
          sub={`원금 ${fmt(CB_FACE)} + 이자 ${fmt(CB_COUPON)}`}
        />
        <Metric
          label='전환하면'
          value={fmt(convValue)}
          tone={converts ? 'good' : undefined}
          sub={`지분 ${(CONV_STAKE * 100).toFixed(2)}%의 값`}
        />
        <Metric
          label='보유자의 선택'
          value={converts ? '주식 전환' : '만기 상환'}
          tone='accent'
          sub={`분기점 ${fmt(BREAKEVEN)}`}
        />
        <Metric
          label='기존 주주 주당가치'
          value={fmtWon(price)}
          tone={converts ? 'bad' : 'good'}
          sub={converts ? '희석 반영' : '전환되지 않아 희석 없음'}
        />
      </div>

      <Card className='gap-4 p-4'>
        <span className='text-muted-foreground text-xs'>
          회사 가치 {fmt(value)}이 보유자와 기존 주주에게 어떻게 갈리는가
        </span>
        <CostBar
          label='전환사채 보유자'
          value={holder}
          max={barMax}
          className='bg-violet-500'
          format={fmt}
          sub={converts ? '주식으로 바꿔 지분만큼 가져간다' : '약속된 원리금까지만 가져간다'}
        />
        <CostBar
          label='기존 주주'
          value={existing}
          max={barMax}
          className='bg-sky-500'
          format={fmt}
          sub={converts ? '늘어난 주식 수만큼 몫이 묽어졌다' : '원리금을 내주고 나머지를 전부 가져간다'}
        />
      </Card>

      <StatusBanner tone={converts ? 'accent' : 'good'} icon={<ArrowLeftRight className='size-4 shrink-0' />}>
        {converts
          ? `회사 가치가 분기점 ${fmt(BREAKEVEN)}을 넘어 전환이 유리해졌다. 기존 주주는 ${fmt(convValue - REDEEM)}만큼을 원리금 대신 지분으로 내주는 셈이다.`
          : `아직 전환할 이유가 없다. 보유자는 채권자로 남아 ${fmt(REDEEM)}을 받고, 기존 주주의 지분은 그대로 유지된다.`}
      </StatusBanner>

      <ExplainCard
        icon={<Repeat className='size-4 text-violet-500' />}
        title='왜 낮은 금리에 돈을 빌려주는가'
        preview='전환권은 덤이 아니라 값이 매겨진 상품이다. 회사는 그 값을 이자 대신 받는다.'
        body={
          <>
            <p>
              전환사채의 표면금리는 같은 신용도의 일반 회사채보다 낮고, 0%인 경우도 흔하다. 손해처럼 보이지만 보유자는
              이자를 깎아 주는 대가로 전환권을 받는다. 아래로는 원금이 지켜지고 위로는 주가 상승을 따라가는 구조라, 그
              비대칭 자체에 값이 있다. 회사 입장에서는 지금 당장 나가는 현금을 줄이는 대신 미래의 지분 일부를 미리 판
              것이다.
            </p>
            <p className='mt-2'>
              그래서 전환사채는 실적이 불확실한 회사에 잘 맞는다. 대출을 받기에는 갚을 능력을 증명하기 어렵고, 주식을
              찍기에는 지금 값이 너무 싸다고 느낄 때다. 잘되면 주식으로 바뀌어 상환 부담이 사라지고, 잘 안 되면 채권으로
              남아 원금만 돌려주면 된다.
            </p>
          </>
        }
      />

      <ExplainCard
        icon={<TrendingUp className='size-4 text-rose-500' />}
        title='전환가가 내려가면 이야기가 달라진다'
        preview='주가가 빠질 때 전환가를 함께 낮추는 조항이 붙으면 희석의 한도가 사라진다.'
        body={
          <>
            <p>
              위 계산은 전환가가 {fmtWon(CONV_PRICE)}으로 고정된 경우다. 실제 발행 조건에는 주가가 떨어지면 전환가도
              따라 내리는 조항이 붙는 일이 많다. 전환가가 절반이 되면 같은 액면으로 받아 가는 주식 수는 두 배가 된다.
              주가가 내려갈수록 기존 주주의 희석이 커지는 구조라, 악재가 희석을 부르고 희석이 다시 주가를 누르는 고리가
              생긴다.
            </p>
            <p className='mt-2'>
              보유자가 조기상환을 청구할 수 있는 권리, 회사가 미리 되사 갈 수 있는 권리도 흔히 함께 붙는다. 전환사채를
              볼 때 액면과 표면금리만으로는 아무것도 알 수 없고 전환가와 그 조정 조건을 봐야 하는 이유다. 여기 계산은
              그런 조항을 모두 걷어 내고 전환 여부의 분기점만 남긴 그림이다.
            </p>
          </>
        }
      />
    </div>
  );
}

function Mark({ state }: { state: 'yes' | 'no' | 'partial' }) {
  return (
    <span className='flex justify-center'>
      {state === 'yes' ? (
        <Check className='size-4 text-emerald-600 dark:text-emerald-400' />
      ) : state === 'no' ? (
        <X className='size-4 text-rose-600 dark:text-rose-400' />
      ) : (
        <Minus className='size-4 text-amber-600 dark:text-amber-400' />
      )}
    </span>
  );
}
