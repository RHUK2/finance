'use client';

import { Panel } from '@/components/panel';
import { CostBar, SectionIntro } from '@/components/simulation';
import { SCRIPT_ADDR_TYPES } from '@/lib/script-concept';

const maxSigBytes = Math.max(...SCRIPT_ADDR_TYPES.map((t) => t.sigBytes));

const ROWS: {
  label: string;
  cells: Record<(typeof SCRIPT_ADDR_TYPES)[number]['value'], string>;
}[] = [
  {
    label: '서명이 실리는 곳',
    cells: { legacy: 'scriptSig', native: 'witness', taproot: 'witness' },
  },
  {
    label: '실행되는 스크립트',
    cells: {
      legacy: 'DUP·HASH160·EQUALVERIFY·CHECKSIG (4단계)',
      native: 'DUP·HASH160·EQUALVERIFY·CHECKSIG (4단계, witness 프로그램에서 치환)',
      taproot: 'CHECKSIG 한 번 (스크립트 실행 자체가 없음)',
    },
  },
  {
    label: '출력에 담기는 값',
    cells: {
      legacy: '공개키의 해시 (20바이트)',
      native: '공개키의 해시 (20바이트)',
      taproot: '공개키 원본 x-only (32바이트)',
    },
  },
  {
    label: '지출 조건이 항상 체인에 드러나는가',
    cells: {
      legacy: '그렇다 (스크립트가 그대로 실행·기록됨)',
      native: '그렇다',
      taproot: '아니다 (스크립트 경로를 안 쓰면 조건 자체가 안 보임)',
    },
  },
];

export function AddressScriptCompare() {
  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='세 주소 타입, 검증은 결국 뭐가 다를까'>
        앞의 두 탭에서 서명을 만들고, 그 서명이 스택 위에서 검증되는 과정을 봤다. 세 주소 타입은 검증 로직의
        &#39;틀&#39;은 같지만 서명 알고리즘과 서명이 실리는 위치, 그리고 스크립트가 얼마나 노출되는지에서 갈린다.
      </SectionIntro>

      <Panel className='gap-3'>
        <span className='text-sm font-semibold'>서명 크기 비교 (sighash flag 등 포함 근사)</span>
        <div className='flex flex-col gap-3'>
          {SCRIPT_ADDR_TYPES.map((t) => (
            <CostBar
              key={t.value}
              label={`${t.label} · ${t.sigAlgo}`}
              value={t.sigBytes}
              max={maxSigBytes}
              format={(v) => `${v} B`}
              className={t.value === 'taproot' ? 'bg-primary' : 'bg-muted-foreground/40'}
            />
          ))}
        </div>
        <p className='text-xs/relaxed text-muted-foreground'>
          ECDSA는 r·s 두 값을 DER로 감싸고 sighash flag 1바이트가 붙어 71~72 바이트, Schnorr는 R‖s 64바이트 고정이라 DER
          포장이 없다. 트랜잭션 해부 페이지의 입력 vByte 차이(legacy 148 vs taproot 57.5)도 이 서명·검증 스크립트 크기
          차이에서 나온다.
        </p>
      </Panel>

      <div className='flex flex-col gap-3 md:hidden'>
        {SCRIPT_ADDR_TYPES.map((t) => (
          <Panel key={t.value} className='gap-3'>
            <span className='text-sm font-semibold'>{t.label}</span>
            <dl className='flex flex-col gap-2'>
              {ROWS.map((row) => (
                <div key={row.label} className='flex flex-col gap-0.5'>
                  <dt className='text-xs text-muted-foreground'>{row.label}</dt>
                  <dd className='text-xs/relaxed'>{row.cells[t.value]}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        ))}
      </div>

      <Panel className='hidden overflow-x-auto md:block'>
        <table className='w-full min-w-[480px] border-collapse text-sm'>
          <thead>
            <tr className='border-b text-left'>
              <th className='w-40 pb-2 font-medium text-muted-foreground'>항목</th>
              {SCRIPT_ADDR_TYPES.map((t) => (
                <th key={t.value} className='pb-2 pl-3 font-medium text-muted-foreground'>
                  {t.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className='border-b last:border-0'>
                <td className='py-2 pr-2 align-top text-xs text-muted-foreground'>{row.label}</td>
                {SCRIPT_ADDR_TYPES.map((t) => (
                  <td key={t.value} className='py-2 pl-3 align-top text-xs/relaxed'>
                    {row.cells[t.value]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
