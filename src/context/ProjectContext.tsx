import { createContext, useContext, useCallback, useState, useRef, useEffect, useMemo } from 'react';
import type { Project, PhotoData, PhotoStatus } from '@/types';
import { saveProject } from '@/lib/db';
import { countReviewed } from '@/lib/image-utils';

export type PhotoFilter = 'all' | 'selected' | 'skipped';

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
  children: React.ReactNode;
}

export function ProjectProvider({ initialProject, children }: ProjectProviderProps) {
  const [project, setProject] = useState<Project>(initialProject);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilterState] = useState<PhotoFilter>('all');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const photoNames = useMemo(() => Object.keys(project.photos).sort(), [project.photos]);
  const totalPhotos = photoNames.length;

  const filteredPhotoNames = useMemo(() => {
    if (filter === 'all') return photoNames;
    return photoNames.filter(name => project.photos[name].status === filter);
  }, [filter, photoNames, project.photos]);

  const filteredCount = filteredPhotoNames.length;

  // Reset to first photo when filter changes
  const setFilter = useCallback((newFilter: PhotoFilter) => {
    setFilterState(newFilter);
    setCurrentIndex(0);
  }, []);

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

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
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
    flushSave,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
