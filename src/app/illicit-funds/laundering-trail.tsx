'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Blend, Flame, Shuffle, Wallet } from 'lucide-react';

import { Card } from '@/components/ui/card';
import {
  ControlSlider,
  ExplainCard,
  Field,
  IllustrativeDisclaimer,
  Metric,
  SectionIntro,
  SegmentedControl,
  StatCard,
  StatusBanner,
} from '@/components/simulation';
import { cn } from '@/lib/utils';

type Exit = 'kyc' | 'p2p' | 'hold';

// 개념 시연용 가정치. 실제 수사 성공률이 아니다.
const EXIT_PROFILE: Record<Exit, { label: string; identify: number; usable: string; note: string }> = {
  kyc: {
    label: 'KYC 거래소',
    identify: 0.95,
    usable: '전액',
    note: '법정화폐로 바꾸려면 신분증·계좌·IP·기기 정보를 제출해야 한다. 이 순간 가명 주소에 실명이 붙는다.',
  },
  p2p: {
    label: '장외 P2P',
    identify: 0.45,
    usable: '할인된 금액',
    note: '상대가 잠입 수사관이거나, 나중에 검거돼 진술하거나, 만남 장소의 CCTV·통신 기록이 남는다. 시세보다 싸게 넘겨야 한다.',
  },
  hold: {
    label: '그냥 보유',
    identify: 0.03,
    usable: '없음',
    note: '아무에게도 걸리지 않는다. 대신 그 돈은 쓸 수 없는 장부상 숫자로 남는다. 자금세탁의 목적 자체가 달성되지 않는다.',
  },
};

const EXITS = (Object.keys(EXIT_PROFILE) as Exit[]).map((value) => ({
  value,
  label: EXIT_PROFILE[value].label,
}));

const MIXER_FACTOR = 0.6; // 믹서를 거치면 신원 특정 확률이 낮아진다는 가정
const DAYS_PER_HOP = 3;
const MIXER_DAYS = 30;

