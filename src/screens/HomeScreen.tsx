import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderCard } from '@/components/FolderCard';
import { FolderOpen } from 'lucide-react';
import { getAllProjects, deleteProject, saveProject, getProject } from '@/lib/db';
import { createDefaultPhotoData, countReviewed } from '@/lib/image-utils';
import { getDirectoryHandle } from '@/lib/file-system';
import type { Project } from '@/types';
import { toast } from 'sonner';

interface FolderApiResponse {
  folderName: string;
  images: Array<{ name: string; width: number; height: number; size: number }>;
  aspectRatio: number;
}

interface HomeScreenProps {
  onOpenProject: (project: Project) => void;
  onResumeProject: (project: Project, dirHandle: FileSystemDirectoryHandle) => void;
}

export function HomeScreen({ onOpenProject, onResumeProject }: HomeScreenProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [folderPath, setFolderPath] = useState('');

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

  const handleSubmitPath = useCallback(async () => {
    const trimmed = folderPath.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to open folder');
        return;
      }

      const apiResult = data as FolderApiResponse;

      const photos: Record<string, ReturnType<typeof createDefaultPhotoData>> = {};
      for (const img of apiResult.images) {
        photos[img.name] = createDefaultPhotoData(img.name);
      }

      const project: Project = {
        folderName: apiResult.folderName,
        totalPhotos: apiResult.images.length,
        reviewedCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        photos,
        aspectRatio: apiResult.aspectRatio,
      };

      await saveProject(project);
      await loadProjects();
      onOpenProject(project);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to server';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [folderPath, onOpenProject, loadProjects]);

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

        const latestProject = await getProject(project.folderName);
        if (latestProject) {
          onResumeProject(latestProject, dirHandle);
        } else {
          toast.error('Project not found in database.');
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to resume project. Permission may have been denied.';
        toast.error(message);
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
      <h1 className="mb-6 text-center text-2xl font-bold">Photo Selector</h1>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="rounded-full bg-muted p-6">
            <FolderOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-medium">No projects yet</h2>
          <p className="text-sm text-muted-foreground">
            Enter a folder path to start reviewing photos
          </p>
          <div className="flex w-full max-w-md gap-2">
            <Input
              type="text"
              placeholder="/path/to/photos"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmitPath();
              }}
              disabled={submitting}
            />
            <Button onClick={handleSubmitPath} disabled={submitting || !folderPath.trim()}>
              <FolderOpen className="mr-2 h-4 w-4" />
              {submitting ? 'Opening...' : 'Open'}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Your Projects</h2>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="/path/to/photos"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmitPath();
                }}
                disabled={submitting}
                className="w-64"
              />
              <Button onClick={handleSubmitPath} disabled={submitting || !folderPath.trim()}>
                <FolderOpen className="mr-2 h-4 w-4" />
                {submitting ? 'Opening...' : 'Open'}
              </Button>
            </div>
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
