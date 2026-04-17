import { createContext, useContext, useCallback, useState, useRef, useEffect, useMemo } from 'react';
import type { Project, PhotoData, PhotoStatus } from '@/types';
import { saveProject } from '@/lib/db';
import { countReviewed } from '@/lib/image-utils';

export type PhotoFilter = 'all' | 'selected' | 'skipped';

export const FILTERS: PhotoFilter[] = ['all', 'selected', 'skipped'];

interface ProjectContextType {
  project: Project;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  totalPhotos: number;
  filteredCount: number;
  photoNames: string[];
  filteredPhotoNames: string[];
  currentPhoto: PhotoData | null;
  viewedCount: number;
  selectedCount: number;
  skippedCount: number;
  filter: PhotoFilter;
  setFilter: (filter: PhotoFilter) => void;
  markPhoto: (status: PhotoStatus) => void;
  markAndAdvance: (status: PhotoStatus) => void;
  rotatePhoto: () => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  tagPeople: (people: string[]) => void;
  goToNext: () => boolean;
  goToPrevious: () => void;
  goToIndex: (index: number) => void;
  flushSave: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
}

interface ProjectProviderProps {
  initialProject: Project;
  shouldResume?: boolean;
  children: React.ReactNode;
}

export function ProjectProvider({ initialProject, shouldResume, children }: ProjectProviderProps) {
  // Normalize the project to always have lastVisitedPhoto and lastActiveFilter
  const normalizedProject = useMemo(() => {
    const defaults: Record<'all' | 'selected' | 'skipped', string | null> = {
      all: null,
      selected: null,
      skipped: null,
    };
    return {
      ...initialProject,
      lastVisitedPhoto: { ...defaults, ...initialProject.lastVisitedPhoto },
      lastActiveFilter: initialProject.lastActiveFilter ?? 'all',
    };
  }, [initialProject]);

  const [project, setProject] = useState<Project>(normalizedProject);
  const [filter, setFilterState] = useState<PhotoFilter>(
    shouldResume ? normalizedProject.lastActiveFilter : 'all'
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVisitedDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const photoNames = useMemo(() => Object.keys(project.photos).sort(), [project.photos]);
  const totalPhotos = photoNames.length;

  const filteredPhotoNames = useMemo(() => {
    if (filter === 'all') return photoNames;
    return photoNames.filter(name => project.photos[name].status === filter);
  }, [filter, photoNames, project.photos]);

  const filteredCount = filteredPhotoNames.length;

  // Compute initial index on first render when resuming
  const getInitialIndex = useCallback((): number => {
    if (!shouldResume) return 0;
    const savedPhoto = normalizedProject.lastVisitedPhoto[normalizedProject.lastActiveFilter];
    if (!savedPhoto) return 0;
    const names = filter === 'all' ? photoNames : photoNames.filter(n => project.photos[n].status === filter);
    const idx = names.indexOf(savedPhoto);
    return idx >= 0 ? idx : 0;
  }, [shouldResume, normalizedProject, filter, photoNames, project.photos]);

  const [currentIndex, setCurrentIndex] = useState(getInitialIndex());

  const persistProject = useCallback((updatedProject: Project) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(async () => {
      try {
        await saveProject(updatedProject);
      } catch {
        // Silently fail - will be retried on next action
      }
    }, 500);
  }, []);

  // Debounced save of lastVisitedPhoto per filter (2s after last navigation)
  const trackLastVisitedPhoto = useCallback(
    (currentFilter: PhotoFilter, currentPhotoName: string | null) => {
      if (!currentPhotoName) return;
      if (lastVisitedDebounceRef.current) {
        clearTimeout(lastVisitedDebounceRef.current);
      }
      lastVisitedDebounceRef.current = setTimeout(() => {
        const photoName = currentPhotoName;
        const f = currentFilter;
        setProject((prev) => {
          const updated = {
            ...prev,
            lastVisitedPhoto: {
              all: prev.lastVisitedPhoto?.all ?? null,
              selected: prev.lastVisitedPhoto?.selected ?? null,
              skipped: prev.lastVisitedPhoto?.skipped ?? null,
              [f]: photoName,
            },
            updatedAt: Date.now(),
          };
          return updated;
        });
        saveProject({
          ...project,
          lastVisitedPhoto: {
            all: project.lastVisitedPhoto?.all ?? null,
            selected: project.lastVisitedPhoto?.selected ?? null,
            skipped: project.lastVisitedPhoto?.skipped ?? null,
            [f]: photoName,
          },
        }).catch(() => {});
      }, 2000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Restore to last visited position when filter changes
  const setFilter = useCallback((newFilter: PhotoFilter) => {
    setFilterState(newFilter);
    setProject((prev) => {
      const savedPhoto = prev.lastVisitedPhoto?.[newFilter];
      const names = newFilter === 'all'
        ? Object.keys(prev.photos).sort()
        : Object.keys(prev.photos).sort().filter(n => prev.photos[n].status === newFilter);
      const restoreIndex = savedPhoto && names.includes(savedPhoto) ? names.indexOf(savedPhoto) : 0;
      setCurrentIndex(restoreIndex);
      const updated = {
        ...prev,
        lastActiveFilter: newFilter,
        updatedAt: Date.now(),
      };
      persistProject(updated);
      return updated;
    });
  }, [persistProject]);

  // Clamp currentIndex when filtered list shrinks (e.g., photo status change removes it from filter)
  useEffect(() => {
    if (currentIndex >= filteredCount && filteredCount > 0) {
      setCurrentIndex(filteredCount - 1);
    } else if (filteredCount === 0 && currentIndex !== 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, filteredCount]);

  const currentPhotoName = filteredPhotoNames[currentIndex] ?? null;
  const currentPhoto = currentPhotoName ? project.photos[currentPhotoName] : null;
  const viewedCount = countReviewed(project.photos);
  const selectedCount = Object.values(project.photos).filter((p) => p.status === 'selected').length;
  const skippedCount = Object.values(project.photos).filter((p) => p.status === 'skipped').length;

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (lastVisitedDebounceRef.current) {
        clearTimeout(lastVisitedDebounceRef.current);
      }
    };
  }, []);

  const markPhoto = useCallback(
    (status: PhotoStatus) => {
      if (!currentPhotoName) return;

      setProject((prev) => {
        const updated = {
          ...prev,
          photos: {
            ...prev.photos,
            [currentPhotoName]: {
              ...prev.photos[currentPhotoName],
              status,
              timestamp: Date.now(),
            },
          },
          reviewedCount: 0, // Will be recalculated
          updatedAt: Date.now(),
        };
        updated.reviewedCount = countReviewed(updated.photos);
        persistProject(updated);
        return updated;
      });
    },
    [currentPhotoName, persistProject]
  );

  // Mark photo and auto-advance, filter-aware
  const markAndAdvance = useCallback(
    (status: PhotoStatus) => {
      if (!currentPhotoName) return;

      setProject((prev) => {
        const updated = {
          ...prev,
          photos: {
            ...prev.photos,
            [currentPhotoName]: {
              ...prev.photos[currentPhotoName],
              status,
              timestamp: Date.now(),
            },
          },
          reviewedCount: 0,
          updatedAt: Date.now(),
        };
        updated.reviewedCount = countReviewed(updated.photos);
        persistProject(updated);
        return updated;
      });

      // Handle navigation based on filter
      if (filter === 'all' || status === filter) {
        // Photo stays in (or already matches) the current filter - advance normally
        if (currentIndex < filteredCount - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      } else {
        // Photo leaves the current filter - list will shrink, same index now points to next photo
        // But if we were at or past the last photo, go to the new last
        if (currentIndex >= filteredCount - 1) {
          setCurrentIndex(Math.max(0, filteredCount - 2));
        }
        // Otherwise keep same index (auto-advances because list shrinks)
      }
    },
    [currentPhotoName, filter, currentIndex, filteredCount, persistProject]
  );

  const rotatePhoto = useCallback(() => {
    if (!currentPhotoName) return;

    setProject((prev) => {
      const photo = prev.photos[currentPhotoName];
      const rotations: number[] = [0, 90, 180, 270];
      const currentIdx = rotations.indexOf(photo.rotation);
      const nextRotation = rotations[(currentIdx + 1) % 4] as 0 | 90 | 180 | 270;

      const updated = {
        ...prev,
        photos: {
          ...prev.photos,
          [currentPhotoName]: {
            ...photo,
            rotation: nextRotation,
          },
        },
        updatedAt: Date.now(),
      };
      persistProject(updated);
      return updated;
    });
  }, [currentPhotoName, persistProject]);

  const rotateRight = useCallback(() => {
    if (!currentPhotoName) return;

    setProject((prev) => {
      const photo = prev.photos[currentPhotoName];
      const rotations: number[] = [0, 90, 180, 270];
      const currentIdx = rotations.indexOf(photo.rotation);
      const nextRotation = rotations[(currentIdx + 1) % 4] as 0 | 90 | 180 | 270;

      const updated = {
        ...prev,
        photos: {
          ...prev.photos,
          [currentPhotoName]: {
            ...photo,
            rotation: nextRotation,
          },
        },
        updatedAt: Date.now(),
      };
      persistProject(updated);
      return updated;
    });
  }, [currentPhotoName, persistProject]);

  const rotateLeft = useCallback(() => {
    if (!currentPhotoName) return;

    setProject((prev) => {
      const photo = prev.photos[currentPhotoName];
      const rotations: number[] = [0, 90, 180, 270];
      const currentIdx = rotations.indexOf(photo.rotation);
      const prevRotation = rotations[(currentIdx + 3) % 4] as 0 | 90 | 180 | 270;

      const updated = {
        ...prev,
        photos: {
          ...prev.photos,
          [currentPhotoName]: {
            ...photo,
            rotation: prevRotation,
          },
        },
        updatedAt: Date.now(),
      };
      persistProject(updated);
      return updated;
    });
  }, [currentPhotoName, persistProject]);

  const tagPeople = useCallback(
    (people: string[]) => {
      if (!currentPhotoName) return;

      setProject((prev) => {
        const updated = {
          ...prev,
          photos: {
            ...prev.photos,
            [currentPhotoName]: {
              ...prev.photos[currentPhotoName],
              people,
              timestamp: Date.now(),
            },
          },
          updatedAt: Date.now(),
        };
        persistProject(updated);
        return updated;
      });
    },
    [currentPhotoName, persistProject]
  );

  const flushSave = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    try {
      await saveProject(project);
    } catch {
      // Silently fail
    }
  }, [project]);

  const goToNext = useCallback(() => {
    if (currentIndex < filteredCount - 1) {
      setCurrentIndex(currentIndex + 1);
      return true;
    }
    return false;
  }, [currentIndex, filteredCount]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < filteredCount) {
      setCurrentIndex(index);
    }
  }, [filteredCount]);

  // Track last visited photo on navigation (debounced)
  useEffect(() => {
    trackLastVisitedPhoto(filter, currentPhotoName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const value: ProjectContextType = {
    project,
    currentIndex,
    setCurrentIndex,
    totalPhotos,
    filteredCount,
    photoNames,
    filteredPhotoNames,
    currentPhoto,
    viewedCount,
    selectedCount,
    skippedCount,
    filter,
    setFilter,
    markPhoto,
    markAndAdvance,
    rotatePhoto,
    rotateLeft,
    rotateRight,
    tagPeople,
    goToNext,
    goToPrevious,
    goToIndex,
    flushSave,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
