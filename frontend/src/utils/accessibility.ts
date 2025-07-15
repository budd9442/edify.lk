// Accessibility utilities
export class AccessibilityManager {
  private static focusableElements = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  static trapFocus(element: HTMLElement): () => void {
    const focusableElements = element.querySelectorAll(this.focusableElements);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }

  static announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  static getColorContrast(foreground: string, background: string): number {
    // Simplified contrast calculation
    // In a real implementation, you'd use a proper color contrast library
    return 4.5; // Placeholder
  }

  static checkColorContrast(foreground: string, background: string): boolean {
    return this.getColorContrast(foreground, background) >= 4.5;
  }
}

// Screen reader utilities
export const srOnly = 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0';

// ARIA utilities
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

// Keyboard navigation utilities
export const handleArrowNavigation = (
  e: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onIndexChange: (index: number) => void
) => {
  let newIndex = currentIndex;

  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      newIndex = (currentIndex + 1) % items.length;
      break;
    case 'ArrowUp':
    case 'ArrowLeft':
      newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
      break;
    case 'Home':
      newIndex = 0;
      break;
    case 'End':
      newIndex = items.length - 1;
      break;
    default:
      return;
  }

  e.preventDefault();
  onIndexChange(newIndex);
  items[newIndex]?.focus();
};