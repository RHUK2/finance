'use client';

import { Gauge } from 'lucide-react';

import { ControlSlider } from '@/components/simulation';
import { FEE_PRESETS } from '@/lib/tx-concept';

// 힌트는 FEE_PRESETS에서 파생한다. 프리셋 값이 바뀌어도 문구가 어긋나지 않는다.
// 프리셋은 혼잡도에 따른 차이를 보이려는 예시값이라 지금 시장과 다르다. 시장 값은 mempool.space
// `/api/v1/fees/precise`(2026-10-02 조회: economy 0.2 · fastest 1.5 sat/vB)로 확인했다.
const HINT =
  FEE_PRESETS.map((p) => `${p.label} ≈ ${p.rate}`).join(' · ') +
  ' sat/vB. 혼잡도에 따른 차이를 보이는 예시값이고, 2026년 10월 실제 시장은 약 0.2~1.5 sat/vB로 훨씬 낮다.';

// 세 탭이 공유하는 수수료율 입력.
export function FeeRateControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <ControlSlider
      icon={<Gauge className='size-4 text-series-2' />}
      label='수수료율 (멤풀 혼잡도)'
      hint={HINT}
      value={value}
      onChange={onChange}
      min={1}
      max={120}
      step={1}
      format={(v) => `${v} sat/vB`}
    />
  );
}
