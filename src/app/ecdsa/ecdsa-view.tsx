'use client';

import { useState } from 'react';

import Link from 'next/link';

import { ExplainerPage } from '@/components/explainer-page';
import { IllustrativeDisclaimer, SimTabs } from '@/components/simulation';

import { BreakLab } from './break-lab';
import { FiniteField } from './finite-field';
import { CURVE_POINTS, N, P } from './models';
import { PointAdd } from './point-add';
import { SignLab } from './sign-lab';
import { VerifyLab } from './verify-lab';

export function EcdsaView() {
  // 개인키·메시지 해시·일회용 비밀값은 네 탭이 함께 쓴다. 탭마다 따로 두면 서명 만들기 탭에서
  // 만든 서명과 서명 검증하기 탭이 검증하는 서명이 달라져 설명이 끊긴다.
  const [d, setD] = useState(7);
  const [z, setZ] = useState(19);
  const [k, setK] = useState(11);

  const TABS = [
    { value: 'field', label: '유한체 위의 곡선', node: <FiniteField /> },
    { value: 'add', label: '점 덧셈과 스칼라 곱', node: <PointAdd d={d} onChangeD={setD} /> },
    {
      value: 'sign',
      label: '서명 만들기',
      node: <SignLab d={d} z={z} k={k} onChangeD={setD} onChangeZ={setZ} onChangeK={setK} />,
    },
    { value: 'verify', label: '서명 검증하기', node: <VerifyLab d={d} z={z} k={k} /> },
    { value: 'break', label: '깨뜨려 보기', node: <BreakLab d={d} z={z} k={k} /> },
  ];

  return (
    <ExplainerPage
      breadcrumb='ECDSA·타원곡선'
      title='개인키에서 공개키는 나오는데 왜 거꾸로는 안 되나'
      intro={
        <>
          비트코인 지갑은 개인키 하나에서 공개키를 만들어 내고, 그 공개키를 온 세상에 뿌리면서도 개인키는 안전하다고
          말한다. 한 방향으로는 계산이 되는데 되돌아오는 길만 막혀 있다는 뜻인데, 그런 계산이 어떻게 생겼는지는 좀처럼
          설명되지 않는다.{' '}
          <Link href='/wallet-keys' className='underline underline-offset-2'>
            지갑 키 생성
          </Link>
          과{' '}
          <Link href='/script-verify' className='underline underline-offset-2'>
            스크립트·서명 검증
          </Link>{' '}
          페이지도 그 자리를 상자로 남겨 두었다. 이 페이지가 그 상자를 연다. 비트코인이 쓰는 곡선과 식이 똑같고 크기만
          작은 곡선(점 {CURVE_POINTS.length}개)을 무대로 삼아, 키를 만들고 서명하고 검증하고 마지막에는 직접 깨뜨려
          본다.
        </>
      }
    >
      <IllustrativeDisclaimer>
        이 페이지의 숫자는 가짜가 아니다. y² = x³ + 7을 mod {P} 위에서 실제로 계산한 값이라 손으로 검산하면 그대로
        맞는다. 다만 곡선이 작아서 안전하지 않다. 개인키 후보가 {N - 1}개뿐이라 깨뜨려 보기 탭에서 보듯 즉시 뚫린다.
        실제 secp256k1은 같은 알고리즘을 2²⁵⁶ 규모에서 돌린다. 여기서 만든 어떤 값도 실제 지갑이나 자금에 쓰지 말 것.
      </IllustrativeDisclaimer>

      <SimTabs tabs={TABS} defaultValue='field' />
    </ExplainerPage>
  );
}