export function LaunderingTrail() {
  const [hops, setHops] = useState(5);
  const [mixer, setMixer] = useState(false);
  const [exit, setExit] = useState<Exit>('kyc');

  const profile = EXIT_PROFILE[exit];
  const identify = profile.identify * (mixer ? MIXER_FACTOR : 1);
  const days = hops * DAYS_PER_HOP + (mixer ? MIXER_DAYS : 0);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='홉을 아무리 늘려도 사라지지 않는 것'>
        해킹으로 얻은 코인을 여러 주소로 잘게 쪼개 옮기는 것을 &#39;홉(hop)&#39;이라 부른다. 직관적으로는 홉을 늘릴수록
        안전해질 것 같지만, 온체인 그래프에서 홉은 그냥 <b>연결선이 하나 더 그려지는 것</b>일 뿐이다. 홉이 늘리는 건
        수사기관의 성공 확률이 아니라 소요 시간이다. 그리고 원장은 지워지지 않으므로, 시간은 수사기관 편이다.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <ControlSlider
          icon={<Shuffle className='size-4' />}
          label='홉 수'
          value={hops}
          onChange={setHops}
          min={1}
          max={12}
          format={(v) => `${v}회`}
          hint='자금을 거쳐가게 만든 중간 주소의 개수'
        />

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <Field label='믹서 경유'>
            <SegmentedControl
              options={[
                { value: false, label: '안 씀' },
                { value: true, label: '씀' },
              ]}
              value={mixer}
              onChange={setMixer}
            />
          </Field>
          <Field label='최종 출구 (돈을 쓰는 지점)'>
            <SegmentedControl options={EXITS} value={exit} onChange={setExit} />
          </Field>
        </div>

        <div>
          <span className='text-muted-foreground text-xs'>
            자금 경로. 빨간 표시는 체인분석 업체가 붙인 오염 라벨이다.
          </span>
          <div className='mt-2 flex items-center gap-1.5 overflow-x-auto pb-1'>
            <TrailNode icon={<Flame className='size-3.5' />} label='해킹 지갑' tone='origin' />
            {Array.from({ length: hops }, (_, i) => (
              <TrailStep key={i}>
                <TrailNode icon={<Wallet className='size-3.5' />} label={`홉 ${i + 1}`} tone='tainted' />
              </TrailStep>
            ))}
            {mixer && (
              <TrailStep>
                <TrailNode icon={<Blend className='size-3.5' />} label='믹서' tone='mixer' />
              </TrailStep>
            )}
            <TrailStep>
              <TrailNode icon={<ArrowRight className='size-3.5' />} label={profile.label} tone='exit' />
            </TrailStep>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-2 lg:grid-cols-4'>
          <Metric label='체인상 경로 보존' value='100%' tone='bad' sub='홉 수와 무관' />
          <StatCard
            label='신원 특정 가능성'
            value={identify * 100}
            format={(n) => `${Math.round(n)}%`}
            tone={identify > 0.5 ? 'bad' : 'accent'}
          />
          <StatCard
            label='추적 소요 시간'
            value={days}
            format={(n) => `${Math.round(n)}일`}
            sub='홉·믹서가 늘리는 건 이것뿐'
          />
          <Metric label='실제로 쓸 수 있는 돈' value={profile.usable} tone={exit === 'hold' ? 'bad' : undefined} />
        </div>

        <StatusBanner tone={exit === 'hold' ? 'accent' : 'bad'}>
          <span className='leading-relaxed font-normal'>{profile.note}</span>
        </StatusBanner>

        {mixer && (
          <StatusBanner>
            <span className='leading-relaxed font-normal'>
              자금을 맡기고 다른 코인으로 돌려받는 커스터디 믹서든, 참여자들이 하나의 트랜잭션을 함께 만드는{' '}
              <Link href='/privacy' className='underline underline-offset-2'>
                CoinJoin
              </Link>
              이든, &#39;어느 출력이 누구 것인지&#39;는 흐려도 <b>그런 경로를 거쳤다는 사실 자체는 숨기지 못한다.</b>{' '}
              입출력 구조가 특이해 체인에서 쉽게 식별되고 관련 주소는 공개적으로 태깅되기 때문이다. 거래소들은 이런
              경로에서 직접 들어온 입금을 차단하거나 동결하는 경우가 많다. 세탁하려던 돈에 오히려 더 눈에 띄는 표식이
              붙는 셈이다.
            </span>
          </StatusBanner>
        )}
      </Card>

      <IllustrativeDisclaimer>
        신원 특정 가능성·소요 시간 수치는 &#39;출구가 결정적이고 홉은 시간만 늘린다&#39;는 구조를 보여주기 위한
        가정치다. 실제 수사 성공률은 사건·관할·자금 규모에 따라 크게 다르며 공개된 통계로 존재하지 않는다.
      </IllustrativeDisclaimer>

      <ExplainCard
        title='왜 출구가 전부인가'
        preview='범죄 수익은 쓸 수 있어야 의미가 있고, 쓰려면 결국 법정화폐 세계로 나와야 한다.'
        body={
          <>
            자금세탁의 목표는 돈을 숨기는 게 아니라 <b>쓸 수 있게 만드는 것</b>이다. 집을 사고 차를 사고 변호사비를
            내려면 결국 은행 계좌로 들어가야 한다. 그리고 코인을 법정화폐로 바꾸는 지점은 대부분의 나라에서 규제
            대상이다. 한국의 특정금융정보법, 미국의 은행비밀법(BSA), FATF의 트래블 룰이 모두 이 출구에 집중돼 있다.
            온체인 홉을 100번 돌아도 마지막 한 번의 출금에서 신원이 붙으면, 수사기관은 그 지점에서 거꾸로 원장을 되짚어
            최초 범죄 자금까지 한 번에 연결한다. 체인이 영구 보존이라는 성질이 여기서 결정적으로 작동한다.
          </>
        }
      />

      <ExplainCard
        title='그래도 추적이 막히는 경우'
        preview='오프체인 이동, 프라이버시 코인, 비협조 관할은 여전히 사각지대다.'
        body={
          <>
            비트코인이 언제나 추적된다는 뜻은 아니다. 첫째, <b>거래소 내부 이체는 체인에 남지 않는다.</b> A 거래소
            계정에서 B 계정으로 옮기면 그건 그 회사의 내부 장부일 뿐이라, 회사가 협조하지 않으면 볼 수 없다. 둘째,
            모네로처럼 송금액·수신자를 프로토콜 차원에서 가리는 코인으로 갈아타면 온체인 추적이 사실상 끊긴다. 셋째,
            제재나 사법공조에 응하지 않는 관할에 소재한 거래소는 KYC 자료를 내주지 않는다. 실제 대형 사건들은 대개 이 세
            가지가 겹쳐 수사가 몇 년씩 늘어졌다. 다만 &#39;늘어졌다&#39;와 &#39;못 잡았다&#39;는 다르다. 원장이 남아
            있는 한 단서는 만료되지 않는다.
          </>
        }
      />
    </div>
  );
}

function TrailStep({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ArrowRight className='text-muted-foreground size-3.5 shrink-0' />
      {children}
    </>
  );
}

function TrailNode({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone: 'origin' | 'tainted' | 'mixer' | 'exit';
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-1 rounded-md border px-2 py-1.5 text-xs whitespace-nowrap',
        tone === 'origin' && 'border-rose-500/60 bg-rose-500/10 text-rose-600 dark:text-rose-400',
        tone === 'tainted' && 'border-rose-500/30 bg-rose-500/5',
        tone === 'mixer' && 'border-amber-500/40 bg-amber-500/5 text-amber-600 dark:text-amber-400',
        tone === 'exit' && 'bg-muted',
      )}
    >
      {icon}
      {label}
    </div>
  );
}
