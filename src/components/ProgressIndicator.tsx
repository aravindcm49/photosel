import { useProject } from '@/context/ProjectContext';

export function ProgressIndicator() {
  const { project } = useProject();
  const reviewed = project.reviewedCount;
  const total = project.totalPhotos;

  return (
    <span className="text-sm text-muted-foreground">
      {reviewed}/{total} reviewed
    </span>
  );
}