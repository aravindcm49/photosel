import { Button } from '@/components/ui/button';

interface ResumeDialogProps {
  photoPosition: number;
  onYes: () => void;
  onNo: () => void;
}

export function ResumeDialog({ photoPosition, onYes, onNo }: ResumeDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-w-sm rounded-lg border bg-background p-6 shadow-lg text-center">
        <p className="mb-4 text-sm">
          Resume from photo <strong>{photoPosition}</strong>?
        </p>
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={onNo}>
            Start from beginning
          </Button>
          <Button variant="default" size="sm" onClick={onYes}>
            Resume
          </Button>
        </div>
      </div>
    </div>
  );
}
