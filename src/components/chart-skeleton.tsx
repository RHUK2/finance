import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  chartHeight?: number;
  children?: React.ReactNode;
  showUpdatedLabel?: boolean;
};

export function ChartSkeleton({ chartHeight = 280, children, showUpdatedLabel }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          {showUpdatedLabel && <Skeleton className="h-3 w-14" />}
        </div>
        {children}
      </CardHeader>
      <CardContent className="p-0">
        <Skeleton
          className="w-full rounded-none"
          style={{ height: chartHeight + 2 }}
        />
        <div className="h-4" />
      </CardContent>
    </Card>
  );
}
