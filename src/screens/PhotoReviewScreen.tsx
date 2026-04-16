import { useProject, ProjectProvider, type PhotoFilter } from '@/context/ProjectContext';
import { PhotoViewer } from '@/components/PhotoViewer';
import { ActionBar, type ActionBarRef } from '@/components/ActionBar';
import { RotateButton } from '@/components/RotateButton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ArrowLeft, ChevronLeft, ChevronRight, Check, X, ClipboardList, Filter } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { Project } from '@/types';
import { useState, useRef, useCallback, useEffect } from 'react';

type PendingNavigation = 'next' | 'previous' | null;

interface PhotoReviewScreenProps {
  project: Project;
  onBack: () => void;
  onComplete: (project: Project) => void;
}

export function PhotoReviewScreen({ project, onBack, onComplete }: PhotoReviewScreenProps) {
  return (
    <ProjectProvider initialProject={project}>
      <PhotoReviewContent
        onBack={onBack}
        onComplete={onComplete}
      />
    </ProjectProvider>
  );
}

function StatusBadge({ status }: { status: 'selected' | 'skipped' | null }) {
  if (status === 'selected') {
    return (
      <div className="flex items-center gap-1 rounded-full bg-green-500/60 px-2 py-0.5 backdrop-blur-sm border border-green-400/50">
        <Check className="h-3 w-3 text-green-200" />
        <span className="text-xs font-medium text-green-100">Selected</span>
      </div>
    );
  }
  if (status === 'skipped') {
    return (
      <div className="flex items-center gap-1 rounded-full bg-red-500/60 px-2 py-0.5 backdrop-blur-sm border border-red-400/50">
        <X className="h-3 w-3 text-red-200" />
        <span className="text-xs font-medium text-red-100">Skipped</span>
      </div>
    );
  }
  return null;
}

function StatsBadge({ selectedCount, skippedCount }: {
  selectedCount: number;
  skippedCount: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex">
        <span className="inline-flex items-center justify-center rounded-full bg-black/60 px-4 h-7 min-w-[4.5rem] text-xs font-medium text-white backdrop-blur-sm border border-white/20 cursor-default">
          <span className="text-green-400">{selectedCount}</span>
          <span className="text-gray-300 mx-1">:</span>
          <span className="text-red-400">{skippedCount}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <span className="text-green-700 font-medium">Selected</span>
        <span className="opacity-60"> : </span>
        <span className="text-red-700 font-medium">Skipped</span>
      </TooltipContent>
    </Tooltip>
  );
}

function FilterCombobox({ value, onChange }: { value: PhotoFilter; onChange: (value: PhotoFilter) => void }) {
  const filterOptions: { value: PhotoFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'selected', label: 'Selected' },
    { value: 'skipped', label: 'Skipped' },
  ];

  return (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value as PhotoFilter)}
        className="appearance-none rounded-full bg-black/60 px-3 h-7 min-w-[6rem] text-xs font-medium text-white backdrop-blur-sm border border-white/20 cursor-pointer hover:bg-black/70 hover:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 8px center',
        }}
      >
        {filterOptions.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-gray-900 text-white">
            {opt.label}
          </option>
        ))}
      </select>
  );
}

function FilteredPositionBadge({ currentIndex, filteredCount }: { currentIndex: number; filteredCount: number }) {
  if (filteredCount === 0) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-black/60 px-2.5 h-7 text-xs font-medium text-white/70 backdrop-blur-sm border border-white/10 cursor-default">
      {currentIndex + 1} / {filteredCount}
    </span>
  );
}

