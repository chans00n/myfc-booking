import { useRef, useEffect, useCallback } from "react";

interface TouchHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
}

export function useTouch(
  ref: React.RefObject<HTMLElement>,
  handlers: TouchHandlers,
  options = {
    swipeThreshold: 50,
    longPressDelay: 500,
  }
) {
  const touchState = useRef<TouchState | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const touch = e.touches[0];
      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
      };

      // Start long press timer
      if (handlers.onLongPress) {
        longPressTimer.current = setTimeout(() => {
          handlers.onLongPress?.();
          touchState.current = null; // Prevent tap after long press
        }, options.longPressDelay);
      }
    },
    [handlers, options.longPressDelay]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchState.current) return;

      // Clear long press timer
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = touch.clientY - touchState.current.startY;
      const deltaTime = Date.now() - touchState.current.startTime;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Detect swipe
      if (absX > options.swipeThreshold || absY > options.swipeThreshold) {
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0) {
            handlers.onSwipeRight?.();
          } else {
            handlers.onSwipeLeft?.();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            handlers.onSwipeDown?.();
          } else {
            handlers.onSwipeUp?.();
          }
        }
      } else if (deltaTime < 200) {
        // Tap (quick touch with minimal movement)
        handlers.onTap?.();
      }

      touchState.current = null;
    },
    [handlers, options.swipeThreshold]
  );

  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchState.current = null;
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });
    element.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchCancel);

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, [ref, handleTouchStart, handleTouchEnd, handleTouchCancel]);
}
