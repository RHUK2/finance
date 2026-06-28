import { ArrowDown } from "lucide-react";

import { cn } from "@/lib/utils";

// 암호 변환 과정을 세로 파이프라인으로 시각화 — 박스(값) 사이에 연산(op) 화살표.
// split은 한 연산이 둘로 쪼개지는 출력(예: HMAC-SHA512 → 개인키 + 체인코드)을 나란히 보여준다.
type Box = { label: string; value: React.ReactNode; tone?: "accent" | "good" };

export type PipeItem =
  | ({ kind: "box" } & Box)
  | { kind: "split"; boxes: Box[] }
  | { kind: "op"; label: string };

function BoxCell({ label, value, tone }: Box) {
  return (
    <div
      className={cn(
        "bg-muted flex flex-col gap-1 rounded-md p-3",
        tone === "accent" && "border border-amber-500/40",
        tone === "good" && "border border-emerald-500/40",
      )}
    >
      <span className="text-muted-foreground text-xs">{label}</span>
      <code className="font-mono text-xs break-all">{value}</code>
    </div>
  );
}

export function Pipeline({ items }: { items: PipeItem[] }) {
  return (
    <div className="flex flex-col items-stretch gap-1.5">
      {items.map((it, i) =>
        it.kind === "op" ? (
          <div
            key={i}
            className="text-muted-foreground flex items-center justify-center gap-1.5 text-center text-xs"
          >
            <ArrowDown className="size-3.5 shrink-0" />
            {it.label}
          </div>
        ) : it.kind === "split" ? (
          <div key={i} className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {it.boxes.map((b, j) => (
              <BoxCell key={j} {...b} />
            ))}
          </div>
        ) : (
          <BoxCell key={i} {...it} />
        ),
      )}
    </div>
  );
}
