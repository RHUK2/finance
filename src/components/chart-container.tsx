"use client";

import { RotateCcw } from "lucide-react";
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
    if (!active || !isTouch) return;

    function handleTouchStart(e: TouchEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setActive(false);
      }
    }

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    return () => document.removeEventListener("touchstart", handleTouchStart);
  }, [active, isTouch]);

  const resetButton = onReset && (
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-2 left-2 z-10 h-6 w-6 bg-background/60 backdrop-blur-sm hover:bg-background/80"
      onClick={onReset}
    >
      <RotateCcw className="h-3 w-3" />
    </Button>
  );

  if (!isTouch) {
    return (
      <div className="relative overflow-hidden border-y">
        <div ref={containerRef} />
        {resetButton}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative overflow-hidden border-y">
      <div ref={containerRef} />
      {resetButton}
      {!active && (
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => setActive(true)}
        >
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs whitespace-nowrap text-white/60">
            탭하여 차트 조작
          </div>
        </div>
      )}
    </div>
  );
}
