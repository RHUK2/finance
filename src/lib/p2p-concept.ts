// P2P 네트워크 전파 개념 시연용 순수 계산 함수.
// ⚠️ 실제 비트코인 노드는 8~125개의 피어와 무작위로 연결된다. 여기서는 화면에 다 그릴 수 있게
// 노드 수·평균 연결 수를 훨씬 작게 줄였을 뿐, 그래프가 격자가 아니라 무작위라는 점(그래서 홉 수가
// 적다는 스몰월드 성질)은 실제와 같은 구조로 재현한다.

import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from 'd3-force';

import { clamp, mulberry32 } from './utils';

export type GossipGraph = {
  adjacency: number[][];
  edges: [number, number][];
  positions: { x: number; y: number }[];
};

// 반발력(forceManyBody)·연결(forceLink)·중심 고정(forceCenter)·겹침 방지(forceCollide) 힘을
// 정해진 틱 수만큼 미리 계산해, 노드가 자연스럽게 퍼진 정적 레이아웃을 얻는다.
// 초기 좌표는 seeded RNG로 뽑아 리셋해도 매번 같은 모양이 나오게 한다.
function layoutWithForce(nodeCount: number, edges: [number, number][], rng: () => number) {
  const nodes: (SimulationNodeDatum & { index: number })[] = Array.from({ length: nodeCount }, (_, i) => ({
    index: i,
    x: 50 + (rng() - 0.5) * 60,
    y: 50 + (rng() - 0.5) * 60,
  }));
  const links = edges.map(([source, target]) => ({ source, target }));

  // forceCenter는 평균 위치만 재조정할 뿐 퍼짐 자체를 막지 않는다. 대신 약한 forceX/forceY로
  // 중심을 향한 인력("중력")을 줘서, 반발력(charge)이 캔버스 밖으로 계속 퍼지지 않게 막는다.
  const simulation = forceSimulation(nodes)
    .force('charge', forceManyBody().strength(-14).distanceMax(30))
    .force('link', forceLink(links).distance(10).strength(0.7))
    .force('x', forceX(50).strength(0.02))
    .force('y', forceY(50).strength(0.02))
    .force('collide', forceCollide(3.2))
    .stop();

  for (let i = 0; i < 300; i++) simulation.tick();

  // forceX/forceY는 노드 각각을 중심으로 당길 뿐 무리 전체의 무게중심을 보장하지 않는다.
  // 그래프 구조(트리 루트 쏠림 등)에 따라 뭉치가 캔버스 중앙에서 벗어날 수 있어, 마지막에
  // 무게중심을 (50, 50)으로 그대로 옮겨 SVG 안에서 항상 가운데 놓이게 한다.
  const centroidX = nodes.reduce((sum, n) => sum + (n.x ?? 50), 0) / nodeCount;
  const centroidY = nodes.reduce((sum, n) => sum + (n.y ?? 50), 0) / nodeCount;
  const dx = 50 - centroidX;
  const dy = 50 - centroidY;

  return nodes.map((n) => ({
    x: clamp((n.x ?? 50) + dx, 4, 96),
    y: clamp((n.y ?? 50) + dy, 4, 96),
  }));
}

// 무작위 스패닝 트리(연결성 보장) + 추가 무작위 간선으로 무작위 그래프를 만든다.
export function generateGossipGraph(nodeCount: number, avgDegree: number, seed: number): GossipGraph {
  const rng = mulberry32(seed);
  const adjacency: number[][] = Array.from({ length: nodeCount }, () => []);
  const edgeKeys = new Set<string>();
  const edges: [number, number][] = [];

  function addEdge(a: number, b: number) {
    if (a === b) return;
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push([a, b]);
    adjacency[a].push(b);
    adjacency[b].push(a);
  }

  // 무작위 재귀 트리: 새 노드마다 이미 붙어 있는 노드 중 하나를 무작위로 골라 연결 → 전체가 항상 연결된다.
  for (let i = 1; i < nodeCount; i++) {
    addEdge(i, Math.floor(rng() * i));
  }

  const targetEdges = Math.round((avgDegree * nodeCount) / 2);
  let guard = 0;
  while (edges.length < targetEdges && guard < targetEdges * 20) {
    guard++;
    addEdge(Math.floor(rng() * nodeCount), Math.floor(rng() * nodeCount));
  }

  const positions = layoutWithForce(nodeCount, edges, rng);

  return { adjacency, edges, positions };
}

// 그래프 위에서 origin으로부터 각 노드까지의 최단 홉 수(BFS).
export function graphHopDistances(adjacency: number[][], origin: number): number[] {
  const dist = new Array(adjacency.length).fill(-1);
  dist[origin] = 0;
  const queue = [origin];
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    for (const v of adjacency[u]) {
      if (dist[v] !== -1) continue;
      dist[v] = dist[u] + 1;
      queue.push(v);
    }
  }
  return dist;
}

export function maxHops(dist: number[]): number {
  return Math.max(...dist);
}

// BIP125 규칙을 가르치기 좋게 단순화한 RBF(수수료 대체) 판정.
// 실제 규칙(더 낮은 시퀀스 번호, 상속 tx 제한 등)은 생략하고 "수수료" 조건만 본다:
// 대체 tx는 (1) 절대 수수료가 원본보다 커야 하고, (2) 늘어난 수수료가 최소 릴레이
// 수수료율(minRelayRate) × 대체 tx 크기 이상이어야 한다(네트워크에 다시 뿌리는 비용을 낸다).
export function canReplaceByFee(
  oldFeeSats: number,
  newFeeSats: number,
  newVBytes: number,
  minRelayRate: number,
): { accepted: boolean; feeDelta: number; requiredDelta: number } {
  const feeDelta = newFeeSats - oldFeeSats;
  const requiredDelta = minRelayRate * newVBytes;
  return { accepted: feeDelta > 0 && feeDelta >= requiredDelta, feeDelta, requiredDelta };
}

// IBD(초기 블록 동기화) 개념 수치. 헤더는 80바이트 고정, 블록은 평균 크기로 근사.
export const HEADER_BYTES = 80;
export const AVG_BLOCK_BYTES = 1_500_000; // 최근 블록 평균 크기 근사(1.5MB, SegWit 할인 반영 후 체감치)
export const TOTAL_BLOCKS_APPROX = 900_000; // 2026년 중반 기준 근사 블록 높이

export function headersBytes(blocks: number): number {
  return blocks * HEADER_BYTES;
}

export function blocksBytes(blocks: number): number {
  return blocks * AVG_BLOCK_BYTES;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(1)}TB`;
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)}GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)}MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)}KB`;
  return `${bytes}B`;
}
