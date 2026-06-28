import {
  Activity,
  BarChart3,
  Bitcoin,
  Coins,
  KeyRound,
  Landmark,
  LineChart,
  Network,
  Radar,
  Swords,
  TrendingDown,
  Wheat,
  Zap,
} from "lucide-react";

export const NAV_GROUPS = [
  {
    label: "마켓",
    items: [
      { label: "자산 현황", href: "/", icon: BarChart3 },
      { label: "경제", href: "/economy", icon: LineChart },
      { label: "원자재", href: "/commodities", icon: Wheat },
    ],
  },
  {
    label: "비트코인",
    items: [
      { label: "비트코인", href: "/bitcoin", icon: Bitcoin },
      { label: "비트코인 네트워크", href: "/mempool", icon: Network },
      { label: "비트코인 게임이론", href: "/bitcoin-game-theory", icon: Swords },
      { label: "비트코인 소프트워", href: "/softwar", icon: Radar },
      { label: "비트코인 변동성", href: "/bitcoin-volatility", icon: Activity },
    ],
  },
  {
    label: "비트코인 기술",
    items: [
      { label: "지갑 키 생성", href: "/wallet-keys", icon: KeyRound },
      { label: "트랜잭션 해부", href: "/transactions", icon: Coins },
    ],
  },
  {
    label: "화폐",
    items: [
      { label: "신용창조", href: "/money-creation", icon: Landmark },
      { label: "구매력 붕괴", href: "/inflation", icon: TrendingDown },
    ],
  },
  {
    label: "에너지",
    items: [{ label: "전력망 배터리", href: "/grid-battery", icon: Zap }],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);
