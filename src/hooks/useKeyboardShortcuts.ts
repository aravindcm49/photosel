import { useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';

export function useKeyboardShortcuts(isInputFocused: boolean) {
  const { goToNext, goToPrevious, markPhoto, rotatePhoto } = useProject();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip shortcuts when input is focused
      if (isInputFocused) return;

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
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInputFocused, goToNext, goToPrevious, markPhoto, rotatePhoto]);
}