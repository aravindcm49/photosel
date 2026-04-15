import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Play } from 'lucide-react';
import type { Project } from '@/types';

interface FolderCardProps {
  project: Project;
  onResume: (project: Project) => void;
  onDelete: (folderName: string) => void;
}

export function FolderCard({ project, onResume, onDelete }: FolderCardProps) {
  return (
    <Card className="w-full">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{project.folderName}</span>
          <span className="text-sm text-muted-foreground">
            {project.reviewedCount}/{project.totalPhotos} reviewed
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResume(project)}
            aria-label={`Resume ${project.folderName}`}
          >
            <Play className="mr-1 h-4 w-4" />
            Resume
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(project.folderName)}
            aria-label={`Delete ${project.folderName}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}