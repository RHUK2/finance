'use client';

import { Card } from '@/components/ui/card';
import { CostBar, ExplainCard, SectionIntro } from '@/components/simulation';
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
        ①에서 서명을, ②에서 그 서명이 스택 위에서 검증되는 과정을 봤다. 세 주소 타입은 검증 로직의 &#39;틀&#39;은 같지만
        서명 알고리즘과 서명이 실리는 위치, 그리고 스크립트가 얼마나 노출되는지에서 갈린다.
      </SectionIntro>

      <Card className='flex flex-col gap-3 p-4'>
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
        <p className='text-muted-foreground text-xs/relaxed'>
          ECDSA는 r·s 두 값을 DER로 감싸고 sighash flag 1바이트가 붙어 71~72 바이트, Schnorr는 R‖s 64바이트 고정이라 DER
          포장이 없다. 트랜잭션 해부 페이지의 입력 vByte 차이(legacy 148 vs taproot 57.5)도 이 서명·검증 스크립트 크기
          차이에서 나온다.
        </p>
      </Card>

      <div className='flex flex-col gap-3 md:hidden'>
        {SCRIPT_ADDR_TYPES.map((t) => (
          <Card key={t.value} className='flex flex-col gap-3 p-4'>
            <span className='text-sm font-semibold'>{t.label}</span>
            <dl className='flex flex-col gap-2'>
              {ROWS.map((row) => (
                <div key={row.label} className='flex flex-col gap-0.5'>
                  <dt className='text-muted-foreground text-xs'>{row.label}</dt>
                  <dd className='text-xs/relaxed'>{row.cells[t.value]}</dd>
                </div>
              ))}
            </dl>
          </Card>
        ))}
      </div>

      <Card className='hidden overflow-x-auto p-4 md:block'>
        <table className='w-full min-w-[480px] border-collapse text-sm'>
          <thead>
            <tr className='border-b text-left'>
              <th className='text-muted-foreground w-40 pb-2 font-medium'>항목</th>
              {SCRIPT_ADDR_TYPES.map((t) => (
                <th key={t.value} className='text-muted-foreground pb-2 pl-3 font-medium'>
                  {t.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className='border-b last:border-0'>
                <td className='text-muted-foreground py-2 pr-2 align-top text-xs'>{row.label}</td>
                {SCRIPT_ADDR_TYPES.map((t) => (
                  <td key={t.value} className='py-2 pl-3 align-top text-xs/relaxed'>
                    {row.cells[t.value]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ExplainCard
        title="Taproot에는 '스크립트 경로'도 있다던데?"
        preview='키 경로가 안 될 때만 조건부 스크립트를 공개한다. MAST가 그걸 트리로 숨긴다.'
        body={
          <>
            이 페이지는 가장 흔한 <b>키 경로(key-path)</b> 지출만 다뤘다. Taproot 출력은 사실 &#39;정상 서명자 키&#39;
            하나와 &#39;그 밖의 여러 조건부 스크립트(다중서명, 시간잠금 등)&#39;를 동시에 담을 수 있다. 그 여러
            스크립트를 머클 트리로 묶은 게 <b>MAST</b>다.
            <br />
            <br />
            평소엔 정상 서명자가 키 경로로 지출해 ②에서 본 것처럼 서명 하나만 보여주면 끝난다. 조건부 스크립트는 트리
            뿌리(출력 공개키)에 녹아들어 있을 뿐 체인에 드러나지 않는다. 조건부 지출이 실제로 필요해질 때만 그 스크립트
            하나와 트리 경로를 함께 공개하는 <b>스크립트 경로</b>를 쓴다. 그래서 같은 지갑이라도 &#39;한 번도 안 쓴
            조건&#39;은 영원히 체인에 드러나지 않을 수 있다.
          </>
        }
      />

      <ExplainCard
        title='세 페이지를 한 줄로 잇는다면'
        preview='키를 만들고(①) → 그 키로 잠긴 동전을 옮기고(②) → 서명으로 그 잠금을 푼다(③).'
        body={
          <>
            지갑 키 생성에서 만든 개인키가, 트랜잭션 해부에서 본 UTXO의 scriptPubKey(잠금 조건)를 푸는 열쇠였다. 이
            페이지에서 본 서명과 스택 실행이 바로 그 자물쇠를 여는 과정이다. 주소 타입(44&apos;/84&apos;/86&apos;)이
            처음부터 이 검증 로직 전체를 결정한다.
          </>
        }
      />
    </div>
  );
}
