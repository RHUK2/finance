import { BarChart3, Bitcoin, Landmark, LineChart, Network, Wheat } from "lucide-react";

export const NAV_ITEMS = [
  { label: "자산 현황", href: "/", icon: BarChart3 },
  { label: "경제 지표", href: "/economy", icon: LineChart },
  { label: "원자재 시장", href: "/commodities", icon: Wheat },
  { label: "비트코인 지표", href: "/bitcoin", icon: Bitcoin },
  { label: "비트코인 네트워크", href: "/mempool", icon: Network },
  { label: "신용창조", href: "/money-creation", icon: Landmark },
];
