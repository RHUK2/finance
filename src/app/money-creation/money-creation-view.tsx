"use client";

import { useMemo, useState } from "react";

import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";

import {
  BalanceSheet,
  MoneyCounter,
  NarrationCard,
  StepControls,
} from "./components";
import { ENTITIES, buildSteps, metricsAt, sheetsAt } from "./steps";

export function MoneyCreationView() {
  const [step, setStep] = useState(0);
  const [reserveRatio, setReserveRatio] = useState(0.1);

  const steps = useMemo(() => buildSteps(reserveRatio), [reserveRatio]);
  const sheets = useMemo(() => sheetsAt(steps, step), [steps, step]);
  const metrics = useMemo(() => metricsAt(steps, step), [steps, step]);

  const current = steps[step];
  const isMultiplierStep = current.id === "multiplier";

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "신용창조" }]} />
      <PageMain>
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold">돈은 어떻게 무에서 창조되는가</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              정부 · 연준 · 시중은행 · 국민의 대차대조표를 따라가며, 국채 발행부터 신용창조까지
              돈이 만들어지는 과정을 한 단계씩 살펴본다. (단위는 개념용 예시)
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MoneyCounter label="본원통화 (M0)" value={metrics.m0} accent />
            <MoneyCounter label="광의통화 (M2)" value={metrics.m2} accent />
            <MoneyCounter label="통화승수" value={metrics.multiplier} suffix="배" />
          </div>

          <NarrationCard index={step} title={current.title} narration={current.narration} />

          {isMultiplierStep && (
            <div className="flex flex-col gap-1.5 rounded-lg border p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">지급준비율</span>
                <span className="font-mono tabular-nums">
                  {Math.round(reserveRatio * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={Math.round(reserveRatio * 100)}
                onChange={(e) => setReserveRatio(Number(e.target.value) / 100)}
                className="w-full accent-amber-500"
              />
              <p className="text-xs text-muted-foreground">
                지급준비율이 낮을수록 통화승수가 커진다 (최대 통화량 = 본원통화 ÷ 지급준비율).
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {ENTITIES.map((e) => (
              <BalanceSheet key={e.id} name={e.name} sub={e.sub} sheet={sheets[e.id]} />
            ))}
          </div>

          <StepControls
            step={step}
            total={steps.length}
            onPrev={() => setStep((s) => Math.max(0, s - 1))}
            onNext={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            onReset={() => setStep(0)}
            onJump={setStep}
          />
        </div>
      </PageMain>
    </>
  );
}
