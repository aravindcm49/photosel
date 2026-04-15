import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FolderCard } from '@/components/FolderCard';
import { FolderOpen } from 'lucide-react';
import { getAllProjects, deleteProject, saveProject, getProject } from '@/lib/db';
import {
  getDirectoryHandle,
  getImageFilesFromDirectory,
  analyzeAspectRatio,
  getSupportedExtensions,
} from '@/lib/file-system';
import { createDefaultPhotoData, countReviewed } from '@/lib/image-utils';
import type { Project } from '@/types';
import { toast } from 'sonner';

interface HomeScreenProps {
  onOpenProject: (project: Project, dirHandle: FileSystemDirectoryHandle) => void;
  onResumeProject: (project: Project, dirHandle: FileSystemDirectoryHandle) => void;
}

export function HomeScreen({ onOpenProject, onResumeProject }: HomeScreenProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const all = await getAllProjects();
      setProjects(all);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleOpenFolder = useCallback(async () => {
    setOpening(true);
    try {
      const dirHandle = await getDirectoryHandle();
      if (!dirHandle) {
        setOpening(false);
        return;
      }

      const imageFiles = await getImageFilesFromDirectory(dirHandle);
      if (imageFiles.length === 0) {
        toast.error(
          `No supported images found. Supported formats: ${getSupportedExtensions().join(', ')}`
        );
        setOpening(false);
        return;
      }

      const aspectRatio = await analyzeAspectRatio(dirHandle);

      const photos: Record<string, ReturnType<typeof createDefaultPhotoData>> = {};
      for (const fileHandle of imageFiles) {
        photos[fileHandle.name] = createDefaultPhotoData(fileHandle.name);
      }

      const project: Project = {
        folderName: dirHandle.name,
        totalPhotos: imageFiles.length,
        reviewedCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        photos,
      };

      (project as Project & { aspectRatio: number }).aspectRatio = aspectRatio;

      await saveProject(project);
      await loadProjects();
      onOpenProject(project, dirHandle);
    } catch {
      toast.error('Failed to open folder. Permission may have been denied.');
    } finally {
      setOpening(false);
    }
  }, [onOpenProject, loadProjects]);

  const handleDelete = useCallback(
    async (folderName: string) => {
      try {
        await deleteProject(folderName);
        await loadProjects();
        toast.success(`Deleted project: ${folderName}`);
      } catch {
        toast.error('Failed to delete project');
      }
    },
    [loadProjects]
  );

  const handleResume = useCallback(
    async (project: Project) => {
      try {
        const dirHandle = await getDirectoryHandle();
        if (!dirHandle) {
          toast.error('Permission required to access folder. Please select the folder again.');
          return;
        }

        // Verify the folder name matches
        if (dirHandle.name !== project.folderName) {
          // Update the project with the new folder handle anyway - user may have renamed
        }

        // Reload project from IndexedDB to get latest state
        const latestProject = await getProject(project.folderName);
        if (latestProject) {
          onResumeProject(latestProject, dirHandle);
        } else {
          toast.error('Project not found in database.');
        }
      } catch {
        toast.error('Failed to resume project. Permission may have been denied.');
      }
    },
    [onResumeProject]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Wedding Photo Selector</h1>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="rounded-full bg-muted p-6">
            <FolderOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-medium">No projects yet</h2>
          <p className="text-sm text-muted-foreground">
            Open a folder of photos to start reviewing
          </p>
          <Button onClick={handleOpenFolder} disabled={opening} size="lg">
            <FolderOpen className="mr-2 h-5 w-5" />
            {opening ? 'Opening...' : 'Open Folder'}
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Your Projects</h2>
            <Button onClick={handleOpenFolder} disabled={opening}>
              <FolderOpen className="mr-2 h-4 w-4" />
              {opening ? 'Opening...' : 'Open Folder'}
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            {projects.map((project) => (
              <FolderCard
                key={project.folderName}
                project={{
                  ...project,
                  reviewedCount: countReviewed(project.photos),
                }}
                onResume={handleResume}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}