'use client';

import { Dices, KeyRound, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExplainCard, Metric, SectionIntro } from '@/components/simulation';
import {
  ENTROPY_OPTIONS,
  entropyBreakdown,
  hexToBits,
  illustrativeSha256,
  type EntropyBits,
  type MnemonicWord,
} from '@/lib/bip-concept';

import { Pipeline } from '@/components/pipeline';
import { cn } from '@/lib/utils';

// 4비트 니블(2진수)과 그에 대응하는 hex 한 자리를 세로로 정렬해 "같은 값"임을 보여주는 그리드.
// 4비트가 안 되는 마지막 그룹(체크섬 5·6·7비트)은 hex 없이 비트만 표시한다.
function NibbleHexGrid({ bits, className }: { bits: string; className?: string }) {
  const groups = bits.match(/.{1,4}/g) ?? [];
  return (
    <span className={cn('flex flex-wrap gap-x-2 gap-y-2.5 font-mono text-xs', className)}>
      {groups.map((g, i) => (
        <span key={i} className='flex flex-col items-center gap-1'>
          <span className='text-muted-foreground tracking-widest'>{g}</span>
          {g.length === 4 ? (
            <span className='w-full rounded-sm bg-amber-500/15 text-center font-semibold text-amber-600 dark:text-amber-400'>
              {parseInt(g, 2).toString(16)}
            </span>
          ) : (
            <span className='text-muted-foreground/50 text-center'>·</span>
          )}
        </span>
      ))}
    </span>
  );
}

