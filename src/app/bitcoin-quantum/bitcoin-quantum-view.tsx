'use client';

import { useMemo, useState } from 'react';

import { Atom, Lock, ShieldAlert, ShieldCheck, Unlock } from 'lucide-react';

import {
  Field,
  ControlSlider,
  ExplainCard,
  IllustrativeDisclaimer,
  Metric,
  SectionIntro,
  SegmentedControl,
  StatusBanner,
} from '@/components/simulation';
import { ExplainerPage } from '@/components/explainer-page';
import { Panel } from '@/components/panel';
import { formatPct } from '@/lib/utils';

// 논리 큐비트 확보율에 따른 위험 구간. secp256k1을 깨는 데 필요한 큐비트 규모는 연구마다 추정치가 달라
// 실제 값이 아닌 개념 시연용 임계값이다.
function riskOf(pct: number) {
  if (pct < 40) return { level: '안전', tone: 'good' as const, icon: ShieldCheck };
  if (pct < 75) return { level: '경고', tone: 'accent' as const, icon: ShieldAlert };
  return { level: '위험', tone: 'bad' as const, icon: ShieldAlert };
}

export function BitcoinQuantumView() {
  // 경고 구간에서 시작한다. 안전 구간에서 시작하면 슬라이더를 움직여야 비로소 무언가
  // 바뀌는데, 첫 화면이 이미 긴장 상태여야 좌우로 밀어 보게 된다.
  const [qubitProgress, setQubitProgress] = useState(55);
  // 노출 주소를 기본값으로 둔다. 미사용 주소에서는 큐비트 슬라이더가 결과를 바꾸지 못해
  // 주 컨트롤이 죽은 채로 페이지가 시작된다. 노출 상태에서 시작해 미사용으로 바꿔 보면
  // 해시가 왜 방어가 되는지가 대비로 드러난다.
  const [addressReused, setAddressReused] = useState(true);

  const sim = useMemo(() => {
    // 공개키가 아직 서명으로 노출된 적 없는 해시 주소(P2PKH·P2WPKH 미사용)는 현재 위협 모델에서 안전으로 취급.
    // P2PK·P2TR은 출력에 공개키를 그대로 담아 받는 순간 노출되므로 노출 쪽 선택지에 든다(CONTEXT.md 「공개키 노출」).
    const exposed = addressReused;
    const risk = exposed ? riskOf(qubitProgress) : { level: '안전', tone: 'good' as const, icon: ShieldCheck };
    return { exposed, risk };
  }, [qubitProgress, addressReused]);

  return (
    <ExplainerPage
      title='비트코인은 양자컴퓨터에 얼마나 취약한가'
      intro={
        <>
          비트코인 서명(ECDSA)은 타원곡선 이산로그 문제의 어려움에 의존한다. 충분히 강력한 양자컴퓨터는 쇼어
          알고리즘으로 공개키에서 개인키를 역산할 수 있다. 다만 모든 잔고가 똑같이 위험한 건 아니다. 아래에서 논리
          큐비트 확보율과 주소 유형에 따라 위험이 어떻게 달라지는지 확인해 보자.
        </>
      }
    >
      <IllustrativeDisclaimer>
        논리 큐비트 임계값·위험 구간은 실제 연구 결과가 아닌 개념 이해를 돕기 위한 가상의 눈금이다. secp256k1을 깨는 데
        필요한 오류정정 큐비트 규모는 알고리즘·하드웨어 발전에 따라 추정치가 계속 바뀐다.
      </IllustrativeDisclaimer>

      {/* 컨트롤 */}
      <Panel>
        <ControlSlider
          icon={<Atom className='size-4 text-series-2' />}
          label='양자컴퓨터 논리 큐비트 확보율'
          hint={
            addressReused
              ? 'secp256k1 해독에 필요한 규모 대비 진행률'
              : '공개키가 노출되지 않은 해시 주소에는 논리 큐비트가 아무리 늘어도 노릴 대상이 없다. 주소 유형을 바꾸면 이 슬라이더가 살아난다.'
          }
          value={qubitProgress}
          onChange={setQubitProgress}
          format={(v) => formatPct(v, 0)}
          disabled={!addressReused}
        />
        <Field label='주소 유형'>
          <SegmentedControl
            value={addressReused}
            onChange={setAddressReused}
            options={[
              { value: false, label: '미사용 해시 주소 (P2PKH·P2WPKH)' },
              { value: true, label: '공개키 노출 (지출·재사용, P2PK·P2TR)' },
            ]}
          />
        </Field>
      </Panel>

      {/* 상태 배너 */}
      <StatusBanner tone={sim.risk.tone} icon={<sim.risk.icon className='size-5 shrink-0' />}>
        <div>
          <p className='font-semibold'>이 잔고는 지금 &apos;{sim.risk.level}&apos; 상태다</p>
          <p className='mt-0.5 text-xs font-normal text-muted-foreground'>
            {sim.exposed
              ? '공개키가 이미 노출되어 있어, 논리 큐비트 확보율이 그대로 위험도에 반영된다.'
              : '아직 지출하지 않은 해시 주소라 공개키가 해시 뒤에 숨어 있어, 논리 큐비트가 아무리 늘어도 이 잔고를 직접 노릴 수 없다.'}
          </p>
        </div>
      </StatusBanner>

      {/* 지표 카드 */}
      <div className='grid grid-cols-2 gap-3'>
        <Metric
          label='공개키 상태'
          value={sim.exposed ? '노출됨' : '비노출'}
          tone={sim.exposed ? 'bad' : 'good'}
          sub={sim.exposed ? 'P2PK · P2TR · 해시 주소 재사용·지출' : 'P2PKH/P2WPKH 미사용'}
        />
        <Metric
          label='추정 노출 잔고 비중'
          value='약 25~33%'
          sub='P2PK·P2TR·P2MS·재사용 주소의 잔고 기준. 어느 타입까지 세느냐에 따라 연구마다 다르다'
        />
      </div>

      <SectionIntro title='무엇이 위험을 가르는가'>
        같은 비트코인이라도 공개키가 체인에 드러났는지가 위험을 가른다. 그 이유와 대응 방향을 차례로 본다.
      </SectionIntro>

      <ExplainCard
        icon={<Unlock className='size-4 text-series-2' />}
        title='왜 공개키 노출이 핵심인가'
        preview='해시 주소는 처음 코인을 보낼 때, P2PK·P2TR은 코인을 받는 순간 공개키가 드러난다.'
        body='언제 공개키가 드러나는지는 출력 타입이 정한다. 해시 주소(P2PKH·P2WPKH)는 공개키를 해시한 값만 담는다. 코인을 받기만 했다면 공개키는 아직 체인에 드러나지 않지만, 그 주소에서 단 한 번이라도 코인을 보내면 서명 검증을 위해 공개키 원본이 트랜잭션에 실려 공개된다. 이후 같은 주소를 다시 쓰면(재사용) 새로 받은 잔고도 이미 드러난 공개키 위에 놓인다. 반대로 초창기 P2PK와 Taproot(P2TR) 출력은 공개키를 그대로 담으므로(P2TR은 x-only 32바이트) 한 번도 쓰지 않았어도 받는 순간부터 공개키가 노출된 상태다.'
      />
      <ExplainCard
        icon={<Lock className='size-4 text-series-1' />}
        title='해시가 주는 시간적 여유'
        preview='한 번도 쓰지 않은 해시 주소는 공개키가 없어 양자컴퓨터도 당장은 공격할 대상이 없다.'
        body='아직 한 번도 지출하지 않은 해시 주소(P2PKH·P2WPKH)는 체인에 해시값만 있을 뿐 공개키가 없다. 양자컴퓨터가 공개키에서 개인키를 역산하는 방식이므로, 노출된 공개키가 없으면 직접 공격할 대상이 없는 셈이다. 이 여유는 해시 주소에만 있다. P2PK·P2TR 출력은 쓰지 않아도 공개키가 이미 체인에 있다. 해시 주소라도 지출하는 순간 공개키가 공개되므로, 그 트랜잭션이 블록에 확정되기까지의 짧은 시간(멤풀에 머무는 동안)만은 이론적으로 노려질 여지가 있다는 지적도 있다.'
      />
      <ExplainCard
        icon={<Atom className='size-4 text-series-2' />}
        title='대응 방안: 포스트 양자 서명으로의 이행'
        preview='NIST가 표준을 확정한 양자 내성 서명으로 갈아타는 소프트포크가 논의되고 있다.'
        body='근본적 대응은 ECDSA를 양자 내성(post-quantum) 서명 알고리즘으로 교체하는 것이다. NIST는 2024년 8월 격자 기반 ML-DSA(FIPS 204, 옛 CRYSTALS-Dilithium)와 해시 기반 SLH-DSA(FIPS 205, 옛 SPHINCS+)를 최종 표준으로 확정했다. 비트코인은 소프트포크로 새 서명 방식을 위한 출력 유형을 도입하고, 사용자들이 자산을 새 주소로 옮기며 자연스럽게 이행하는 경로가 유력하다. 다만 이들 서명은 ECDSA·슈노어(64~72바이트)보다 훨씬 커서(ML-DSA 약 2.4~4.6KB, SLH-DSA 약 7.9~50KB) 블록 공간과 수수료에 부담이 크다는 점이 실제 도입의 걸림돌이다. 그래서 위협이 임박하기 훨씬 전에 방식을 정하고 이행 창구를 열어야 한다는 게 대체적인 견해다.'
      />
    </ExplainerPage>
  );
}
