'use client';

import { useMemo, useState } from 'react';

import { KeyRound, Plus, Repeat2 } from 'lucide-react';

import { cn } from '@/lib/utils';

import { ControlSlider, ExplainCard, Metric, SectionIntro, StatusBanner } from '@/components/simulation';
import { Panel } from '@/components/panel';

import { CurveGrid, type GridMark } from './curve-grid';
import { MULTIPLES_OF_G, N, P, addPt, doubleAndAddSteps, fmtPt, lineCells, mod, samePt, slope } from './models';

export function PointAdd({ d, onChangeD }: { d: number; onChangeD: (v: number) => void }) {
  const [i, setI] = useState(3);
  const [j, setJ] = useState(5);

  const p1 = MULTIPLES_OF_G[i];
  const p2 = MULTIPLES_OF_G[j];
  const sum = useMemo(() => addPt(p1, p2), [p1, p2]);
  const lam = slope(p1, p2);
  const cells = useMemo(() => lineCells(p1, p2), [p1, p2]);
  // 세 번째 교점은 합의 x축 대칭점이다. 그림에서 뒤집기 한 단계를 보이려면 둘 다 찍어야 한다.
  const third = sum === null ? null : { x: sum.x, y: mod(-sum.y, P) };

  const marks: GridMark[] = [];
  if (p1) marks.push({ ...p1, label: `P = ${i}G`, color: 'series-1' });
  if (p2 && !samePt(p1, p2)) marks.push({ ...p2, label: `Q = ${j}G`, color: 'series-2' });
  if (third) marks.push({ ...third, label: '세 번째 교점', color: 'warn' });
  if (sum) marks.push({ ...sum, label: 'P + Q', color: 'good' });

  const dPoint = MULTIPLES_OF_G[d];
  const steps = useMemo(() => doubleAndAddSteps(d), [d]);

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='같은 정의를 격자 위에서 실행한다'>
        실수에서 쓰던 식을 그대로 mod {P}로 옮긴다. 달라지는 건 직선의 생김새다. 유한체에서 직선은 격자를 감으며 {P}개
        칸을 지나고, 그중 정확히 셋이 곡선 위의 점이다. 두 점을 고르면 그 감긴 직선을 흐린 점으로 찍어 준다. 직선이 P와
        Q를 지나 세 번째 곡선 점에 닿는지 눈으로 확인해 보자.
      </SectionIntro>

      <Panel>
        <ControlSlider
          label='P 고르기'
          hint='곡선 점 30개는 모두 G의 배수다. 몇 배 점인지로 고른다.'
          value={i}
          onChange={setI}
          min={1}
          max={N - 1}
          step={1}
          format={(v) => `${v}G = ${fmtPt(MULTIPLES_OF_G[v])}`}
        />
        <ControlSlider
          label='Q 고르기'
          hint={`P와 같은 점을 고르면 직선 대신 접선을 쓴다. 그게 점 두 배다. i + j = ${N}이면 두 점이 x축 대칭이라 합이 무한원점이 된다.`}
          value={j}
          onChange={setJ}
          min={1}
          max={N - 1}
          step={1}
          format={(v) => `${v}G = ${fmtPt(MULTIPLES_OF_G[v])}`}
        />
      </Panel>

      <Panel className='gap-3'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <Plus className='size-4 text-good' />
          {i}G + {j}G = {mod(i + j, N) === 0 ? 'O' : `${mod(i + j, N)}G`}
        </span>
        <CurveGrid
          cells={cells}
          marks={marks}
          caption={
            lam === null
              ? `P와 Q의 x가 같고 y가 서로 뒤집힌 값이라 직선이 수직이다. 수직선은 곡선과 세 번째로 만나지 않으므로 합이 무한원점 O가 된다. 격자에는 O를 찍을 자리가 없다.`
              : `주황 고리 ${P}개가 직선이 지나는 칸이다. 오른쪽 끝에 닿으면 왼쪽에서 다시 나온다. 그중 색점이 놓인 셋만 곡선 위의 점이고, 그게 P와 Q, 그리고 세 번째 교점이다.`
          }
        />
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <Metric
            label='기울기 λ'
            value={lam === null ? '없음 (수직)' : `${lam}`}
            sub={samePt(p1, p2) ? '접선이므로 3x² ÷ 2y' : '(y_Q − y_P) ÷ (x_Q − x_P)'}
          />
          <Metric label='세 번째 교점' value={third ? fmtPt(third) : '없음'} sub='곡선과 만나는 나머지 한 점' />
          <Metric
            label='P + Q'
            value={fmtPt(sum)}
            tone={sum === null ? 'accent' : 'good'}
            sub='세 번째 교점을 x축에 대해 뒤집은 것'
          />
        </div>
        {lam !== null && sum && (
          <p className='text-xs/relaxed text-muted-foreground'>
            x = λ² − x_P − x_Q = {lam}² − {p1!.x} − {p2!.x} = {lam * lam - p1!.x - p2!.x} ≡ {sum.x} (mod {P}), y = λ(x_P
            − x) − y_P = {lam}({p1!.x} − {sum.x}) − {p1!.y} ≡ {mod(-sum.y, P)} (mod {P}). 마지막에 이 y를 뒤집어 {sum.y}
            를 얻는다.
          </p>
        )}
      </Panel>

      <SectionIntro title='같은 점을 반복해서 더하면 스칼라 곱이다'>
        점 덧셈이 있으면 곱셈은 공짜로 따라온다. G를 d번 더한 것을 dG라 쓴다. 그런데 30번 더할 필요가 없다. G를 두 배
        하고, 그걸 또 두 배 하는 식으로 가면 몇 단계 안에 닿는다. 실제 곡선에서 개인키가 78자리 수여도 계산이 순식간에
        끝나는 이유가 이것이다.
      </SectionIntro>

      <Panel>
        <ControlSlider
          label='개인키 d'
          hint={`1부터 ${N - 1}까지 고를 수 있다. 이 범위가 곧 위수 n = ${N}이 정하는 열쇠 공간이다.`}
          value={d}
          onChange={onChangeD}
          min={1}
          max={N - 1}
          step={1}
          format={(v) => `${v}`}
        />
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          <Metric label='공개키 Q = dG' value={fmtPt(dPoint)} tone='good' />
          <Metric label='d를 2진수로' value={mod(d, N).toString(2)} sub='이 자릿수만큼만 계산한다' />
          <Metric label='덧셈 횟수' value={`${steps.length}번`} sub={`${d}번 더하는 대신`} />
        </div>
      </Panel>

      <Panel className='gap-3'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <Repeat2 className='size-4 text-series-1' />두 배와 덧셈으로 {d}G에 닿는 길
        </span>
        <div className='flex flex-col gap-1'>
          {steps.map((s, idx) => (
            <div key={idx} className='flex items-center justify-between rounded-md border px-3 py-1.5 text-sm'>
              <span className='text-xs text-muted-foreground'>{s.note}</span>
              <span className='tabular-nums'>{fmtPt(s.acc)}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className='gap-3'>
        <span className='text-sm font-semibold'>kG 전부 ({N - 1}개)</span>
        <div className='grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-3 lg:grid-cols-5'>
          {Array.from({ length: N - 1 }, (_, idx) => idx + 1).map((k) => (
            <div
              key={k}
              className={cn(
                'flex items-center justify-between rounded-md border px-2 py-1 tabular-nums',
                k === d && 'border-good-surface/50 bg-good-surface/10',
              )}
            >
              <span className='text-muted-foreground'>{k}G</span>
              <span>{fmtPt(MULTIPLES_OF_G[k])}</span>
            </div>
          ))}
        </div>
        <p className='text-xs/relaxed text-muted-foreground'>
          {N - 1}개 점이 빠짐없이 한 번씩 나온다. 위수 {N}이 소수라 G의 배수가 곡선 전체를 훑기 때문이다. 그리고 {N}G는
          다시 무한원점이라 여기서 한 바퀴가 닫힌다.
        </p>
      </Panel>

      <StatusBanner icon={<KeyRound className='size-4' />} tone='good'>
        키 생성은 이게 전부다. d를 하나 고르고 Q = dG를 공개한다.
      </StatusBanner>

      <ExplainCard
        icon={<KeyRound className='size-4 text-warn' />}
        title='그럼 Q에서 d를 되찾을 수 있나'
        preview='이 표를 보면 30번 훑어서 찾을 수 있다. 그게 이 곡선이 안전하지 않은 이유다.'
        body={
          <>
            <p>
              위의 표가 답을 이미 말하고 있다. Q가 주어지면 1G부터 {N - 1}G까지 훑어서 같은 점을 찾으면 d가 나온다.
              후보가 {N - 1}개뿐이라 순식간이다. Q = dG에서 d를 되찾는 이 문제를 이산로그라 부른다.
            </p>
            <p className='mt-2'>
              곱하는 방향은 두 배와 덧셈 몇 번이면 끝나는데 되돌리는 방향은 지금까지 알려진 방법이 전부 훑어보기에
              가깝다. 이 비대칭 하나가 공개키 암호 전체를 떠받친다. 실제 secp256k1에서 훑어야 할 후보는 약 1.158 ×
              10⁷⁷개다.
            </p>
          </>
        }
      />
    </div>
  );
}
