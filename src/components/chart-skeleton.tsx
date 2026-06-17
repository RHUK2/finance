import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  chartHeight?: number;
  children?: React.ReactNode;
};

export function ChartSkeleton({ chartHeight = 280, children }: Props) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28" />
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
