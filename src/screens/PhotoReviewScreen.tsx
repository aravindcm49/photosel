import { useProject, ProjectProvider } from '@/context/ProjectContext';
import { PhotoViewer } from '@/components/PhotoViewer';
import { ActionBar, type ActionBarRef } from '@/components/ActionBar';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { RotateButton } from '@/components/RotateButton';
import { NavigationBar } from '@/components/NavigationBar';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { getImageFilesFromDirectory } from '@/lib/file-system';
import type { Project } from '@/types';
import { useEffect, useState, useRef, useCallback } from 'react';

type PendingNavigation = 'next' | 'previous' | null;

interface PhotoReviewScreenProps {
  project: Project;
  dirHandle: FileSystemDirectoryHandle | null;
  onBack: () => void;
  onComplete: (project: Project) => void;
}

export function PhotoReviewScreen({ project, dirHandle, onBack, onComplete }: PhotoReviewScreenProps) {
  const [fileHandles, setFileHandles] = useState<FileSystemFileHandle[]>([]);
  const [loading, setLoading] = useState(!!dirHandle);

  useEffect(() => {
    if (!dirHandle) {
      setLoading(false);
      return;
    }

    const handle = dirHandle;

    async function loadFiles() {
      try {
        const handles = await getImageFilesFromDirectory(handle);
        setFileHandles(handles);
      } catch {
        // Error handled by caller
      } finally {
        setLoading(false);
      }
    }

    loadFiles();
  }, [dirHandle]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading photos...</p>
      </div>
    );
  }

  return (
    <ProjectProvider initialProject={project} dirHandle={dirHandle}>
      <PhotoReviewContent
        fileHandles={fileHandles}
        onBack={onBack}
        onComplete={onComplete}
      />
    </ProjectProvider>
  );
}

function PhotoReviewContent({
  fileHandles,
  onBack,
  onComplete,
}: {
  fileHandles: FileSystemFileHandle[];
  onBack: () => void;
  onComplete: (project: Project) => void;
}) {
  const { project, currentIndex, totalPhotos, goToNext, goToPrevious } = useProject();
  const currentFileHandle = fileHandles[currentIndex] ?? null;
  const photoNames = Object.keys(project.photos).sort();
  const currentPhotoName = photoNames[currentIndex] ?? '';
  const currentPhoto = project.photos[currentPhotoName];

  const actionBarRef = useRef<ActionBarRef>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation>(null);

  const checkAndNavigate = useCallback((direction: 'next' | 'previous') => {
    const hasUncommitted = actionBarRef.current?.hasUncommittedTags() ?? false;
    if (hasUncommitted) {
      setPendingNavigation(direction);
      setShowConfirmDialog(true);
    } else {
      if (direction === 'next') {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  }, [goToNext, goToPrevious]);

  const handleConfirmDiscard = useCallback(() => {
    actionBarRef.current?.clearUncommitted();
    setShowConfirmDialog(false);
    if (pendingNavigation === 'next') {
      goToNext();
    } else if (pendingNavigation === 'previous') {
      goToPrevious();
    }
    setPendingNavigation(null);
  }, [pendingNavigation, goToNext, goToPrevious]);

  const handleCancelDiscard = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingNavigation(null);
    // Re-focus the tag input
    actionBarRef.current?.focusTagInput();
  }, []);

  // Enable keyboard shortcuts
  useKeyboardShortcuts({
    isInputFocused,
    onNavigateNext: isInputFocused ? () => checkAndNavigate('next') : undefined,
    onNavigatePrevious: isInputFocused ? () => checkAndNavigate('previous') : undefined,
  });

  useEffect(() => {
    if (project.reviewedCount === totalPhotos && totalPhotos > 0) {
      onComplete(project);
    }
  }, [project.reviewedCount, totalPhotos, project, onComplete]);

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <ProgressIndicator />
        </div>
        <span className="font-medium">{project.folderName}</span>
      </header>

      {/* Photo area */}
      <div className="relative flex-1 bg-black">
        <PhotoViewer
          fileName={currentPhotoName}
          fileHandle={currentFileHandle}
          aspectRatio={(project as Project & { aspectRatio?: number }).aspectRatio ?? 0.75}
          rotation={currentPhoto?.rotation ?? 0}
          allFileHandles={fileHandles}
          currentIndex={currentIndex}
        />

        {/* Rotate button - top left */}
        <RotateButton />

        {/* Status badge - top right */}
        <div className="absolute right-3 top-3">
          <StatusBadge />
        </div>
      </div>

      {/* Navigation */}
      <NavigationBar
        onPrevious={() => checkAndNavigate('previous')}
        onNext={() => checkAndNavigate('next')}
      />

      {/* Action bar */}
      <ActionBar ref={actionBarRef} onTagInputFocusChange={setIsInputFocused} />

      {/* Confirmation dialog */}
      {showConfirmDialog && (
        <ConfirmDialog
          message="You have uncommitted tags. Discard?"
          onConfirm={handleConfirmDiscard}
          onCancel={handleCancelDiscard}
        />
      )}
    </div>
  );
}