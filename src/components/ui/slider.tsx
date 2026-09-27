import { Slider as SliderPrimitive } from '@base-ui/react/slider';
import { cn } from '@/lib/utils';

// 치수는 손끝 기준으로 잡혀 있다. 원래 shadcn 기본값은 손잡이 16px·트랙 6px인데,
// 그 크기로는 모바일에서 조준이 어렵고 빗맞으면 값이 엉뚱한 데로 튄다. 손잡이를 24px로
// 키우고 Control 자체에 44px 높이를 줘서, 트랙 위아래 여백까지 전부 닿는 면이 되게 한다.
// Control에 높이를 주는 대신 손잡이에 가짜 여백을 붙이면, 슬라이더를 여럿 쌓았을 때
// 위아래 슬라이더의 닿는 면이 서로 겹쳐 엉뚱한 줄이 잡힌다.
//
// touch-action이 none이 아니라 pan-y인 것도 같은 이유다. none이면 슬라이더 위에서
// 세로로 넘기려는 손짓까지 슬라이더가 먹어 페이지가 스크롤되지 않는다. pan-y면 가로
// 끌기만 슬라이더가 가져가고 세로는 페이지로 흘러간다.

function Slider({ className, defaultValue, value, min = 0, max = 100, ...props }: SliderPrimitive.Root.Props) {
  const _values = Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max];

  return (
    <SliderPrimitive.Root
      className={cn('data-horizontal:w-full data-vertical:h-full', className)}
      data-slot='slider'
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment='edge'
      {...props}
    >
      <SliderPrimitive.Control className='relative flex w-full touch-pan-y items-center select-none data-disabled:opacity-50 data-horizontal:h-11 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col'>
        <SliderPrimitive.Track
          data-slot='slider-track'
          className='relative grow overflow-hidden rounded-full bg-muted select-none data-horizontal:h-3 data-horizontal:w-full data-vertical:h-full data-vertical:w-3'
        >
          <SliderPrimitive.Indicator
            data-slot='slider-range'
            className='bg-primary select-none data-horizontal:h-full data-vertical:w-full'
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot='slider-thumb'
            key={index}
            className='block size-6 shrink-0 rounded-full border-2 border-primary bg-background shadow-sm ring-ring/50 transition-[color,box-shadow] select-none hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden active:ring-4 disabled:pointer-events-none disabled:opacity-50'
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
