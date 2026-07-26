import {
  Activity,
  Atom,
  Banknote,
  BarChart3,
  Bitcoin,
  Building2,
  Coins,
  EyeOff,
  Gauge,
  GitFork,
  History,
  House,
  KeyRound,
  Landmark,
  Layers,
  LineChart,
  Network,
  Radar,
  Radio,
  ShieldCheck,
  Swords,
  TrendingDown,
  Users,
  Vote,
  Waypoints,
  Wheat,
  Zap,
} from 'lucide-react';

export const NAV_GROUPS = [
  {
    label: '마켓',
    items: [
      { label: '자산 현황', href: '/', icon: BarChart3 },
      { label: '경제 차트', href: '/economy', icon: LineChart },
      { label: '원자재 차트', href: '/commodities', icon: Wheat },
    ],
  },
  {
    label: '비트코인 인사이트',
    items: [
      { label: '비트코인 차트', href: '/bitcoin', icon: Bitcoin },
      { label: '비트코인 역사', href: '/bitcoin-history', icon: History },
      { label: '비트코인 네트워크', href: '/mempool', icon: Network },
      {
        label: '비트코인 게임이론',
        href: '/bitcoin-game-theory',
        icon: Swords,
      },
      { label: '비트코인 소프트워', href: '/softwar', icon: Radar },
      { label: '비트코인 변동성', href: '/bitcoin-volatility', icon: Activity },
      { label: '비트코인 전력망', href: '/grid-battery', icon: Zap },
      { label: '비트코인 양자컴퓨터', href: '/bitcoin-quantum', icon: Atom },
    ],
  },
  {
    label: '비트코인 프로토콜',
    items: [
      { label: '지갑 키 생성', href: '/wallet-keys', icon: KeyRound },
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
      { label: '소프트포크 활성화', href: '/soft-fork-activation', icon: Vote },
      { label: '라이트닝 네트워크', href: '/lightning-network', icon: Waypoints },
      { label: '프라이버시', href: '/privacy', icon: EyeOff },
    ],
  },
  {
    label: '화폐',
    items: [
      { label: '신용창조', href: '/money-creation', icon: Landmark },
      { label: '구매력 붕괴', href: '/inflation', icon: TrendingDown },
    ],
  },
  {
    label: '기업',
    items: [
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

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);
