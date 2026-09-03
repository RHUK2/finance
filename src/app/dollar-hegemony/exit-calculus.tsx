'use client';

import { Bitcoin, Gavel, Lock, LogOut, Network, Scale } from 'lucide-react';

import { useMemo, useState } from 'react';

import {
  ControlSlider,
  ExplainCard,
  type MarkState,
  MarkTable,
  Metric,
  SectionIntro,
  StackedBar,
  StatusBanner,
} from '@/components/simulation';
import { Card } from '@/components/ui/card';
import { ratioLabel } from '@/lib/bcra';

import { COST_FLOOR, EXIT_COUNTRIES, type Grade, exitLedger } from './models';

const MARK: Record<Grade, MarkState> = { high: 'yes', mid: 'partial', low: 'no' };

export function ExitCalculus() {
  const [network, setNetwork] = useState(35);
  const [sanction, setSanction] = useState(60);
  const [selected, setSelected] = useState(EXIT_COUNTRIES[0].id);

  const n = network / 100;
  const s = sanction / 100;

  const rows = useMemo(
    () =>
      EXIT_COUNTRIES.map((c) => ({
        id: c.id,
        label: c.label,
        sub: c.sub,
        marks: [MARK[c.tradeFreedom], MARK[c.securityIndependence], MARK[c.lowTreasuryExposure]],
      })),
    [],
  );

  const country = EXIT_COUNTRIES.find((c) => c.id === selected) ?? EXIT_COUNTRIES[0];
  const ledger = exitLedger(country, n, s);
  const leaving = EXIT_COUNTRIES.filter((c) => exitLedger(c, n, s).exits).length;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='이탈 이득이 이탈 비용을 넘는가'>
        어느 나라도 달러가 좋아서 쓰는 게 아니다. 나가는 값이 남는 값보다 비싸서 남는다. 그러니 무너지느냐를 묻는 대신
        이탈 이득 ÷ 이탈 비용을 재고 그 값이 1을 넘는지 보면 된다. 아래 두 조건은 개별 국가가 아니라 세계 전체에 걸리는
        조건이라 슬라이더로 두었고, 국가별 사정은 표에 등급으로 고정돼 있다. 표의 세 잣대는 무역 대금·안보·보유
        자산이고, 각 칸은 그 항목에서 달러에 매여 있지 않은지를 묻는다. 초록 체크가 자유롭다는 뜻이고 빨간 가위표가 묶여
        있다는 뜻이다. 등급과 가중치는 구조를 보여주기 위한 예시이지 어느 기관의 추정치가 아니다.
      </SectionIntro>

      <Card className='gap-4 p-4'>
        <ControlSlider
          icon={<Network className='size-4' />}
          label='대체망 성숙도'
          value={network}
          onChange={setNetwork}
          format={(v) => `${v}%`}
          hint='달러를 거치지 않고 무역 대금을 주고받을 수 있는 정도. 올리면 결제 마비 비용이 깎이고 결제 자율성의 값어치가 오른다.'
        />
        <ControlSlider
          icon={<Gavel className='size-4' />}
          label='미국의 제재 적극성'
          value={sanction}
          onChange={setSanction}
          format={(v) => `${v}%`}
          hint='결제망 배제와 자산 동결을 실제로 행사하는 정도. 이탈 비용과 이탈 이득을 동시에 밀어 올린다.'
        />
      </Card>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        <Metric
          label='이탈 유인 비율'
          value={ratioLabel(ledger.ratio)}
          tone={ledger.exits ? 'accent' : undefined}
          sub={`${country.label} · 1을 넘으면 이탈이 합리`}
        />
        <Metric label='이탈 이득 지수' value={ledger.benefit.toFixed(2)} sub='제재 면역 + 결제 자율성' />
        <Metric label='이탈 비용 지수' value={ledger.cost.toFixed(2)} sub='결제 마비 + 안보 상실 + 자산 동결' />
      </div>

      <StatusBanner
        icon={ledger.exits ? <LogOut className='size-4 shrink-0' /> : <Lock className='size-4 shrink-0' />}
        tone={ledger.exits ? 'accent' : undefined}
      >
        {ledger.exits
          ? `지금 조건에서 ${country.label}의 이탈은 합리다. 네 나라 중 ${leaving}곳이 기준선을 넘었다.`
          : `지금 조건에서 ${country.label}의 이탈은 비합리다. 나가는 값이 남는 값보다 비싸다. 네 나라 중 ${leaving}곳이 기준선을 넘었다.`}
      </StatusBanner>

      <Card className='gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <Scale className='text-muted-foreground size-4' />
          {country.label}의 이탈 비용은 무엇으로 이뤄져 있나
        </span>
        <StackedBar
          total={ledger.cost}
          segments={[
            { label: '결제 마비', value: ledger.paymentCost, className: 'bg-sky-500' },
            { label: '안보 상실', value: ledger.securityCost, className: 'bg-amber-500' },
            { label: '자산 동결', value: ledger.freezeCost, className: 'bg-rose-500' },
            { label: '기본 마찰', value: COST_FLOOR, className: 'bg-muted-foreground/40' },
          ]}
        />
      </Card>

      <MarkTable
        title='같은 잣대로 잰 네 나라'
        icon={<Scale className='text-muted-foreground size-4' />}
        headers={['국가', '무역', '안보', '자산']}
        rows={rows}
        selected={selected}
        onSelect={setSelected}
      />

      <Card className='gap-1.5 p-4'>
        <span className='text-sm font-semibold'>{country.label}</span>
        <p className='text-muted-foreground text-sm/relaxed'>{country.note}</p>
      </Card>

      <ExplainCard
        icon={<Bitcoin className='size-4' />}
        title='비트코인은 이 계산의 어디를 바꾸는가'
        preview='분모의 한 항목을 깎는다. 분자는 건드리지 못한다'
        body={
          <div className='flex flex-col gap-2'>
            <p>
              SWIFT는 중립적인 배관처럼 보이지만 실제로는 이탈 비용을 부과하는 장치다. 이란은 2012년과 2018년에,
              러시아는 2022년에 배제됐고 그 즉시 무역 대금을 주고받을 경로가 막혔다. 비트코인이 이 표에서 실제로 바꾸는
              것은 딱 그 항목이다. 퇴출을 명령할 중앙 주체가 없으므로 결제 마비 비용의 일부가 깎인다. 위 슬라이더의
              대체망 성숙도를 올릴 때 일어나는 일이 그것이고, 배제를 겪은 나라들이 대체 경로를 찾아 나선 것도 이 계산을
              한 결과다.
            </p>
            <p>깎지 못하는 쪽이 더 길다.</p>
            <p>
              안보 상실 비용은 그대로다. 사우디 왕정이 미군 주둔과 맞바꾼 것을 비트코인이 대신 줄 수 없다. 자산 동결
              비용도 그대로다. 이미 미국채로 들고 있는 수천억 달러가 다른 자산으로 바뀌지 않는다. 그리고 분자는 아예
              건드리지 못한다. 이탈 이득은 제재를 벗어나는 값과 결제 자율성인데, 비트코인이 있다고 해서 상대국이 원유
              대금을 비트코인으로 받아 줄 이유가 생기지는 않는다. 무역 결제는 상대가 받아야 성립하고, 받는 쪽은 대금이
              몇 주 뒤에도 같은 값이기를 원한다.
            </p>
            <p>
              정리하면 비트코인은 이탈 비용 세 항목 중 하나의 일부를 깎는다. 이 표에서 그 정도로도 판정이 뒤집히는
              나라가 있고(대체망 슬라이더를 올려 보면 중국이 먼저 넘는다) 꿈쩍도 않는 나라가 있다. 어느 쪽인지는 그
              나라가 나머지 두 항목에서 얼마나 묶여 있느냐로 갈린다.
            </p>
          </div>
        }
      />
    </div>
  );
}
