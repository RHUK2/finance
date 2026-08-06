'use client';

import { useState } from 'react';

import { FileSignature, Gavel, Landmark, ShieldCheck, ShieldOff, Stamp } from 'lucide-react';

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

const fmtEok = (n: number) => `${n.toFixed(1)}억`;

export function DepositPriority() {
  const [deposit, setDeposit] = useState(4);
  const [mortgage, setMortgage] = useState(2);
  const [salePrice, setSalePrice] = useState(5);
  const [senior, setSenior] = useState(true); // 근저당보다 먼저 대항요건을 갖췄는가
  const [moveIn, setMoveIn] = useState(true); // 전입신고 + 점유 = 대항력
  const [fixedDate, setFixedDate] = useState(true); // 확정일자 = 배당 참여 자격

  // 대항력과 우선변제권은 모두 전입신고와 점유를 전제로 한다.
  const hasOpposing = moveIn && senior;
  const canClaim = moveIn && fixedDate;
  const tenantFirst = canClaim && senior;

  // 낙찰가를 순위대로 나눈다.
  let remaining = salePrice;
  const tenantPaidFirst = tenantFirst ? Math.min(deposit, remaining) : 0;
  remaining -= tenantPaidFirst;
  const bankPaid = Math.min(mortgage, remaining);
  remaining -= bankPaid;
  const tenantPaidLater = !tenantFirst && canClaim ? Math.min(deposit, remaining) : 0;

  const distributed = tenantPaidFirst + tenantPaidLater;
  // 대항력이 있으면 못 받은 잔액을 낙찰자가 떠안는다.
  const assumed = hasOpposing ? Math.max(0, deposit - distributed) : 0;
  const recovered = distributed + assumed;
  const lost = Math.max(0, deposit - recovered);
  const barMax = Math.max(deposit, salePrice, 1);

  const banner =
    lost > 0
      ? {
          tone: 'bad' as const,
          icon: <ShieldOff className='size-4 shrink-0' />,
          text: !moveIn
            ? `전입신고와 점유가 없으면 대항력도 우선변제권도 생기지 않는다. 임차인은 경매 절차 밖의 일반 채권자가 되어 ${fmtEok(lost)}을 떼인다.`
            : canClaim
              ? `근저당이 먼저 잡힌 집이라 은행이 ${fmtEok(bankPaid)}을 먼저 가져간다. 남은 돈에서 배당받고도 ${fmtEok(lost)}이 비지만, 후순위라 낙찰자에게 청구할 수도 없다.`
              : `확정일자가 없어 배당에 아예 끼지 못한다. 근저당보다 뒤라 낙찰자에게 버틸 수도 없어 ${fmtEok(lost)}을 그대로 떼인다.`,
        }
      : {
          tone: 'good' as const,
          icon: <ShieldCheck className='size-4 shrink-0' />,
          text:
            assumed > 0
              ? `배당으로 ${fmtEok(distributed)}을 받고, 모자란 ${fmtEok(assumed)}은 낙찰자가 떠안는다. 그 돈을 다 받을 때까지 집을 비워 주지 않아도 된다. 선순위 대항력의 힘이다.`
              : `낙찰가에서 순위대로 나눠 보증금 ${fmtEok(deposit)}을 전액 배당받았다.`,
        };

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='집이 경매로 넘어가면 누가 먼저 받는가'>
        보증금을 지키는 것은 계약서가 아니라 순위다. 전입신고와 점유로 대항력이 생기고, 확정일자로 배당에 참여할 자격이
        생긴다. 둘 다 근저당보다 하루라도 빨라야 앞선다. 집이 경매로 넘어간 상황에서 이 조건들을 하나씩 켜고 꺼 보자.
      </SectionIntro>

      <Card className='gap-5 p-4'>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
          <Field label='전입신고 + 점유'>
            <SegmentedControl
              options={[
                { value: true, label: '했다' },
                { value: false, label: '안 했다' },
              ]}
              value={moveIn}
              onChange={setMoveIn}
            />
            <p className='text-muted-foreground text-xs'>대항력의 조건. 다음 날 0시부터 효력이 생긴다.</p>
          </Field>
          <Field label='확정일자'>
            <SegmentedControl
              options={[
                { value: true, label: '받았다' },
                { value: false, label: '안 받았다' },
              ]}
              value={fixedDate}
              onChange={setFixedDate}
            />
            <p className='text-muted-foreground text-xs'>배당에 참여할 자격. 없으면 낙찰금 분배에 끼지 못한다.</p>
          </Field>
          <Field label='근저당과의 선후'>
            <SegmentedControl
              options={[
                { value: true, label: '내가 먼저' },
                { value: false, label: '근저당이 먼저' },
              ]}
              value={senior}
              onChange={setSenior}
            />
            <p className='text-muted-foreground text-xs'>같은 날이라도 하루 차이로 순위가 갈린다.</p>
          </Field>
        </div>

        <ControlSlider
          icon={<FileSignature className='size-4 text-sky-500' />}
          label='내 보증금'
          value={deposit}
          onChange={setDeposit}
          min={0.5}
          max={10}
          step={0.5}
          format={fmtEok}
        />
        <ControlSlider
          icon={<Landmark className='size-4 text-rose-500' />}
          label='선순위 근저당 채권액'
          value={mortgage}
          onChange={setMortgage}
          min={0}
          max={10}
          step={0.5}
          format={fmtEok}
          hint='등기부등본 을구에서 확인한다. 실제 대출 잔액이 아니라 채권최고액이 적혀 있다.'
        />
        <ControlSlider
          icon={<Gavel className='size-4 text-amber-500' />}
          label='경매 낙찰가'
          value={salePrice}
          onChange={setSalePrice}
          min={0.5}
          max={15}
          step={0.5}
          format={fmtEok}
          hint='경매는 시세보다 낮게 낙찰되는 경우가 많다. 나눌 수 있는 돈은 시세가 아니라 이 금액이다.'
        />
      </Card>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <Metric label='배당으로 받는 돈' value={fmtEok(distributed)} tone={distributed > 0 ? 'good' : 'bad'} />
        <Metric
          label='낙찰자가 떠안는 돈'
          value={fmtEok(assumed)}
          sub={hasOpposing ? '선순위 대항력' : '대항력 없음'}
          tone={assumed > 0 ? 'accent' : undefined}
        />
        <Metric label='총 회수액' value={fmtEok(recovered)} sub={`보증금 ${fmtEok(deposit)}`} />
        <Metric label='못 받는 돈' value={fmtEok(lost)} tone={lost > 0 ? 'bad' : 'good'} />
      </div>

      <Card className='gap-4 p-4'>
        <span className='text-muted-foreground text-xs'>
          낙찰가 {fmtEok(salePrice)}이 {tenantFirst ? '임차인 → 은행' : '은행 → 임차인'} 순서로 배분된다
        </span>
        <CostBar
          label='임차인 배당'
          value={distributed}
          max={barMax}
          className='bg-emerald-500'
          format={fmtEok}
          sub={canClaim ? (tenantFirst ? '1순위' : '근저당 다음 순위') : '확정일자가 없어 배당에 못 낀다'}
        />
        <CostBar
          label='근저당권자 배당'
          value={bankPaid}
          max={barMax}
          className='bg-rose-500'
          format={fmtEok}
          sub={`채권액 ${fmtEok(mortgage)}`}
        />
        <CostBar
          label='낙찰자 인수'
          value={assumed}
          max={barMax}
          className='bg-amber-500'
          format={fmtEok}
          sub={hasOpposing ? '낙찰자가 대신 갚아야 하는 금액' : '대항력이 없으면 인수되지 않는다'}
        />
        <CostBar
          label='끝내 못 받는 돈'
          value={lost}
          max={barMax}
          className='bg-fuchsia-500'
          format={fmtEok}
          sub='집주인에게 남은 재산이 없다면 회수가 어렵다'
        />
      </Card>

      <StatusBanner tone={banner.tone} icon={banner.icon}>
        {banner.text}
      </StatusBanner>

      <ExplainCard
        icon={<Stamp className='size-4 text-sky-500' />}
        title='대항력과 우선변제권은 하는 일이 다르다'
        preview='하나는 나가지 않을 권리, 다른 하나는 돈을 먼저 받을 권리다.'
        body={
          <>
            <p>
              대항력은 집이 남에게 넘어가도 계약을 그대로 주장할 수 있는 힘이다. 전입신고와 실제 거주, 두 가지로 생기고
              효력은 신고 다음 날 0시부터다. 이 하루의 공백이 문제를 만든다. 잔금을 치른 날 집주인이 곧바로 대출을
              받으면 근저당이 같은 날 등기되면서 임차인보다 앞서게 된다. 그래서 계약서에 잔금일 다음 날까지 근저당을
              설정하지 않는다는 특약을 넣는다.
            </p>
            <p className='mt-2'>
              우선변제권은 경매 낙찰금을 나눌 때 순서를 받는 권리로, 확정일자가 있어야 생긴다. 확정일자만 있고
              전입신고가 없으면 순위 자체가 성립하지 않고, 전입신고만 있고 확정일자가 없으면 배당에는 끼지 못한 채
              낙찰자에게 버티는 것만 가능하다. 둘을 함께, 되도록 잔금일 당일에 마쳐야 하는 이유다.
            </p>
            <p className='mt-2'>
              순위를 따져도 회수가 불확실하다면 보증금 반환보증에 가입하는 방법이 있다. 보증기관이 먼저 돌려주고
              집주인에게 구상하는 구조라 임차인은 경매 순위와 무관하게 보증금을 받는다. 여기 계산은 순위가 어떻게
              작동하는지 보기 위한 단순화이고, 소액임차인 최우선변제나 당해세 같은 실제 배당의 선순위 항목은 넣지
              않았다.
            </p>
          </>
        }
      />
    </div>
  );
}
