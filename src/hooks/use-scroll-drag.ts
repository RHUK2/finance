"use client";

import { useEffect, useRef, useState } from "react";

export function useScrollDrag() {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({
    active: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });
  const [mask, setMask] = useState<"none" | "left" | "right" | "both">("none");

  const updateMask = () => {
    const el = ref.current;
    if (!el) return;
    const canLeft = el.scrollLeft > 0;
    const canRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    if (canLeft && canRight) setMask("both");
    else if (canLeft) setMask("left");
    else if (canRight) setMask("right");
    else setMask("none");
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    updateMask();
    el.addEventListener("scroll", updateMask, { passive: true });
    const ro = new ResizeObserver(updateMask);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateMask);
      ro.disconnect();
    };
  }, []);

  const handlers = {
    onMouseDown: (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      drag.current = {
        active: true,
        startX: e.pageX - el.offsetLeft,
        scrollLeft: el.scrollLeft,
        moved: false,
      };
    },
    onMouseMove: (e: React.MouseEvent) => {
      if (!drag.current.active) return;
      e.preventDefault();
      const el = ref.current;
      if (!el) return;
      const walk = e.pageX - el.offsetLeft - drag.current.startX;
      if (Math.abs(walk) > 4) drag.current.moved = true;
      el.scrollLeft = drag.current.scrollLeft - walk;
    },
    onMouseUp: () => {
      drag.current.active = false;
    },
    onMouseLeave: () => {
      drag.current.active = false;
    },
    onClickCapture: (e: React.MouseEvent) => {
      if (drag.current.moved) {
        e.stopPropagation();
        drag.current.moved = false;
      }
    },
  };

  const maskStyle: React.CSSProperties = {
    maskImage:
      mask === "both"
        ? "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)"
        : mask === "left"
          ? "linear-gradient(to right, transparent 0%, black 5%)"
          : mask === "right"
            ? "linear-gradient(to right, black 95%, transparent 100%)"
            : undefined,
  };

  return { ref, handlers, maskStyle };
}
