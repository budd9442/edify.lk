import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';

interface ScrollPosition {
  x: number;
  y: number;
}

interface UseScrollPositionOptions {
  throttle?: number;
  element?: HTMLElement | null;
}

export function useScrollPosition(options: UseScrollPositionOptions = {}) {
  const { throttle = 100, element } = options;
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({ x: 0, y: 0 });
  
  const debouncedScrollPosition = useDebounce(scrollPosition, throttle);

  useEffect(() => {
    const targetElement = element || window;
    
    const updateScrollPosition = () => {
      if (element) {
        setScrollPosition({
          x: element.scrollLeft,
          y: element.scrollTop
        });
      } else {
        setScrollPosition({
          x: window.pageXOffset,
          y: window.pageYOffset
        });
      }
    };

    // Set initial position
    updateScrollPosition();

    // Add scroll listener
    targetElement.addEventListener('scroll', updateScrollPosition, { passive: true });

    return () => {
      targetElement.removeEventListener('scroll', updateScrollPosition);
    };
  }, [element]);

  return debouncedScrollPosition;
}

export function useScrollDirection(threshold: number = 10) {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollPosition = useScrollPosition({ throttle: 50 });

  useEffect(() => {
    const currentScrollY = scrollPosition.y;
    
    if (Math.abs(currentScrollY - lastScrollY) < threshold) {
      return;
    }

    setScrollDirection(currentScrollY > lastScrollY ? 'down' : 'up');
    setLastScrollY(currentScrollY);
  }, [scrollPosition.y, lastScrollY, threshold]);

  return scrollDirection;
}

export function useScrollToTop() {
  const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
    window.scrollTo({
      top: 0,
      behavior
    });
  };

  return scrollToTop;
}