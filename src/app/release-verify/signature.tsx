'use client';

import { useEffect, useState } from 'react';

import { CheckCircle2, KeyRound, XCircle } from 'lucide-react';

import { ExplainCard, Field, SectionIntro, SegmentedControl, StatusBanner } from '@/components/simulation';
import { Card } from '@/components/ui/card';

import { generateSigningKey, groupHex, sha256Hex, sigPreview, signText, verifyText } from './models';

type Scenario = 'clean' | 'tampered' | 'wrongkey' | 'attacker';

const OPTIONS: { value: Scenario; label: string }[] = [
  { value: 'clean', label: '그대로' },
  { value: 'tampered', label: '목록 변조' },
  { value: 'wrongkey', label: '다른 키' },
  { value: 'attacker', label: '공격자 서명' },
];

type Demo = {
  devFp: string;
  atkFp: string;
  manifest: string;
  tampered: string;
  devSig: string;
  atkSig: string;
  results: Record<Scenario, boolean>;
};

const NARRATION: Record<Scenario, { subject: string; key: string; note: string }> = {
  clean: {
    subject: '개발자가 서명한 체크섬 목록 그대로',
    key: '개발자 공개키',
    note: '정상 경로다. 목록도 서명도 키도 손대지 않았다.',
  },
  tampered: {
    subject: '체크섬 한 자리를 고친 목록',
    key: '개발자 공개키',
    note: '공격자가 파일과 체크섬을 바꿨다. 앞 탭에서 통과하던 공격이 여기서 걸린다.',
  },
  wrongkey: {
    subject: '개발자가 서명한 체크섬 목록 그대로',
    key: '엉뚱한 공개키',
    note: '목록도 서명도 진짜인데 검증에 쓴 키가 다르다.',
  },
  attacker: {
    subject: '체크섬 한 자리를 고친 목록',
    key: '공격자 공개키',
    note: '공격자가 자기 키쌍을 만들어 바꾼 목록에 직접 서명했다.',
  },
};

export function Signature() {
  const [scenario, setScenario] = useState<Scenario>('clean');
  const [demo, setDemo] = useState<Demo | null>(null);

  useEffect(() => {
    void (async () => {
      const [h1, h2] = await Promise.all([sha256Hex('설치 파일 v1.0.0'), sha256Hex('설명서')]);
      const manifest = `${h1}  demo-wallet.tar.gz\n${h2}  README.txt`;
      const tampered = manifest.replace(h1[0], h1[0] === '0' ? '1' : '0');

      const dev = await generateSigningKey();
      const atk = await generateSigningKey();
      const devSig = await signText(dev, manifest);
      const atkSig = await signText(atk, tampered);

      setDemo({
        devFp: groupHex(dev.fingerprint),
        atkFp: groupHex(atk.fingerprint),
        manifest,
        tampered,
        devSig: sigPreview(devSig),
        atkSig: sigPreview(atkSig),
        results: {
          clean: await verifyText(dev, devSig, manifest),
          tampered: await verifyText(dev, devSig, tampered),
          wrongkey: await verifyText(atk, devSig, manifest),
          attacker: await verifyText(atk, atkSig, tampered),
        },
      });
    })();
  }, []);

  const n = NARRATION[scenario];
  const ok = demo?.results[scenario] ?? false;
  const usesAttackerKey = scenario === 'wrongkey' || scenario === 'attacker';
  const body = demo ? (scenario === 'clean' || scenario === 'wrongkey' ? demo.manifest : demo.tampered) : '';

  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='서명은 파일이 그 키에 대응한다는 것만 증명한다'>
        배포자는 체크섬 목록에 자기 개인키로 서명을 붙인다. 공격자는 그 키가 없으니 목록을 바꾼 뒤 서명을 다시 만들어 낼
        수 없다. 앞 탭에서 통과하던 공격이 여기서 걸린다. 아래 네 경우를 차례로 눌러 보면 서명이 무엇을 보증하고 무엇은
        보증하지 않는지가 갈린다.
      </SectionIntro>

      <Card className='gap-3 p-4'>
        <Field label='무엇을 검증하는가'>
          <SegmentedControl options={OPTIONS} value={scenario} onChange={setScenario} />
        </Field>
        <p className='text-muted-foreground text-sm/relaxed'>{n.note}</p>

        <div className='flex flex-col gap-1'>
          <span className='text-muted-foreground text-xs'>{n.subject}</span>
          <pre className='bg-muted overflow-x-auto rounded-md p-2 font-mono text-[11px] leading-relaxed'>{body}</pre>
        </div>

        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='flex flex-col gap-1'>
            <span className='text-muted-foreground text-xs'>검증에 쓴 {n.key}의 지문</span>
            <span className='font-mono text-[11px] break-all'>{usesAttackerKey ? demo?.atkFp : demo?.devFp}</span>
          </div>
          <div className='flex flex-col gap-1'>
            <span className='text-muted-foreground text-xs'>서명 앞머리</span>
            <span className='font-mono text-[11px] break-all'>
              {scenario === 'attacker' ? demo?.atkSig : demo?.devSig}
            </span>
          </div>
        </div>
      </Card>

      <StatusBanner
        icon={ok ? <CheckCircle2 className='size-4' /> : <XCircle className='size-4' />}
        tone={scenario === 'attacker' ? 'accent' : ok ? 'good' : 'bad'}
      >
        {scenario === 'attacker'
          ? '서명 유효. 그런데 파일은 가짜다'
          : ok
            ? '서명 유효'
            : '서명 검증 실패. 설치하지 않는다'}
      </StatusBanner>

      <ExplainCard
        icon={<KeyRound className='size-4 text-amber-500' />}
        title='마지막 경우가 이 페이지의 경첩이다'
        preview='공격자도 서명할 수 있다. 자기 키로'
        body={
          <>
            <p>
              앞의 세 경우는 서명이 제 일을 한 것이다. 목록이 바뀌면 걸리고, 키가 다르면 걸린다. 그런데 마지막 경우는
              모든 절차를 통과한다. 공격자가 바꾼 목록에 자기 키로 서명했고 그 키로 검증했기 때문이다. 수학적으로 아무
              문제가 없다.
            </p>
            <p className='mt-2'>
              서명이 증명하는 것은 이 파일이 이 키에 대응한다는 사실뿐이다. 그 키가 그 개발자의 것인지는 한 글자도
              증명하지 않는다. 그러니 질문이 옮겨 간다. 검증에 쓴 공개키를 나는 어디서 받았는가. 다음 탭이 그것이다.
            </p>
          </>
        }
      />
    </div>
  );
}