function PhotoReviewContent({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: (project: Project) => void;
}) {
  const {
    project,
    currentIndex,
    filteredCount,
    selectedCount,
    skippedCount,
    currentPhoto,
    filter,
    setFilter,
    filteredPhotoNames,
    goToNext,
    goToPrevious,
    flushSave,
  } = useProject();
  const currentPhotoName = filteredPhotoNames[currentIndex] ?? '';

  const actionBarRef = useRef<ActionBarRef>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation>(null);

  // Bottom bar visibility: hides on idle, shows on activity
  const [bottomBarVisible, setBottomBarVisible] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBottomBar = useCallback(() => {
    setBottomBarVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setBottomBarVisible(false);
    }, 4000);
  }, []);

  // Show bottom bar on any interaction
  useEffect(() => {
    function handleActivity() {
      showBottomBar();
    }
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousedown', handleActivity);

    // Start initial timer
    showBottomBar();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [showBottomBar]);

  // Keep bottom bar visible while input is focused
  useEffect(() => {
    if (isInputFocused) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      setBottomBarVisible(true);
    }
  }, [isInputFocused]);

  const checkAndNavigate = useCallback((direction: 'next' | 'previous') => {
    const hasUncommitted = actionBarRef.current?.hasUncommittedTags() ?? false;
    if (hasUncommitted) {
      setPendingNavigation(direction);
      setShowConfirmDialog(true);
    } else {
      actionBarRef.current?.commitTags();
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
    actionBarRef.current?.focusTagInput();
  }, []);

  // Enable keyboard shortcuts
  useKeyboardShortcuts({
    isInputFocused,
    onTagCommit: () => actionBarRef.current?.commitTags(),
  });

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === filteredCount - 1;

  // Completion: show summary when reaching the last photo — only in 'all' filter
  useEffect(() => {
    if (filter === 'all' && isLast && filteredCount > 0) {
      flushSave().then(() => {
        onComplete(project);
      });
    }
  }, [filter, isLast, filteredCount, project, onComplete, flushSave]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Photo fills viewport — or empty state when no photos match filter */}
      {filteredCount === 0 ? (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <Filter className="mx-auto mb-3 h-10 w-10 text-white/30" />
            <p className="text-lg font-medium text-white/50">No {filter} photos</p>
            <p className="mt-1 text-sm text-white/30">Switch the filter to see photos</p>
          </div>
        </div>
      ) : (
        <PhotoViewer
          folderName={project.folderName}
          photoName={currentPhotoName}
          aspectRatio={project.aspectRatio ?? 0.75}
          rotation={currentPhoto?.rotation ?? 0}
        />
      )}

      {/* Top overlay bar - always visible */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 via-black/40 to-transparent px-4 py-3 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-white hover:bg-white/10 hover:text-white">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <StatsBadge selectedCount={selectedCount} skippedCount={skippedCount} />
          <FilterCombobox value={filter} onChange={setFilter} />
          <FilteredPositionBadge currentIndex={currentIndex} filteredCount={filteredCount} />
        </div>
        <div className="absolute inset-x-0 flex justify-center pointer-events-none">
          <StatusBadge status={currentPhoto?.status ?? null} />
        </div>
        <div className="flex items-center gap-2">
          <RotateButton />
          <Tooltip>
            <TooltipTrigger className="inline-flex">
              <button
                onClick={() => {
                  flushSave().then(() => {
                    onComplete(project);
                  });
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Go to summary"
              >
                <ClipboardList className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Summary</TooltipContent>
          </Tooltip>
          <span className="text-sm font-medium text-white">{project.displayName || project.folderName}</span>
        </div>
      </div>

      {/* Left nav arrow */}
      {!isFirst && (
        <button
          onClick={() => checkAndNavigate('previous')}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white/80 transition-colors hover:bg-black/60 hover:text-white"
          aria-label="Previous photo"
          title="Previous (H / ←)"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Right nav arrow */}
      {!isLast && (
        <button
          onClick={() => checkAndNavigate('next')}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-3 text-white/80 transition-colors hover:bg-black/60 hover:text-white"
          aria-label="Next photo"
          title="Next (L / →)"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Bottom overlay bar - fades on idle */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-4 pb-4 pt-12 z-10 transition-opacity duration-500 ${bottomBarVisible || isInputFocused ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <ActionBar ref={actionBarRef} onTagInputFocusChange={setIsInputFocused} />
      </div>

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
