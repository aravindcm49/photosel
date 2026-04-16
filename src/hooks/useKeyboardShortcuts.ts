import { useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';

interface KeyboardShortcutOptions {
  isInputFocused: boolean;
  onTagFocus?: () => void;
  onTagCommit?: () => void;
}

export function useKeyboardShortcuts({
  isInputFocused,
  onTagFocus,
  onTagCommit,
}: KeyboardShortcutOptions) {
  const { goToNext, goToPrevious, markAndAdvance, rotateLeft, rotateRight } = useProject();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // When input is focused, ignore all shortcuts except Escape to blur
      if (isInputFocused) {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement)?.blur();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
        case 'h':
        case 'H':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
        case 'l':
        case 'L':
          e.preventDefault();
          goToNext();
          break;
        case 's':
        case 'S':
          onTagCommit?.();
          markAndAdvance('skipped');
          break;
        case 'a':
        case 'A':
          onTagCommit?.();
          markAndAdvance('selected');
          break;
        case 'j':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            rotateLeft();
          }
          break;
        case 'k':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            rotateRight();
          }
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
  }, [isInputFocused, goToNext, goToPrevious, markAndAdvance, rotateLeft, rotateRight, onTagFocus, onTagCommit]);
}