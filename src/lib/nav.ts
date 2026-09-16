import {
  Activity,
  ArrowLeftRight,
  Atom,
  Banknote,
  BarChart3,
  Bitcoin,
  Building2,
  Coins,
  Globe,
  EyeOff,
  Fingerprint,
  Gauge,
  Gem,
  GitFork,
  History,
  House,
  KeyRound,
  Landmark,
  Layers,
  Percent,
  LineChart,
  Network,
  PackageCheck,
  Radar,
  Radio,
  ShieldCheck,
  ShieldHalf,
  Spline,
  Split,
  Swords,
  TrendingDown,
  Users,
  Vote,
  Waypoints,
  Wheat,
  Zap,
} from 'lucide-react';

// 그룹의 축은 주제가 아니라 페이지 성격이다(ADR 0008). 첫 그룹은 외부 API에서 지금
// 값을 받아오는 다섯이고, 나머지는 전부 설명형이라 주제로 가른다. CLAUDE.md
// "페이지 두 갈래"가 껍데기 규약으로 갈라 둔 선을 사이드바도 그대로 따른다.
//
// 그룹 라벨이 '대시보드'가 아닌 것은 그 말이 CLAUDE.md 안에서만 통하는 내부 용어이기
// 때문이다. 화면에는 그 다섯의 유일한 공통점을 적는다.
//
// '비트코인 경제·논쟁' 안에서는 항목 라벨의 '비트코인' 접두사를 뗀다. 그룹 라벨이 이미
// 답하고 있어서다. 실시간 데이터로 옮겨간 '비트코인 차트'·'비트코인 네트워크'는 그
// 그룹에 없으므로 접두사를 유지한다. 경로는 어느 쪽도 바꾸지 않는다.
export const NAV_GROUPS = [
  {
    label: '실시간 데이터',
    items: [
      { label: '자산 현황', href: '/', icon: BarChart3 },
      { label: '경제 차트', href: '/economy', icon: LineChart },
      { label: '원자재 차트', href: '/commodities', icon: Wheat },
      { label: '비트코인 차트', href: '/bitcoin', icon: Bitcoin },
      { label: '비트코인 네트워크', href: '/mempool', icon: Network },
    ],
  },
  {
    label: '비트코인 프로토콜',
    items: [
      { label: '지갑 키 생성', href: '/wallet-keys', icon: KeyRound },
      { label: 'ECDSA·타원곡선', href: '/ecdsa', icon: Spline },
      { label: '트랜잭션 해부', href: '/transactions', icon: Coins },
      {
        label: '스크립트·서명 검증',
        href: '/script-verify',
        icon: ShieldCheck,
      },
      { label: '멀티시그·타임락', href: '/multisig-timelock', icon: Users },
      { label: 'P2P 네트워크 전파', href: '/p2p-network', icon: Radio },
      { label: '블록·채굴·합의', href: '/block-mining', icon: Gauge },
      { label: '체인 재구성·파이널리티', href: '/chain-reorg', icon: GitFork },
      { label: '체인 분기·리플레이', href: '/chain-split', icon: Split },
      { label: '소프트포크 활성화', href: '/soft-fork-activation', icon: Vote },
      { label: '라이트닝 네트워크', href: '/lightning-network', icon: Waypoints },
      { label: '프라이버시', href: '/privacy', icon: EyeOff },
      { label: '릴리스 검증', href: '/release-verify', icon: PackageCheck },
    ],
  },
  {
    label: '비트코인 경제·논쟁',
    items: [
      { label: '역사', href: '/bitcoin-history', icon: History },
      { label: '게임이론', href: '/bitcoin-game-theory', icon: Swords },
      { label: '소프트워', href: '/softwar', icon: Radar },
      { label: '변동성', href: '/bitcoin-volatility', icon: Activity },
      { label: '전력망', href: '/grid-battery', icon: Zap },
      { label: '양자컴퓨터', href: '/bitcoin-quantum', icon: Atom },
      { label: '자금추적', href: '/illicit-funds', icon: Fingerprint },
      { label: '보안 예산', href: '/security-budget', icon: ShieldHalf },
    ],
  },
  {
    label: '화폐·거시',
    items: [
      { label: '가치론', href: '/value-theory', icon: Gem },
      { label: '신용창조', href: '/money-creation', icon: Landmark },
      { label: '구매력 붕괴', href: '/inflation', icon: TrendingDown },
      { label: '달러 패권', href: '/dollar-hegemony', icon: Globe },
      { label: '채권·금리', href: '/bonds-rates', icon: Percent },
    ],
  },
  {
    label: '시장·기업',
    items: [
      { label: '선물·헤징', href: '/futures-hedging', icon: ArrowLeftRight },
      { label: '법인', href: '/corporation', icon: Building2 },
      { label: '자본구조', href: '/capital-structure', icon: Layers },
    ],
  },
  {
    label: '부동산',
    items: [
      { label: '전세 구조', href: '/jeonse', icon: House },
      { label: '주택담보대출', href: '/mortgage', icon: Banknote },
    ],
  },
];

/**
 * 경로로 그 페이지의 이름을 찾는다. 사이드바·모바일 드로어·breadcrumb이 같은
 * 문자열을 쓰게 하는 단일 출처다. 예전에는 페이지마다 breadcrumb 문자열을 따로
 * 적어 두어, 여기 라벨을 고치면 같은 페이지가 두 이름으로 보였다.
 */
export function navLabel(pathname: string): string | undefined {
  for (const group of NAV_GROUPS) {
    const hit = group.items.find((i) => i.href === pathname);
    if (hit) return hit.label;
  }
  return undefined;
}
