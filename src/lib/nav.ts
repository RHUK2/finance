import {
  BarChart3,
  Bitcoin,
  Landmark,
  LineChart,
  Network,
  Swords,
  TrendingDown,
  Wheat,
  Zap,
} from "lucide-react";

export const NAV_ITEMS = [
  { label: "자산 현황", href: "/", icon: BarChart3 },
  { label: "경제 지표", href: "/economy", icon: LineChart },
  { label: "원자재 시장", href: "/commodities", icon: Wheat },
  { label: "비트코인 지표", href: "/bitcoin", icon: Bitcoin },
  { label: "비트코인 네트워크", href: "/mempool", icon: Network },
  { label: "비트코인 게임이론", href: "/bitcoin-game-theory", icon: Swords },
  { label: "신용창조", href: "/money-creation", icon: Landmark },
  { label: "구매력 붕괴", href: "/inflation", icon: TrendingDown },
  { label: "전력망 배터리", href: "/grid-battery", icon: Zap },
];
