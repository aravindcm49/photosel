import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PhotoReviewScreenProps {
  folderName: string;
  onBack: () => void;
}

export function PhotoReviewScreen({ folderName, onBack }: PhotoReviewScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">{folderName}</h1>
      <p className="text-muted-foreground">Photo review screen (coming soon)</p>
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>
    </div>
  );
}