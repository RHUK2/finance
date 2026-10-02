// 검증·해독 탭이 함께 쓰는 계산 한 줄: 식 이름, 대입한 값, 그 값이 무엇인지.
// 두 탭이 같은 모양으로 읽혀야 하므로 한 곳에 둔다.
export function CalcLine({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className='flex flex-col rounded-md border px-3 py-2'>
      <div className='flex flex-wrap items-baseline justify-between gap-x-3'>
        <span className='text-sm font-medium'>{label}</span>
        <span className='text-sm tabular-nums'>{value}</span>
      </div>
      <span className='text-xs text-muted-foreground'>{note}</span>
    </div>
  );
}