export function EntropyMnemonic({
  bits,
  entropyHex,
  words,
  onChangeBits,
  onRegen,
}: {
  bits: EntropyBits;
  entropyHex: string;
  words: MnemonicWord[];
  onChangeBits: (b: EntropyBits) => void;
  onRegen: () => void;
}) {
  const bd = entropyBreakdown(bits);
  const hash = illustrativeSha256(entropyHex);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='엔트로피를 단어로 (BIP-39)'>
        지갑의 출발점은 순수한 무작위 비트, 즉 엔트로피다. 이 비트열 뒤에 체크섬을 붙인 다음 11비트씩 잘라, 각
        조각(0~2047)을 2048개 단어장의 단어로 바꾼다. 강도를 바꿔 단어 수가 어떻게 달라지는지, 새 엔트로피를 뽑아 단어가
        어떻게 바뀌는지 확인해 보자.
      </SectionIntro>

      <Card className='flex flex-col gap-4 p-4'>
        <div className='flex flex-wrap items-end justify-between gap-3'>
          <div className='flex flex-col gap-1.5'>
            <span className='text-sm font-medium'>엔트로피 강도</span>
            <Select value={String(bits)} onValueChange={(v) => onChangeBits(Number(v) as EntropyBits)}>
              <SelectTrigger className='w-44'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTROPY_OPTIONS.map((b) => (
                  <SelectItem key={b} value={String(b)}>
                    {b} bit → {entropyBreakdown(b).words}단어
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant='outline' onClick={onRegen} className='gap-1.5'>
            <Dices className='size-4 text-sky-600 dark:text-sky-400' />
            새로 뽑기
          </Button>
        </div>

        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>
            엔트로피 · 2진수 {bd.entropy}비트(동전 {bd.entropy}번)와 hex {entropyHex.length}자리는 <b>같은 값</b>이다.
            4비트가 hex 한 자리에 대응한다
          </span>
          <NibbleHexGrid bits={hexToBits(entropyHex)} className='bg-muted rounded-md p-3' />
        </div>

        <div className='flex flex-col gap-1.5'>
          <span className='text-muted-foreground text-xs'>엔트로피 (hex)</span>
          <code className='bg-muted text-foreground rounded-md p-3 font-mono text-xs break-all'>{entropyHex}</code>
        </div>
      </Card>

      <ExplainCard
        icon={<Dices className='size-4 text-sky-600 dark:text-sky-400' />}
        title='가장 안전한 엔트로피는 오프라인에서 나온다 (동전·주사위)'
        preview='동전·주사위로 직접 만든 무작위성이 어떤 소프트웨어보다 믿을 만하다.'
        body={
          <>
            컴퓨터의 난수 생성기는 블랙박스다. 악성코드나 백도어가 예측 가능한 값을 심어도 겉으로는 완벽한 무작위처럼
            보이고, 실제로 난수 결함 때문에 지갑이 통째로 털린 사례도 있다. 반면 인터넷에 연결된 적 없는 곳에서{' '}
            <b>동전이나 주사위를 직접 던져</b> 뽑은 무작위성은 그 순간 그 자리에 있던 사람 외엔 아무도 알 수 없고, 어떤
            소프트웨어도 개입할 수 없다. 동전 한 번이 1비트(앞 1, 뒤 0)라 128비트 지갑은 동전 128번이면 되고, 주사위는
            한 번에 약 2.58비트라 256비트도 99번이면 충분하다(콜드카드 방식). 하드웨어 지갑들이 주사위 입력 모드를
            지원하는 이유가 바로 이것이다.
          </>
        }
      />

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
        <Metric label='엔트로피 (ENT)' value={`${bd.entropy} bit`} />
        <Metric label='체크섬 (CS)' value={`${bd.checksum} bit`} sub='ENT ÷ 32' tone='accent' />
        <Metric label='총 비트' value={`${bd.total} bit`} sub='ENT + CS' />
        <Metric label='단어 수' value={`${bd.words}개`} sub='총 ÷ 11' tone='good' />
      </div>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <ShieldCheck className='size-4 text-emerald-600 dark:text-emerald-400' />
          체크섬은 이렇게 만들어진다 (SHA-256)
        </span>
        <Pipeline
          items={[
            { kind: 'box', label: '엔트로피 (입력)', value: entropyHex },
            { kind: 'op', label: 'SHA-256 해시' },
            {
              kind: 'box',
              label: '해시 결과 (256비트)',
              value: hash,
            },
            { kind: 'op', label: `앞 ${bd.checksum}비트만 잘라냄 (ENT ÷ 32)` },
            {
              kind: 'box',
              label: `체크섬 (${bd.checksum}비트) → 마지막 단어 뒤에 붙음`,
              value: <NibbleHexGrid bits={hexToBits(hash).slice(0, bd.checksum)} />,
              tone: 'accent',
            },
          ]}
        />
        <p className='text-muted-foreground text-xs'>이 데모의 해시·체크섬은 흐름을 보여주기 위한 가짜 값이다.</p>
      </Card>

      <ExplainCard
        title='왜 하필 ENT ÷ 32일까?'
        preview='11비트씩 잘라 단어로 만들려면 체크섬 비트 수가 딱 맞아떨어져야 한다.'
        body={
          <>
            니모닉은 전체 비트를 <b>11비트씩</b> 잘라 단어로 만든다. 그러려면{' '}
            <code className='font-mono'>엔트로피 + 체크섬</code>이 11로 정확히 나눠떨어져야 한다. 엔트로피는 항상 32의
            배수(128·160·192·224·256)로 정하는데, 체크섬을 <code className='font-mono'>ENT ÷ 32</code>로 잡으면 총비트가{' '}
            <code className='font-mono'>ENT × 33/32</code>가 되어 언제나 11의 배수가 된다(예: 128 → 132 = 11×12단어, 256
            → 264 = 11×24단어). 즉 ÷32는 <b>남는 비트 없이 단어가 딱 떨어지게</b> 만드는 유일한 선택이고, 덤으로
            엔트로피가 길수록 체크섬도 비례해 길어져 오타 검출력이 좋아진다.
          </>
        }
      />

      <Card className='flex flex-col gap-3 p-4'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <KeyRound className='size-4 text-amber-600 dark:text-amber-400' />
          니모닉 단어
        </span>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4'>
          {words.map((w) => (
            <div
              key={w.position}
              className={cn(
                'flex flex-col gap-0.5 rounded-md border p-2',
                w.isChecksum && 'border-amber-500/50 bg-amber-500/5',
              )}
            >
              <span className='flex items-center justify-between'>
                <span className='text-muted-foreground font-mono text-[10px]'>#{w.position}</span>
                {w.isChecksum && (
                  <Badge variant='outline' className='h-4 px-1 text-[9px]'>
                    체크섬
                  </Badge>
                )}
              </span>
              <span className='font-mono text-sm font-medium'>{w.word}</span>
              <span className='text-muted-foreground font-mono text-[10px] tabular-nums'>
                {w.bits} = {w.index}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <ExplainCard
        title='체크섬은 왜 필요할까?'
        preview='단어를 잘못 적었을 때 복구 단계에서 걸러내기 위한 장치다. 다만 완벽한 그물은 아니다.'
        body={
          <>
            복구할 때 지갑은 입력한 단어들에서 엔트로피를 거꾸로 뽑아 <b>SHA-256을 다시 계산</b>하고, 끝에 붙은 체크섬과
            맞는지 검사한다. 단어를 잘못 적으면 해시가 어긋나 &#39;잘못된 니모닉&#39; 오류가 뜬다. 그래서 아무 단어
            12개나 적는다고 유효한 니모닉이 되지 않는다.
            <br />
            <br />
            다만 완벽한 그물은 아니다. 12단어의 체크섬은 <b>4비트뿐</b>이라, 잘못 적은 니모닉이 우연히 검사를 통과할
            확률이 16분의 1쯤 된다. 같은 이야기를 뒤집으면 아무 단어 12개나 적었을 때 유효한 니모닉이 될 확률도 딱
            그만큼이다. 단어 수가 늘면 체크섬도 함께 길어져 그물이 촘촘해진다(24단어는 8비트라 256분의 1). 체크섬은
            오타를 <b>대개</b> 잡아 주는 장치지, 반드시 잡아 준다고 믿을 물건은 아니다.
          </>
        }
      />
    </div>
  );
}
