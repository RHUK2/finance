'use client';

import { CalendarCheck, GitBranch, ScrollText } from 'lucide-react';

import { ExplainCard, SectionIntro } from '@/components/simulation';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { AS_OF, FACTS, RETARGET_BLOCKS } from './models';

// 신호율·임계값·조정 주기는 models.ts의 FACTS와 프로토콜 상수가 단일 출처다.
// 화면 문구에 숫자를 다시 적으면 사실이 바뀔 때 한쪽만 고치게 된다.
const SIGNAL_PCT = `${(FACTS.signalingShare.value * 100).toFixed(2)}%`;
const THRESHOLD_PCT = `${Math.round(FACTS.lockInThreshold.value * 100)}%`;
const RETARGET_LABEL = RETARGET_BLOCKS.toLocaleString('ko-KR');

const TIMELINE = [
  {
    date: '2026.07',
    label: 'BIP-110(Reduced Data Temporary Softfork) 공개, 반대 진영 결집',
    tone: 'muted' as const,
  },
  {
    date: '2026.08.07',
    label: `${FACTS.signalingHeight.value.toLocaleString()}블록에서 mandatory signaling 개시, 신호율 ${SIGNAL_PCT} (임계값 ${THRESHOLD_PCT})`,
    tone: 'accent' as const,
  },
  {
    date: '2026.08.09',
    label: 'BIP-110 소수 체인이 2블록을 캔 뒤 정지',
    tone: 'bad' as const,
  },
  {
    date: '2026.08.21',
    label: `${FACTS.ecashHeight.value.toLocaleString()}블록에서 eCash 하드포크, 보유자에게 1:1 크레딧`,
    tone: 'accent' as const,
  },
];

export function August2026() {
  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title={`2026년 8월에 실제로 벌어진 일 (${AS_OF} 기준)`}>
        앞의 세 탭이 원리라면 이 탭은 사례다. 2026년 8월에 성격이 정반대인 두 분기가 2주 간격으로 일어났다. 하나는
        규칙을 좁히려다 갈라져 나와 멈춘 소프트포크 분기였고, 다른 하나는 규칙을 넓혀 갈라져 나온 하드포크 분기였다. 두
        사건 모두 리플레이가 열린 채로 진행됐다는 점이 같다. 아래 수치는 {AS_OF} 기준이며 이후 상황은 달라질 수 있다.
      </SectionIntro>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-medium'>
          <CalendarCheck className='size-4 text-amber-600 dark:text-amber-400' />두 분기의 타임라인
        </span>
        <div className='flex flex-col gap-2'>
          {TIMELINE.map((t) => (
            <div key={t.date} className='flex items-start gap-3 text-sm'>
              <span className='text-muted-foreground w-24 shrink-0 tabular-nums'>{t.date}</span>
              <span
                className={cn(
                  'mt-1.5 size-2 shrink-0 rounded-full',
                  t.tone === 'bad' && 'bg-rose-500',
                  t.tone === 'accent' && 'bg-amber-500',
                  t.tone === 'muted' && 'bg-muted-foreground/40',
                )}
              />
              <span>{t.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <ExplainCard
        icon={<GitBranch className='size-4 text-rose-500' />}
        title='BIP-110: 활성화에 실패하고도 체인은 갈렸다'
        preview={`${SIGNAL_PCT}의 신호로는 활성화도 못 하고, 갈라져 나온 체인도 못 굴린다`}
        body={
          <div className='flex flex-col gap-2'>
            <p>
              BIP-110은 임의 데이터를 1년간 한시적으로 제한하는 소프트포크였다. 새 출력 스크립트를 대부분 34바이트로
              묶고, OP_RETURN을 83바이트로, 특정 데이터 푸시와 witness 요소를 256바이트로 제한하며 일부 Taproot 기능을
              한시적으로 막는 내용이다. 활성화 전에 만들어진 UTXO는 적용 대상에서 빠졌다. 목표는 화폐 거래를 그대로
              두면서 블록 공간의 비금융 데이터 사용만 줄이는 것이었다.
            </p>
            <p>
              {FACTS.signalingHeight.value.toLocaleString()}블록에서 mandatory signaling 구간이 열렸을 때 직전{' '}
              {RETARGET_LABEL}블록 중 신호한 블록은 51개, {SIGNAL_PCT}였다. 조기 활성화 임계값 {THRESHOLD_PCT}에 한참 못
              미쳤다. 그런데도 규칙을 강제하도록 설정된 노드들은 신호하지 않는 블록을 거부했고, 그 결과 소수 체인이
              갈라져 나왔다. 이 체인은 두 블록을 캔 뒤 멈췄고 8월 9일 오후까지 세 번째 블록이 나오지 않았다. 첫 탭에서
              본 대로다. 2%대 해시레이트로는 난이도 조정에 필요한 {RETARGET_LABEL}블록에 도달할 방법이 없다.
            </p>
            <p>
              분기 코인은 값이 붙지 않았다. 안전하게 거래할 방법이 없었고, 주요 거래소 중 상장을 확약한 곳도 없었다. 이
              사건이 남긴 것은 새 자산이 아니라, 낮은 임계값과 강제 시그널링의 조합이 지지 없이도 체인을 가를 수 있다는
              사실이다.
            </p>
          </div>
        }
      />

      <ExplainCard
        icon={<ScrollText className='size-4 text-amber-500' />}
        title='eCash: 1:1 크레딧과 리플레이 보호 없이 열린 분기'
        preview='공짜로 받는 것처럼 보이는 쪽이 실제로는 더 위험했다'
        body={
          <div className='flex flex-col gap-2'>
            <p>
              eCash는 폴 스토르츠가 제안한 별개의 하드포크로, {FACTS.ecashHeight.value.toLocaleString()}블록에서
              갈라졌다. 비트코인의 과거 장부를 그대로 복사해 1 BTC마다 1 eCash를 주고, SHA-256 채굴을 유지하면서
              Drivechain 방식의 사이드체인을 얹는다. 사토시 것으로 추정되는 휴면 코인 약 50만 개를 분기 체인에서
              재배정하는 내용이 함께 들어 있어, 이를 선례로 삼는 것이 위험하다는 반발이 컸다.
            </p>
            <p>
              보유자에게 더 중요한 것은 다른 대목이다. 두 체인 사이에 완전한 리플레이 보호가 들어가지 않았다. 한쪽에서
              서명한 트랜잭션이 반대편에서도 유효할 수 있다는 뜻이고, 분기 코인을 청구하는 행위 자체가 위험하다는 경고가
              여기서 나왔다. 앞 탭에서 리플레이 보호가 보유자의 주의가 아니라 분기 설계자의 책임이라고 한 것이 이
              경우다. 하드포크였으므로 넣을 수 있었는데 넣지 않았다.
            </p>
            <p>
              두 사건을 나란히 놓으면 대비가 분명하다. BIP-110 분기는 리플레이 보호를 넣는 것이 원리적으로 불가능했고,
              eCash 분기는 가능했는데 하지 않았다. 보유자 입장에서 결과는 같다. 분기 전후로 송금하지 않는 것이 두 경우에
              모두 통하는 유일한 대응이었다.
            </p>
          </div>
        }
      />
    </div>
  );
}
