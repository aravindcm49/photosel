import { useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';

interface KeyboardShortcutOptions {
  isInputFocused: boolean;
  onTagFocus?: () => void;
  onNavigateNext?: () => void;
  onNavigatePrevious?: () => void;
}

export function useKeyboardShortcuts({
  isInputFocused,
  onTagFocus,
  onNavigateNext,
  onNavigatePrevious,
}: KeyboardShortcutOptions) {
  const { goToNext, goToPrevious, markPhoto, rotatePhoto } = useProject();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // When input is focused, only handle specific navigation keys and Escape
      if (isInputFocused) {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement)?.blur();
        }
        // Handle arrow keys for navigation with potential confirmation
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (onNavigateNext) {
            onNavigateNext();
          } else {
            goToNext();
          }
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (onNavigatePrevious) {
            onNavigatePrevious();
          } else {
            goToPrevious();
          }
          return;
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 's':
        case 'S':
          markPhoto('skipped');
          goToNext();
          break;
        case 'a':
        case 'A':
          markPhoto('selected');
          goToNext();
          break;
        case 'r':
        case 'R':
          rotatePhoto();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          onTagFocus?.();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInputFocused, goToNext, goToPrevious, markPhoto, rotatePhoto, onTagFocus, onNavigateNext, onNavigatePrevious]);
}