"use client";

import { useState } from "react";

import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useBitcoinHistorical } from "@/hooks/use-crypto";
import {
  useInflationData,
  useInflationDataKr,
  type InflationData,
} from "@/hooks/use-inflation";
import { KR_MIN_WAGE, US_MIN_WAGE } from "@/lib/inflation-models";

import { AssetRaceChart } from "./asset-race-chart";
import { CollapseCalculator } from "./collapse-calculator";
import { CpiM2GapChart } from "./cpi-m2-gap-chart";
import { LaborHours } from "./labor-hours";
import type { Currency } from "./components";

type Country = "US" | "KR";

const CONFIG: Record<
  Country,
  {
    label: string;
    currency: Currency;
    minYear: number;
    maxYear: number;
    principal: { min: number; max: number; step: number; default: number };
    gapBaseYear: number;
    raceBaseYear: number;
    wageTable: { year: number; wage: number }[];
    envKey: string;
    stockLabel: string;
  }
> = {
  US: {
    label: "미국",
    currency: "$",
    minYear: 1971,
    maxYear: 2025,
    principal: { min: 1000, max: 1_000_000, step: 1000, default: 10_000 },
    gapBaseYear: 1971,
    raceBaseYear: 2015,
    wageTable: US_MIN_WAGE,
    envKey: "FRED_API_KEY",
    stockLabel: "주식 (나스닥)",
  },
  KR: {
    label: "한국",
    currency: "₩",
    minYear: 2003, // M2 신계열(161Y006) 시작연도에 맞춤
    maxYear: 2025,
    principal: {
      min: 1_000_000,
      max: 1_000_000_000,
      step: 1_000_000,
      default: 10_000_000,
    },
    gapBaseYear: 2003,
    raceBaseYear: 2000,
    wageTable: KR_MIN_WAGE,
    envKey: "ECOS_API_KEY",
    stockLabel: "주식 (코스피)",
  },
};

export function InflationView() {
  const [country, setCountry] = useState<Country>("US");
  const us = useInflationData();
  const kr = useInflationDataKr();
  const btcQuery = useBitcoinHistorical();

  const cfg = CONFIG[country];
  const data = country === "US" ? us.data : kr.data;
  // 미국만 USD 자산(금·주식·BTC)과 통화 단위가 일치하므로 BTC를 합류시킨다.
  const btc = country === "US" ? btcQuery.data?.history : undefined;

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "구매력 붕괴" }]} />
      <PageMain>
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold">
              예금은 노동의 가치를 지켜주는가
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              CPI(소비재 물가)·M2(통화량)·자산가격은 서로 다른 것을 측정합니다.
              예금 금리가 통화 팽창에 못 미치면, 저축한 과거 노동의 구매력은
              조용히 줄어듭니다. 어느 쪽이 얼마나 벌어지는지 데이터로
              비교합니다.
            </p>
          </div>

          <div className="flex gap-2">
            {(Object.keys(CONFIG) as Country[]).map((c) => (
              <Button
                key={c}
                size="sm"
                variant={country === c ? "default" : "outline"}
                onClick={() => setCountry(c)}
              >
                {CONFIG[c].label}
              </Button>
            ))}
          </div>

          {!data ? (
            <Card>
              <CardContent className="text-muted-foreground text-sm">
                데이터를 불러오는 중…
              </CardContent>
            </Card>
          ) : data.available === false ? (
            <Card>
              <CardContent className="text-muted-foreground text-sm">
                {cfg.label} 데이터는{" "}
                <code className="text-foreground">{cfg.envKey}</code> 환경변수를
                설정하면 표시됩니다.
              </CardContent>
            </Card>
          ) : (
            <Devices country={country} cfg={cfg} data={data} btc={btc} />
          )}

          <p className="text-muted-foreground border-t pt-4 text-xs leading-relaxed">
            CPI는 통계청/BLS 정의에 따른 측정치이며, 통화 팽창·자산가격은 별개
            지표입니다. 본 페이지는 특정 측정의 오류를 단정하지 않고, 예금
            금리와 통화·자산 지표 간의 격차를 보여줍니다. M2는 2021년 정의가
            변경되었고, 예금 금리는 단기 안전금리(미국: 3개월 국채) 근사이며,
            자산 수익률은 배당·세금·거래비용을 제외한 가격 기준입니다.
          </p>
        </div>
      </PageMain>
    </>
  );
}

function Devices({
  country,
  cfg,
  data,
  btc,
}: {
  country: Country;
  cfg: (typeof CONFIG)[Country];
  data: InflationData;
  btc?: { time: string; value: number }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <CollapseCalculator
        key={`calc-${country}`}
        data={data}
        btc={btc}
        currency={cfg.currency}
        minYear={cfg.minYear}
        maxYear={cfg.maxYear}
        principal={cfg.principal}
        stockLabel={cfg.stockLabel}
      />
      <LaborHours
        key={`labor-${country}`}
        data={data}
        btc={btc}
        currency={cfg.currency}
        minYear={cfg.minYear}
        maxYear={cfg.maxYear}
        wageTable={cfg.wageTable}
        stockLabel={cfg.stockLabel}
      />
      <CpiM2GapChart
        key={`gap-${country}`}
        data={data}
        baseYear={cfg.gapBaseYear}
      />
      <AssetRaceChart
        key={`race-${country}`}
        data={data}
        btc={btc}
        baseYear={cfg.raceBaseYear}
        stockLabel={cfg.stockLabel}
      />
    </div>
  );
}
