"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { type MarketItem } from "@/hooks/use-market";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScrollDrag } from "@/hooks/use-scroll-drag";
import { cn } from "@/lib/utils";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

const TYPE_LABELS: Record<string, string> = {
  all: "전체",
  crypto: "가상화폐",
  stock: "주식",
  index: "지수",
  commodity: "원자재",
  forex: "환율",
};

const TYPE_DOT_COLORS: Record<string, string> = {
  crypto: "bg-amber-500",
  stock: "bg-blue-500",
  index: "bg-purple-500",
  commodity: "bg-yellow-500",
  forex: "bg-teal-500",
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  KRW: "₩",
  USD: "$",
  JPY: "¥",
  EUR: "€",
  GBP: "£",
  BTC: "₿",
};

function currencySymbol(currency: string) {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

const FMT_KRW = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const FMT_BTC = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 6,
  maximumFractionDigits: 8,
});
const FMT_USD = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatPrice(price: number, currency: string) {
  if ((currency === "KRW" && price >= 100) || price > 100000)
    return FMT_KRW.format(price);
  if (currency === "BTC" || price < 0.01) return FMT_BTC.format(price);
  return FMT_USD.format(price);
}

function PriceDisplay({
  item,
  priceClassName,
}: {
  item: MarketItem;
  priceClassName?: string;
}) {
  if (item.price === null)
    return <span className="text-muted-foreground">-</span>;
  const symbol = currencySymbol(item.currency);
  const krw = item.currency !== "KRW" ? item.priceKrw : null;
  return (
    <>
      <div className={cn("tabular-nums", priceClassName)}>
        {symbol}
        {formatPrice(item.price, item.currency)}
      </div>
      {krw != null && (
        <div className="text-muted-foreground text-xs tabular-nums">
          ₩{formatPrice(krw, "KRW")}
        </div>
      )}
    </>
  );
}

function PercentageChange({
  value,
  className,
}: {
  value: number | null;
  className?: string;
}) {
  if (value === null) return <span className="text-muted-foreground">-</span>;
  const isPositive = value >= 0;
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-1 tabular-nums",
        isPositive ? "text-green-500" : "text-red-500",
        className,
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3 shrink-0" />
      ) : (
        <TrendingDown className="h-3 w-3 shrink-0" />
      )}
      {isPositive ? "+" : ""}
      {value.toFixed(2)}%
    </div>
  );
}

const columnHelper = createColumnHelper<MarketItem>();

type Props = {
  data: MarketItem[];
  isLoading: boolean;
};

const ASSET_TYPES = ["all", "crypto", "stock", "index", "commodity", "forex"];

const MOBILE_SORT_OPTIONS = [
  { value: "default", label: "기본" },
  { value: "label-asc", label: "자산명 오름차순" },
  { value: "price-desc", label: "가격 높은순" },
  { value: "price-asc", label: "가격 낮은순" },
  { value: "changePercent-desc", label: "증감 높은순" },
  { value: "changePercent-asc", label: "증감 낮은순" },
];

