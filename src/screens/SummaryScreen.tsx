import { Button } from '@/components/ui/button';
import { exportProject } from '@/lib/export';
import type { Project } from '@/types';

interface SummaryScreenProps {
  project: Project;
  onBackToHome: () => void;
}

export function SummaryScreen({ project, onBackToHome }: SummaryScreenProps) {
  const selectedCount = Object.values(project.photos).filter(
    (p) => p.status === 'selected'
  ).length;
  const skippedCount = Object.values(project.photos).filter(
    (p) => p.status === 'skipped'
  ).length;

  const handleExport = () => {
    exportProject(project);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-3xl font-bold">{project.folderName}</h1>
      <h2 className="text-xl font-medium">Review Complete!</h2>

      <div className="flex gap-8">
        <div className="text-center">
          <div className={`text-4xl font-bold ${selectedCount === 0 ? 'text-muted-foreground' : 'text-green-600'}`}>
            {selectedCount}
          </div>
          <div className={`text-sm ${selectedCount === 0 ? 'text-muted-foreground' : 'text-green-600'}`}>
            selected
          </div>
        </div>
        <div className="text-center">
          <div className={`text-4xl font-bold ${skippedCount === 0 ? 'text-muted-foreground' : 'text-red-600'}`}>
            {skippedCount}
          </div>
          <div className={`text-sm ${skippedCount === 0 ? 'text-muted-foreground' : 'text-red-600'}`}>
            skipped
          </div>
        </div>
      </div>

      <Button onClick={handleExport} size="lg">
        Export Selected.txt & Skipped.txt
      </Button>

      <Button variant="outline" onClick={onBackToHome}>
        Back to Home
      </Button>
    </div>
  );
}