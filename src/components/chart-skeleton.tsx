import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  chartHeight?: number;
  subtitleClassName?: string;
  valueClassName?: string;
};

export function ChartSkeleton({
  chartHeight = 280,
  subtitleClassName = "w-48",
  valueClassName = "h-9 w-24",
}: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
        <Skeleton className={`h-3 ${subtitleClassName}`} />
        <Skeleton className={valueClassName} />
      </CardHeader>
      <CardContent className="p-0 pb-4">
        <Skeleton
          className="w-full rounded-none"
          style={{ height: chartHeight }}
        />
      </CardContent>
    </Card>
  );
}
