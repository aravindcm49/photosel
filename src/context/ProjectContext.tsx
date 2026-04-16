import { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react';
import type { Project, PhotoData, PhotoStatus } from '@/types';
import { saveProject } from '@/lib/db';
import { countReviewed } from '@/lib/image-utils';

interface ProjectContextType {
  project: Project;
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  totalPhotos: number;
  photoNames: string[];
  currentPhoto: PhotoData | null;
  viewedCount: number;
  selectedCount: number;
  skippedCount: number;
  markPhoto: (status: PhotoStatus) => void;
  rotatePhoto: () => void;
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const photoNames = Object.keys(project.photos).sort();
  const totalPhotos = photoNames.length;
  const currentPhotoName = photoNames[currentIndex] ?? null;
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
    if (currentIndex < totalPhotos - 1) {
      setCurrentIndex(currentIndex + 1);
      return true;
    }
    return false;
  }, [currentIndex, totalPhotos]);

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
    photoNames,
    currentPhoto,
    viewedCount,
    selectedCount,
    skippedCount,
    markPhoto,
    rotatePhoto,
    tagPeople,
    goToNext,
    goToPrevious,
    flushSave,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
