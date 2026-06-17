"use client";

import { MousePointer2, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onReset?: () => void;
};

export function ChartContainer({ containerRef, onReset }: Props) {
  const [isTouch, setIsTouch] = useState(false);
  const [active, setActive] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    if (!active) return;

    const eventType = isTouch ? "touchstart" : "mousedown";

    function handleOutside(e: Event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setActive(false);
      }
    }

    document.addEventListener(eventType, handleOutside, { passive: true });
    return () => document.removeEventListener(eventType, handleOutside);
  }, [active, isTouch]);

  const resetButton = onReset && (
    <Button
      variant="ghost"
      size="icon"
      className="bg-background/60 hover:bg-background/80 absolute top-2 left-2 z-10 h-6 w-6 backdrop-blur-sm"
      onClick={onReset}
    >
      <RotateCcw className="h-3 w-3" />
    </Button>
  );

  return (
    <div ref={wrapperRef} className="relative overflow-hidden border-y">
      <div ref={containerRef} />
      {resetButton}
      {!active && (
        <div
          className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/20 backdrop-blur-[1px] transition-opacity"
          onClick={() => setActive(true)}
        >
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-white/20 bg-black/50 px-5 py-3 text-white/80 backdrop-blur-sm">
            <MousePointer2 className="h-4 w-4" />
            <span className="text-xs font-medium">
              {isTouch ? "탭하여 차트 조작" : "클릭하여 차트 조작"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
