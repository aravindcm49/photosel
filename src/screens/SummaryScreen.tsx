import { Button } from '@/components/ui/button';
import { downloadFile, generateSelectedContent, generateSelectedWithTagsContent, generateSkippedContent } from '@/lib/export';
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

  const handleDownloadSelected = () => {
    const content = generateSelectedContent(project);
    downloadFile(content, 'Selected.txt');
  };

  const handleDownloadWithTags = () => {
    const content = generateSelectedWithTagsContent(project);
    downloadFile(content, 'Selected-with-people.txt');
  };

  const handleDownloadSkipped = () => {
    const content = generateSkippedContent(project);
    downloadFile(content, 'Skipped.txt');
  };

  const handleDownloadBoth = () => {
    const selectedContent = generateSelectedContent(project);
    const skippedContent = generateSkippedContent(project);
    downloadFile(selectedContent, 'Selected.txt');
    downloadFile(skippedContent, 'Skipped.txt');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <h1 className="text-3xl font-bold">{project.displayName || project.folderName}</h1>
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

      <div className="flex flex-col items-center gap-3">
        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
          <Button onClick={handleDownloadSelected} className="w-full">
            Download Selected
          </Button>
          <Button onClick={handleDownloadWithTags} className="w-full">
            Download with Tags
          </Button>
          <Button onClick={handleDownloadSkipped} className="w-full" variant="outline">
            Download Skipped
          </Button>
          <Button onClick={handleDownloadBoth} className="w-full" variant="outline">
            Download Both
          </Button>
        </div>
      </div>

      <Button variant="ghost" onClick={onBackToHome}>
        Back to Home
      </Button>
    </div>
  );
}
