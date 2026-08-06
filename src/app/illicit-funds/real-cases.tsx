'use client';

import { Clock, Search } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { ExplainCard, Metric, SectionIntro } from '@/components/simulation';

const CASES = [
  {
    year: '2013 → 2020',
    title: '실크로드',
    gap: '7년',
    body: '2013년 10월 미 연방수사국이 다크웹 마약 거래 사이트 실크로드를 폐쇄하고 운영자 로스 울브리히트를 체포했다. 그와 별개로 사이트에서 빠져나갔던 69,370 BTC는 7년 동안 한 주소에서 움직이지 않고 있었고, 2020년 11월 미 법무부가 이를 압수했다고 발표했다.',
    lesson:
      '코인을 움직이지 않는다고 안전해지지 않는다. 원장에 그대로 남아 있으니, 수사기관은 7년 뒤 그 주소의 개인키를 확보한 시점에 곧바로 회수할 수 있었다.',
  },
  {
    year: '2021',
    title: '콜로니얼 파이프라인 랜섬웨어',
    gap: '약 1개월',
    body: '2021년 5월 미국 동부 최대 송유관 운영사가 다크사이드 랜섬웨어에 마비돼 75 BTC(당시 약 440만 달러)를 몸값으로 지불했다. FBI는 그 자금이 지갑 사이를 이동하는 과정을 실시간으로 좇았고, 6월에 63.7 BTC를 회수했다고 발표했다.',
    lesson:
      '현금이나 은행 송금이었다면 불가능했을 속도다. 공개 원장 덕분에 영장 없이도 자금 이동을 실시간으로 지켜볼 수 있었다.',
  },
  {
    year: '2016 → 2022',
    title: '비트파이넥스 해킹',
    gap: '6년',
    body: '2016년 8월 거래소 비트파이넥스에서 119,754 BTC가 탈취됐다. 범인은 6년에 걸쳐 2,000건이 넘는 거래로 자금을 잘게 쪼개고 여러 거래소·다크웹 시장을 거치며 세탁했다. 2022년 2월 미 법무부는 약 94,000 BTC를 압수하고 일리야 리히텐슈타인·헤더 모건 부부를 체포했으며, 두 사람은 이후 유죄를 인정했다.',
    lesson:
      '2,000건이 넘는 분할 이체는 추적을 6년으로 늘렸을 뿐 끊지 못했다. 반대로 그 2,000여 건 전부가 법정에 제출 가능한 증거로 남았다.',
  },
];

export function RealCases() {
  return (
    <div className='flex flex-col gap-4'>
      <SectionIntro title='실제로 어떻게 잡혔나'>
        아래 세 사건은 흔히 &#39;비트코인이 범죄에 쓰인 사례&#39;로 인용되지만, 동시에{' '}
        <b>공개 원장 덕분에 자금이 회수된 사례</b>이기도 하다. 사건 발생과 자금 회수 사이의 간격에 주목해 보자.
      </SectionIntro>

      <div className='flex flex-col gap-3'>
        {CASES.map((c) => (
          <Card key={c.title} className='gap-3 p-4'>
            <div className='flex flex-wrap items-baseline justify-between gap-2'>
              <span className='font-semibold'>{c.title}</span>
              <span className='text-muted-foreground text-xs tabular-nums'>{c.year}</span>
            </div>
            <p className='text-muted-foreground text-sm/relaxed'>{c.body}</p>
            <div className='bg-muted flex items-start gap-2 rounded-md p-3 text-sm/relaxed'>
              <Search className='mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400' />
              <span>{c.lesson}</span>
            </div>
            <span className='text-muted-foreground flex items-center gap-1.5 text-xs'>
              <Clock className='size-3.5' />
              사건에서 자금 회수·검거까지 {c.gap}
            </span>
          </Card>
        ))}
      </div>

      <Card className='flex flex-col gap-3 p-4'>
        <span className='font-semibold'>불법 거래는 전체에서 얼마나 되나</span>
        <div className='grid grid-cols-2 gap-2'>
          <Metric label='온체인 거래액 중 불법 주소 비중' value='1% 미만' sub='체인분석 업계 연간 추정치' />
          <Metric label='세계 자금세탁 규모' value='GDP의 2~5%' sub='UNODC 추정, 대부분 법정화폐' tone='accent' />
        </div>
        <p className='text-muted-foreground text-xs/relaxed'>
          체인분석 업체들이 매년 내는 추정치는 대체로 1%를 밑돈다. 다만 이 숫자는 그대로 믿을 게 아니다. 새로 식별된
          불법 주소가 반영되면 과거 연도 수치가 사후에 상향 조정되고, 거래소 내부 이체처럼 체인에 남지 않는 흐름은
          애초에 집계되지 않는다. 방향성 참고용으로만 보는 게 맞다.
        </p>
      </Card>

      <ExplainCard
        title='정리: 비트코인은 범죄에 좋은 도구인가'
        preview='들고 도망치기에는 최고, 그 뒤에 쓰기에는 최악이다.'
        body={
          <>
            비트코인은 자금을 <b>탈취하고 이동시키는 단계</b>에서는 압도적으로 유리하다. 국경도 무게도 없고, 되돌릴 수도
            없으며, 계좌 동결도 안 통한다. 랜섬웨어가 비트코인을 요구하는 이유가 이것이다. 그런데{' '}
            <b>그 돈을 쓰는 단계</b>에서는 최악의 도구가 된다. 모든 이동이 영구 공개 기록으로 남고, 법정화폐로 나오는
            출구는 대부분 규제되며, 한번 신원이 붙으면 원장 전체가 소급해서 증거가 된다. 현금은 정반대다. 옮기기는
            어렵지만 일단 옮기고 나면 추적이 사실상 불가능하다. 그래서 &#39;범죄 자금은 비트코인으로 간다&#39;는 통념과
            달리, 실제 대규모 자금세탁의 무게중심은 여전히 법정화폐 쪽에 있다.
          </>
        }
      />
    </div>
  );
}
