"use client";

import { Button } from "@/components/ui/button";
import { ChevronUp, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

function scrollToTop(duration = 300) {
  const start = window.scrollY;
  const startTime = performance.now();
  function step(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    window.scrollTo(0, start * (1 - ease));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

type Props = {
  children: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function PageMain({ children, onRefresh, isRefreshing }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="min-h-dvh p-4 sm:p-6 md:p-8 lg:p-10">
      {children}
      <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
        {visible && (
          <Button
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full shadow-md"
            onClick={() => scrollToTop()}
          >
            <ChevronUp className="size-6" />
          </Button>
        )}
        {onRefresh && (
          <Button
            size="icon"
            variant="outline"
            className="h-12 w-12 rounded-full shadow-md"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`size-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        )}
      </div>
    </main>
  );
}
