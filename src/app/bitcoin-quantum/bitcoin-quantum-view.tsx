'use client';

import { useMemo, useState } from 'react';

import { Atom, Lock, ShieldAlert, ShieldCheck, Unlock } from 'lucide-react';

import { AppHeader } from '@/components/app-header';
import { PageMain } from '@/components/page-main';
import {
  ControlSlider,
  ExplainCard,
  IllustrativeDisclaimer,
  Metric,
  SegmentedControl,
  StatusBanner,
} from '@/components/simulation';
import { Card } from '@/components/ui/card';

const fmt = (n: number) => `${Math.round(n)}%`;

// 논리 큐비트 확보율에 따른 위험 구간. secp256k1을 깨는 데 필요한 큐비트 규모는 연구마다 추정치가 달라
// 실제 값이 아닌 개념 시연용 임계값이다.
function riskOf(pct: number) {
  if (pct < 40) return { level: '안전', tone: 'good' as const, icon: ShieldCheck };
  if (pct < 75) return { level: '경고', tone: 'accent' as const, icon: ShieldAlert };
  return { level: '위험', tone: 'bad' as const, icon: ShieldAlert };
}

export function BitcoinQuantumView() {
  const [qubitProgress, setQubitProgress] = useState(20);
  const [addressReused, setAddressReused] = useState(false);

  const sim = useMemo(() => {
    // 공개키가 아직 서명으로 노출된 적 없는 주소(해시만 공개)는 현재 위협 모델에서 안전으로 취급.
    const exposed = addressReused;
    const risk = exposed ? riskOf(qubitProgress) : { level: '안전', tone: 'good' as const, icon: ShieldCheck };
    return { exposed, risk };
  }, [qubitProgress, addressReused]);

  return (
    <>
      <AppHeader breadcrumbs={[{ label: '비트코인 양자컴퓨터' }]} />
      <PageMain>
        <div className='mx-auto flex max-w-5xl flex-col gap-4'>
          <div>
            <h1 className='text-xl font-semibold'>비트코인은 양자컴퓨터에 얼마나 취약한가</h1>
            <p className='text-muted-foreground mt-1 text-sm/relaxed'>
              비트코인 서명(ECDSA)은 타원곡선 이산로그 문제의 어려움에 의존한다. 충분히 강력한 양자컴퓨터는 쇼어
              알고리즘으로 공개키에서 개인키를 역산할 수 있다. 다만 모든 잔고가 똑같이 위험한 건 아니다. 아래에서 큐비트
              발전 정도와 주소 유형에 따라 위험이 어떻게 달라지는지 확인해 보자.
            </p>
          </div>

          <IllustrativeDisclaimer>
            큐비트 임계값·위험 구간은 실제 연구 결과가 아닌 개념 이해를 돕기 위한 가상의 눈금이다. secp256k1을 깨는 데
            필요한 오류정정 큐비트 규모는 알고리즘·하드웨어 발전에 따라 추정치가 계속 바뀐다.
          </IllustrativeDisclaimer>

          {/* 컨트롤 */}
          <Card className='gap-4 p-4'>
            <ControlSlider
              icon={<Atom className='size-4 text-violet-500' />}
              label='양자컴퓨터 논리 큐비트 확보율'
              hint='secp256k1 해독에 필요한 규모 대비 진행률 (가상 시나리오)'
              value={qubitProgress}
              onChange={setQubitProgress}
              format={fmt}
            />
            <div className='flex flex-col gap-1.5'>
              <span className='text-sm font-medium'>주소 유형</span>
              <SegmentedControl
                value={addressReused}
                onChange={setAddressReused}
                options={[
                  { value: false, label: '미사용 주소 (공개키 비노출)' },
                  { value: true, label: '재사용·지출 주소 (공개키 노출)' },
                ]}
              />
            </div>
          </Card>

          {/* 상태 배너 */}
          <StatusBanner tone={sim.risk.tone} icon={<sim.risk.icon className='size-5 shrink-0' />}>
            <div>
              <p className='font-semibold'>이 잔고는 지금 &apos;{sim.risk.level}&apos; 상태다</p>
              <p className='text-muted-foreground mt-0.5 text-xs font-normal'>
                {sim.exposed
                  ? '공개키가 이미 노출되어 있어, 큐비트 발전 정도가 그대로 위험도에 반영된다.'
                  : '공개키가 해시 뒤에 숨어 있어, 큐비트가 아무리 발전해도 이 잔고를 직접 노릴 수 없다.'}
              </p>
            </div>
          </StatusBanner>

          {/* 지표 카드 */}
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
            <Metric
              label='공개키 상태'
              value={sim.exposed ? '노출됨' : '비노출'}
              tone={sim.exposed ? 'bad' : 'good'}
              sub={sim.exposed ? 'P2PK · 재사용 · 지출 완료' : 'P2PKH/P2WPKH 미사용'}
            />
            <Metric
              label='위험도'
              value={sim.risk.level}
              tone={sim.risk.tone}
              sub={`큐비트 확보율 ${fmt(qubitProgress)}`}
            />
            <Metric
              label='추정 노출 잔고 비중'
              value='약 20~30%'
              sub='재사용·P2PK·분실 초기 채굴분 등 (연구마다 추정 상이)'
            />
          </div>

          {/* 설명 프로즈 */}
          <ExplainCard
            icon={<Unlock className='size-4 text-rose-500' />}
            title='왜 공개키 노출이 핵심인가'
            preview='주소는 공개키의 해시다. 공개키 자체는 그 주소에서 처음 코인을 보낼 때 서명과 함께 드러난다.'
            body='비트코인 주소(P2PKH·P2WPKH)는 공개키를 해시한 값이다. 코인을 받기만 했다면 공개키는 아직 체인에 드러나지 않는다. 하지만 그 주소에서 단 한 번이라도 코인을 보내면, 서명 검증을 위해 공개키 원본이 트랜잭션에 실려 공개된다. 이후 같은 주소를 다시 쓰거나(재사용), 초창기 P2PK 방식으로 공개키를 그대로 담은 출력은 공개키가 영구히 노출된 상태로 남는다.'
          />
          <ExplainCard
            icon={<Lock className='size-4 text-emerald-500' />}
            title='해시가 주는 시간적 여유'
            preview='한 번도 쓰지 않은 주소는 공개키가 없어 양자컴퓨터도 당장은 공격할 대상이 없다.'
            body='아직 한 번도 지출하지 않은 주소는 체인에 해시값만 있을 뿐 공개키가 없다. 양자컴퓨터가 공개키에서 개인키를 역산하는 방식이므로, 노출된 공개키가 없으면 직접 공격할 대상이 없는 셈이다. 다만 지출하는 순간 공개키가 공개되고, 그 트랜잭션이 블록에 확정되기까지의 짧은 시간(멤풀에 머무는 동안) 동안만은 이론적으로 노려질 여지가 있다는 지적도 있다.'
          />
          <ExplainCard
            icon={<Atom className='size-4 text-violet-500' />}
            title='대응 방안: 포스트 양자 서명으로의 이행'
            preview='NIST가 표준을 확정한 양자 내성 서명으로 갈아타는 소프트포크가 논의되고 있다.'
            body='근본적 대응은 ECDSA를 양자 내성(post-quantum) 서명 알고리즘으로 교체하는 것이다. NIST는 2024년 8월 격자 기반 ML-DSA(FIPS 204, 옛 CRYSTALS-Dilithium)와 해시 기반 SLH-DSA(FIPS 205, 옛 SPHINCS+)를 최종 표준으로 확정했다. 비트코인은 소프트포크로 새 서명 방식을 위한 출력 유형을 도입하고, 사용자들이 자산을 새 주소로 옮기며 자연스럽게 이행하는 시나리오가 유력하다. 다만 이들 서명은 ECDSA·슈노어(64~72바이트)보다 훨씬 커서(ML-DSA 약 2.4~4.6KB, SLH-DSA 약 7.9KB) 블록 공간과 수수료에 부담이 크다는 점이 실제 도입의 걸림돌이다. 그래서 위협이 임박하기 훨씬 전에 방식을 정하고 이행 창구를 열어야 한다는 게 대체적인 견해다.'
          />
        </div>
      </PageMain>
    </>
  );
}