export function AssetsTable({ data, isLoading }: Props) {
  const isMobile = useIsMobile();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [mobileSortKey, setMobileSortKey] = useState("default");
  const {
    ref: filterRef,
    handlers: filterHandlers,
    maskStyle: filterMaskStyle,
  } = useScrollDrag();

  const filtered = useMemo(
    () =>
      typeFilter === "all"
        ? data
        : data.filter((item) => item.type === typeFilter),
    [data, typeFilter],
  );

  const mobileSorted = useMemo(() => {
    if (mobileSortKey === "default") return filtered;
    const [col, dir] = mobileSortKey.split("-") as [string, "asc" | "desc"];
    return filtered.toSorted((a, b) => {
      const av =
        (a[col as keyof MarketItem] as number | string | null) ??
        (dir === "asc" ? Infinity : -Infinity);
      const bv =
        (b[col as keyof MarketItem] as number | string | null) ??
        (dir === "asc" ? Infinity : -Infinity);
      if (typeof av === "string" && typeof bv === "string")
        return dir === "asc"
          ? av.localeCompare(bv, "ko")
          : bv.localeCompare(av, "ko");
      return dir === "asc"
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
  }, [filtered, mobileSortKey]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("label", {
        header: "자산",
        cell: (info) => {
          const type = info.row.original.type;
          return (
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${TYPE_DOT_COLORS[type] ?? "bg-muted"}`}
              />
              <div>
                <span className="font-medium">{info.getValue()}</span>
                <span className="text-muted-foreground ml-2 text-xs">
                  {info.row.original.ticker}
                </span>
              </div>
            </div>
          );
        },
        filterFn: "includesString",
      }),
      columnHelper.accessor("price", {
        header: "가격",
        cell: (info) => (
          <div>
            <PriceDisplay item={info.row.original} />
          </div>
        ),
        sortingFn: (a, b) => (a.original.price ?? 0) - (b.original.price ?? 0),
      }),
      columnHelper.accessor("changePercent", {
        header: "증감",
        cell: (info) => <PercentageChange value={info.getValue()} />,
        sortingFn: (a, b) =>
          (a.original.changePercent ?? 0) - (b.original.changePercent ?? 0),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
  });

  const filterTabs = (
    <div
      ref={filterRef}
      className="cursor-grab [scrollbar-width:none] overflow-x-auto select-none active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
      style={filterMaskStyle}
      {...filterHandlers}
    >
      <div className="flex w-max items-center gap-1.5">
        {ASSET_TYPES.map((type) => (
          <Button
            key={type}
            size="sm"
            variant={typeFilter === type ? "default" : "secondary"}
            onClick={() => setTypeFilter(type)}
            className="rounded-full whitespace-nowrap"
          >
            {TYPE_LABELS[type]}
          </Button>
        ))}
      </div>
    </div>
  );

  const controls = isMobile ? (
    <div className="flex flex-col gap-3">
      <div className="relative w-full">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="자산 검색..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-8"
        />
      </div>
      <Select value={mobileSortKey} onValueChange={setMobileSortKey}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MOBILE_SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {filterTabs}
    </div>
  ) : (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="자산 검색..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-8"
        />
      </div>
      {filterTabs}
    </div>
  );

  if (isMobile) {
    return (
      <div className="space-y-4">
        {controls}
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 21 }).map((_, i) => (
              <div
                key={i}
                className="bg-card flex items-center justify-between rounded-xl border px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-1.5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
            ))
          ) : mobileSorted.length === 0 ? (
            <div className="text-muted-foreground py-10 text-center text-sm">
              검색 결과가 없습니다.
            </div>
          ) : (
            mobileSorted.map((item) => (
              <div
                key={item.symbol}
                className={cn(
                  "bg-card flex items-center justify-between rounded-xl border px-4 py-3 shadow-sm",
                  item.gfUrl &&
                    "hover:bg-muted/30 cursor-pointer transition-colors",
                )}
                onClick={() => item.gfUrl && window.open(item.gfUrl, "_blank")}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${TYPE_DOT_COLORS[item.type] ?? "bg-muted"}`}
                  />
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-muted-foreground text-xs">
                      {item.ticker}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <PriceDisplay
                    item={item}
                    priceClassName="text-sm font-medium"
                  />
                  <PercentageChange
                    value={item.changePercent}
                    className="gap-0.5 text-xs"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {controls}

      <div className="bg-card overflow-hidden rounded-xl border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-muted/40 border-b">
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    const canSort = header.column.getCanSort();
                    return (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={`text-muted-foreground px-4 py-3 text-left text-xs font-medium last:text-right ${canSort ? "hover:text-foreground cursor-pointer select-none" : ""}`}
                      >
                        <div
                          className={`flex items-center gap-1 ${header.index > 0 ? "justify-end" : ""}`}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {canSort &&
                            (sorted === "asc" ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : sorted === "desc" ? (
                              <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-40" />
                            ))}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 21 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-end space-y-1.5">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="text-muted-foreground px-4 py-10 text-center"
                  >
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const gfUrl = row.original.gfUrl;
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        gfUrl && "cursor-pointer",
                      )}
                      onClick={() => gfUrl && window.open(gfUrl, "_blank")}
                    >
                      {row.getVisibleCells().map((cell, i) => (
                        <td
                          key={cell.id}
                          className={`px-4 py-3 ${i > 0 ? "text-right" : ""}`}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
