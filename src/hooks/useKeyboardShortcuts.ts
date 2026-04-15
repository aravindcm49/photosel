import { useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';

export function useKeyboardShortcuts(isInputFocused: boolean, onTagFocus?: () => void) {
  const { goToNext, goToPrevious, markPhoto, rotatePhoto } = useProject();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip shortcuts when input is focused (except Escape)
      if (isInputFocused) {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement)?.blur();
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
  }, [isInputFocused, goToNext, goToPrevious, markPhoto, rotatePhoto, onTagFocus]);
}