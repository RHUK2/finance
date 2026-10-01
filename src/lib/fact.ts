// 화면에 쓰는 정책·통계·사건 수치는 값과 기준 시점·출처를 한 객체에 묶어 단일 출처로 둔다.
// 기준 없는 수치는 몇 달 뒤 조용히 틀린 문서가 된다. 여러 페이지가 같은 모양을 쓰므로 여기 한 번만 정의한다.
export type Fact = { value: number; label: string; asOf: string; source: string };
