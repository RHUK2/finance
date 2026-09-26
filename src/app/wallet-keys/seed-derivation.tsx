'use client';

import { Cog, Lock } from 'lucide-react';

import { Pipeline } from '@/components/pipeline';
import { ExplainCard, SectionIntro } from '@/components/simulation';
import { Panel } from '@/components/panel';
import { Input } from '@/components/ui/input';

export function SeedDerivation({
  mnemonic,
  passphrase,
  onPassphrase,
  seedHex,
}: {
  mnemonic: string;
  passphrase: string;
  onPassphrase: (v: string) => void;
  seedHex: string;
}) {
  const extraWordPosition = mnemonic.split(' ').length + 1;

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='단어를 시드로 (BIP-39)'>
        단어 목록 자체가 키는 아니다. 단어들을 선택적 passphrase와 함께 PBKDF2 함수에 2048번 통과시켜 하나의 512비트{' '}
        <b>시드</b>로 뭉친다. 이 시드가 모든 키의 뿌리다. passphrase에 글자 하나만 더해도 시드 전체가 완전히 달라지는 걸
        직접 확인해 보자.
      </SectionIntro>

      <ExplainCard
        title='쉽게 말하면: 믹서기에 2048번 갈기'
        preview='12개 단어를 PBKDF2 믹서기에 넣고 2048번 돌려 시드를 뽑는다.'
        body={
          <>
            12개 단어를 재료로 믹서기(PBKDF2)에 넣고 2048번 돌린다고 생각하면 된다. passphrase는 나만 아는 비밀 재료
            하나를 몰래 추가하는 것이다. 재료가 한 글자라도 다르면 완전히 다른 주스가 나오고, 완성된 주스에서 원래
            재료를 되돌릴 수도 없다. 이렇게 나온 주스 한 잔이 512비트 시드이고, 지갑의 모든 키는 이 원액에서 만들어진다.
          </>
        }
      />

      <Panel className='gap-1.5'>
        <span className='flex items-center gap-1.5 text-sm font-medium'>
          <Lock className='size-4 text-warn' />
          passphrase (선택, {extraWordPosition}번째 단어)
        </span>
        <Input
          value={passphrase}
          onChange={(e) => onPassphrase(e.target.value)}
          placeholder='비워 두어도 됨 · 한 글자 바꿔 보자'
        />
        <p className='text-xs text-muted-foreground'>
          passphrase는 단어를 적어둔 종이를 누가 훔쳐도 자금을 지키는 추가 비밀이다. 단, 잊으면 복구가 불가능하다.
        </p>
      </Panel>

      <Panel className='gap-3'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <Cog className='size-4 text-series-2' />
          시드는 이렇게 만들어진다 (PBKDF2)
        </span>
        <Pipeline
          items={[
            {
              kind: 'box',
              label: '비밀번호 = 니모닉 단어들 (앞 탭에서 생성됨)',
              value: mnemonic,
            },
            {
              kind: 'box',
              label: '솔트 = "mnemonic" + passphrase',
              value: `"mnemonic"${passphrase ? ` + "${passphrase}"` : ' (passphrase 없음)'}`,
            },
            { kind: 'op', label: 'PBKDF2-HMAC-SHA512 · 2048회 반복' },
            {
              kind: 'box',
              label: '시드 (512비트, hex 128자)',
              value: seedHex,
              tone: 'good',
            },
          ]}
        />
        <p className='text-xs text-muted-foreground'>반복 횟수가 많을수록 무차별 대입이 느려진다.</p>
      </Panel>

      <ExplainCard
        title='왜 글자 하나에 시드가 통째로 바뀔까? (눈사태 효과)'
        preview='좋은 해시는 입력 1비트만 달라져도 출력 절반이 무작위로 뒤집힌다.'
        body={
          <>
            좋은 해시 함수는 입력이 1비트만 달라져도 출력이 절반쯤 무작위로 뒤집힌다. 그래서 passphrase에 점(.) 하나만
            더해도 완전히 다른 지갑이 된다. 같은 단어 목록 + 다른 passphrase = 서로 무관한 지갑들. 이를 이용해 &#39;위장
            지갑&#39;을 만들 수도 있다.
          </>
        }
      />
    </div>
  );
}
