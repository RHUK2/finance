'use client';

import { Gauge } from 'lucide-react';

import { ControlSlider } from '@/components/simulation';
import { FEE_PRESETS } from '@/lib/tx-concept';

// 힌트는 FEE_PRESETS에서 파생한다. 프리셋 값이 바뀌어도 문구가 어긋나지 않는다.
const HINT = FEE_PRESETS.map((p) => `${p.label} ≈ ${p.rate}`).join(' · ') + ' sat/vB';

// 세 탭이 공유하는 수수료율 입력.
export function FeeRateControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <ControlSlider
      icon={<Gauge className='size-4 text-emerald-600 dark:text-emerald-400' />}
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
