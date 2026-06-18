import { BarChart3, Bitcoin, LineChart, Network } from "lucide-react";

export const NAV_ITEMS = [
  { label: "자산 현황", href: "/", icon: BarChart3 },
  { label: "비트코인 지표", href: "/bitcoin", icon: Bitcoin },
  { label: "비트코인 네트워크", href: "/mempool", icon: Network },
  { label: "경제 지표", href: "/economy", icon: LineChart },
];
