"use client";

import { AppHeader } from "@/components/app-header";
import { PageMain } from "@/components/page-main";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useLightningStats,
  useMempoolStats,
  useMiningStats,
  useNodesStats,
} from "@/hooks/use-mempool";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { DonutRing, Section, Stat } from "./components";

export default function MempoolPage() {
  const { data: mempool, isLoading: mempoolLoading } = useMempoolStats();
  const { data: mining, isLoading: miningLoading } = useMiningStats();
  const { data: lightning, isLoading: lightningLoading } = useLightningStats();
  const { data: nodes, isLoading: nodesLoading } = useNodesStats();

  const feeData = mempool
    ? [
        { name: "느림 (~1시간)", value: mempool.hourFee, fill: "#4ade80" },
        { name: "보통 (~30분)", value: mempool.halfHourFee, fill: "#fbbf24" },
        { name: "빠름 (~10분)", value: mempool.fastFee, fill: "#fb923c" },
      ]
    : [];

  return (
    <>
      <AppHeader
        breadcrumbs={[{ label: "비트코인 네트워크" }]}
      />
      <PageMain>
        <div className="flex flex-col gap-6">
          {/* 멤풀 */}
          <Section title="멤풀">
            {mempoolLoading || !mempool ? (
              <Skeleton className="h-[240px] rounded-xl" />
            ) : (
              <Card>
                <CardContent>
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-x-6">
                      <Stat
                        label="미확인 트랜잭션"
                        value={mempool.pendingTxCount.toLocaleString()}
                      />
                      <Stat
                        label="멤풀 크기"
                        value={`${mempool.mempoolSizeMB} MB`}
                      />
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-2 text-xs">
                        수수료 비교
                      </p>
                      <ResponsiveContainer width="100%" height={108}>
                        <BarChart
                          layout="vertical"
                          data={feeData}
                          margin={{ left: 0, right: 52, top: 8, bottom: 8 }}
                        >
                          <XAxis type="number" domain={[0, "auto"]} hide />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={88}
                            axisLine={false}
                            tickLine={false}
                            tick={({ x, y, payload, index }) => (
                              <text
                                x={x}
                                y={y}
                                textAnchor="end"
                                dominantBaseline="middle"
                                fontSize={12}
                                fill={feeData[index]?.fill ?? "hsl(var(--muted-foreground))"}
                              >
                                {payload.value}
                              </text>
                            )}
                          />
                          <Bar dataKey="value" radius={4} maxBarSize={20}>
                            {feeData.map((d, i) => (
                              <Cell key={i} fill={d.fill} />
                            ))}
                            <LabelList
                              dataKey="value"
                              content={({ x, y, width, height, value, index }) => (
                                <text
                                  x={Number(x) + Number(width) + 4}
                                  y={Number(y) + Number(height) / 2}
                                  fill={feeData[index as number]?.fill}
                                  fontSize={12}
                                  dominantBaseline="middle"
                                >
                                  {value} sat/vB
                                </text>
                              )}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </Section>

          {/* 채굴 */}
          <Section title="채굴">
            {miningLoading || !mining ? (
              <Skeleton className="h-[190px] rounded-xl" />
            ) : (
              <Card>
                <CardContent>
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-3 gap-x-6 gap-y-4 sm:grid-cols-5">
                      <Stat label="해시레이트" value={`${mining.hashrateEHs} EH/s`} />
                      <Stat label="블록 보상" value={`${mining.blockRewardBTC} BTC`} />
                      <Stat label="남은 블록" value={mining.remainingBlocks.toLocaleString()} />
                      <Stat
                        label="예상 변화율"
                        value={`${mining.difficultyChangePct > 0 ? "+" : ""}${mining.difficultyChangePct}%`}
                        valueClassName={mining.difficultyChangePct >= 0 ? "text-green-500" : "text-red-500"}
                      />
                      <Stat
                        label="이전 변화율"
                        value={`${mining.previousDifficultyChangePct > 0 ? "+" : ""}${mining.previousDifficultyChangePct}%`}
                        valueClassName={mining.previousDifficultyChangePct >= 0 ? "text-green-500" : "text-red-500"}
                      />
                    </div>
                    <div>
                      {(() => {
                        const pct = ((2016 - mining.remainingBlocks) / 2016) * 100;
                        return (
                          <>
                            <div className="mb-1.5 flex justify-between text-xs">
                              <span className="text-muted-foreground">난이도 조정 진행</span>
                              <span className="font-medium">{pct.toFixed(1)}%</span>
                            </div>
                            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                              <div
                                className="h-full rounded-full bg-blue-500 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-muted-foreground mt-1.5 text-xs">
                              예상 조정일: {mining.estimatedRetargetDate}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </Section>

          {/* 반감기 */}
          <Section title="반감기">
            {miningLoading || !mining ? (
              <Skeleton className="h-[190px] rounded-xl" />
            ) : (
              <Card>
                <CardContent>
                  <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <DonutRing
                      progress={
                        ((210_000 - mining.remainingHalvingBlocks) /
                          210_000) *
                        100
                      }
                      color="#f7931a"
                      center={`${(((210_000 - mining.remainingHalvingBlocks) / 210_000) * 100).toFixed(1)}%`}
                      centerSub="경과"
                    />
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:flex-1">
                      <Stat
                        label="현재 블록"
                        value={mining.blockHeight.toLocaleString()}
                      />
                      <Stat
                        label="다음 반감기 블록"
                        value={mining.nextHalvingBlock.toLocaleString()}
                      />
                      <Stat
                        label="남은 블록"
                        value={mining.remainingHalvingBlocks.toLocaleString()}
                      />
                      <Stat
                        label="예상 날짜"
                        value={mining.estimatedHalvingDate}
                      />
                      <Stat
                        label="현재 보상"
                        value={`${mining.blockRewardBTC} BTC`}
                      />
                      <Stat
                        label="반감기 후 보상"
                        value={`${mining.nextRewardBTC} BTC`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </Section>

          {/* 네트워크 */}
          <Section title="네트워크">
            {lightningLoading || nodesLoading || !lightning || !nodes ? (
              <Skeleton className="h-[88px] rounded-xl" />
            ) : (
              <Card>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                    <Stat
                      label="라이트닝 노드"
                      value={lightning.nodeCount.toLocaleString()}
                    />
                    <Stat
                      label="라이트닝 채널"
                      value={lightning.channelCount.toLocaleString()}
                    />
                    <Stat
                      label="라이트닝 용량"
                      value={`${lightning.totalCapacityBTC.toLocaleString()} BTC`}
                    />
                    <Stat
                      label="풀노드"
                      value={
                        nodes.fullNodeCount != null
                          ? nodes.fullNodeCount.toLocaleString()
                          : "--"
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </Section>
        </div>
      </PageMain>
    </>
  );
}
