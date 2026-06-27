// 값 배열을 자동 스케일(min~max) 폴리라인으로 그리는 작은 SVG.
export function Sparkline({
  values,
  label,
  className,
}: {
  values: number[];
  label: string;
  className: string;
}) {
  const W = 100;
  const H = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = values.length <= 1 ? 0 : (i / (values.length - 1)) * W;
    const y = H - ((v - min) / span) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground w-16 shrink-0 text-xs">
        {label}
      </span>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-8 w-full"
      >
        <polyline
          points={pts.join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className={className}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
