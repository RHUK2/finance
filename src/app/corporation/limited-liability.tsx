'use client';

import { useState } from 'react';

import { Banknote, ShieldCheck, ShieldOff, Users, Wallet } from 'lucide-react';

import {
  ControlSlider,
  CostBar,
  ExplainCard,
  Field,
  Metric,
  SectionIntro,
  SegmentedControl,
  StatusBanner,
} from '@/components/simulation';
import { Card } from '@/components/ui/card';

// 단위는 억원. 교육용 예시 수치.
const CAPITAL = 50; // 주주가 낸 출자금 총액
const PERSONAL = 30; // 대표 개인 재산

const fmt = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}억`;

const PIERCE_CASES = [
  '회사 통장과 개인 통장을 구분 없이 섞어 썼다',
  '사업 규모에 견줘 자본금이 터무니없이 적다',
  '주주총회·이사회 없이 사실상 한 사람이 전부 결정했다',
  '기존 빚을 피하려고 껍데기만 새로 세웠다',
];

export function LimitedLiability() {
  const [assets, setAssets] = useState(60);
  const [debts, setDebts] = useState(200);
  const [isCorp, setIsCorp] = useState(true);
  const [pierced, setPierced] = useState(false);

  const veilBroken = !isCorp || pierced;

  const shortfall = Math.max(0, debts - assets);
  const personalBurden = veilBroken ? Math.min(shortfall, PERSONAL) : 0;
  const creditorRecovered = Math.min(assets, debts) + personalBurden;
  const creditorLoss = shortfall - personalBurden;
  const shareholderRecovered = Math.max(0, assets - debts);
  const shareholderLoss = Math.max(0, CAPITAL - shareholderRecovered);

  const barMax = Math.max(debts, CAPITAL, PERSONAL, 1);

  const banner =
    personalBurden > 0
      ? {
          tone: 'bad' as const,
          icon: <ShieldOff className='size-4 shrink-0' />,
          text: `회사와 개인 사이의 벽이 뚫렸다. 회사 재산으로 못 갚은 ${fmt(shortfall)} 가운데 ${fmt(personalBurden)}이 대표 개인 재산에서 빠져나간다. 사업의 실패가 사람의 파산으로 이어지는 상태다.`,
        }
      : shortfall > 0
        ? {
            tone: 'accent' as const,
            icon: <ShieldCheck className='size-4 shrink-0' />,
            text: `손실이 회사에서 멈춘다. 채권자는 ${fmt(creditorLoss)}을 끝내 회수하지 못하지만, 주주와 대표의 개인 재산에는 손댈 수 없다. 주주가 잃는 것은 처음에 낸 출자금까지다.`,
          }
        : {
            tone: 'good' as const,
            icon: <ShieldCheck className='size-4 shrink-0' />,
            text: `부채를 모두 갚고도 ${fmt(shareholderRecovered)}이 남았다. 채권자를 먼저 만족시킨 뒤 남은 재산이 주주에게 분배된다. 주주는 언제나 맨 뒤에 선다.`,
          };

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='손실은 어디에서 멈추는가'>
        법인격의 실질적 효용은 대부분 여기서 나온다. 회사가 진 빚은 회사의 빚이므로, 회사 재산이 바닥나면 채권자의
        추심도 거기서 멈춘다. 주주가 잃는 최대치는 처음에 낸 돈이다. 이 벽이 있기에 서로 모르는 사람들이 한 사업에 돈을
        모을 수 있다. 다만 벽을 스스로 허무는 경우도 있다.
      </SectionIntro>

      <Card className='gap-5 p-4'>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <Field label='사업 형태'>
            <SegmentedControl
              options={[
                { value: true, label: '주식회사' },
                { value: false, label: '개인사업자' },
              ]}
              value={isCorp}
              onChange={setIsCorp}
            />
            <p className='text-muted-foreground text-xs'>
              개인사업자에게는 사업과 사람을 나누는 인격이 없다. 사업의 빚이 곧 내 빚이다.
            </p>
          </Field>
          <Field label='법인격 부인'>
            <SegmentedControl
              options={[
                { value: false, label: '벽이 지켜졌다' },
                { value: true, label: '벽이 무너졌다' },
              ]}
              value={isCorp ? pierced : true}
              onChange={(v) => isCorp && setPierced(v)}
            />
            <p className='text-muted-foreground text-xs'>
              {isCorp
                ? '회사와 개인을 구분 없이 운영했다면 법원이 법인격을 무시하고 개인에게 책임을 물을 수 있다.'
                : '개인사업자는 애초에 무너뜨릴 벽이 없다.'}
            </p>
          </Field>
        </div>

        <ControlSlider
          icon={<Banknote className='size-4 text-emerald-500' />}
          label='청산 시점의 회사 재산'
          value={assets}
          onChange={setAssets}
          min={0}
          max={300}
          step={5}
          format={fmt}
        />
        <ControlSlider
          icon={<Wallet className='size-4 text-rose-500' />}
          label='회사가 진 빚'
          value={debts}
          onChange={setDebts}
          min={0}
          max={300}
          step={5}
          format={fmt}
          hint={`주주 출자금 총액 ${fmt(CAPITAL)}, 대표 개인 재산 ${fmt(PERSONAL)}을 전제로 계산한다.`}
        />
      </Card>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <Metric label='채권자 미회수액' value={fmt(creditorLoss)} tone={creditorLoss > 0 ? 'bad' : 'good'} />
        <Metric label='주주 손실' value={fmt(shareholderLoss)} sub={`출자금 ${fmt(CAPITAL)}이 한도`} tone='accent' />
        <Metric
          label='대표 개인 재산 손실'
          value={fmt(personalBurden)}
          tone={personalBurden > 0 ? 'bad' : 'good'}
          sub={personalBurden > 0 ? '벽이 뚫렸다' : '회사 밖으로 번지지 않는다'}
        />
      </div>

      <Card className='gap-4 p-4'>
        <CostBar
          label='채권자가 돌려받는 돈'
          value={creditorRecovered}
          max={barMax}
          className='bg-emerald-500'
          format={fmt}
          sub={`청구액 ${fmt(debts)}`}
        />
        <CostBar
          label='채권자가 떼이는 돈'
          value={creditorLoss}
          max={barMax}
          className='bg-rose-500'
          format={fmt}
          sub='유한책임의 비용은 결국 채권자가 부담한다'
        />
        <CostBar
          label='주주가 잃는 돈'
          value={shareholderLoss}
          max={barMax}
          className='bg-amber-500'
          format={fmt}
          sub='아무리 커져도 출자금을 넘지 않는다'
        />
        <CostBar
          label='대표 개인 재산에서 나가는 돈'
          value={personalBurden}
          max={barMax}
          className='bg-fuchsia-500'
          format={fmt}
          sub={`보유 재산 ${fmt(PERSONAL)}`}
        />
      </Card>

      <StatusBanner tone={banner.tone} icon={banner.icon}>
        {banner.text}
      </StatusBanner>

      <Card className='gap-2 p-4'>
        <span className='flex items-center gap-1.5 font-semibold'>
          <ShieldOff className='size-4 text-rose-500' />
          벽이 무너지는 전형적인 경우
        </span>
        <ul className='text-muted-foreground flex list-disc flex-col gap-1 pl-5 text-sm/relaxed'>
          {PIERCE_CASES.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className='text-muted-foreground mt-1 text-xs/relaxed'>
          법인격을 인정하는 것이 오히려 정의에 반할 때, 법원은 그 사안에 한해 회사와 개인을 같은 것으로 본다. 회사를
          없애는 게 아니라 이번 건에서만 없는 셈 치는 것이다.
        </p>
      </Card>

      <ExplainCard
        icon={<Users className='size-4 text-sky-500' />}
        title='유한책임의 값은 누가 치르나'
        preview='주주가 지지 않는 손실은 사라지지 않는다. 채권자에게 옮겨 갈 뿐이다.'
        body={
          <>
            <p>
              회사가 갚지 못한 빚은 증발하지 않는다. 은행, 납품업체, 임차인, 퇴직금을 못 받은 직원이 나눠 진다.
              유한책임은 위험을 없애는 장치가 아니라 위험을 주주에게서 채권자 쪽으로 옮기는 장치다. 그래서 거래 상대는
              값을 매겨 대응한다. 은행은 금리를 올리거나 담보를 잡고, 신생 회사에는 대표 개인 연대보증을 요구한다. 계약
              한 줄로 법이 세운 벽을 다시 허무는 셈이다.
            </p>
            <p className='mt-2'>
              회사법이 배당과 자사주 매입을 배당가능이익 안으로 묶어 두는 이유도 같다. 주주는 언제나 채권자보다 뒤에
              서야 하는데, 청산 전에 회사 재산을 미리 빼 가면 그 순서가 뒤집히기 때문이다. 자본금 제도, 배당 제한,
              이사의 책임은 모두 벽 반대편에 선 사람들을 위한 안전장치다.
            </p>
          </>
        }
      />
    </div>
  );
}
