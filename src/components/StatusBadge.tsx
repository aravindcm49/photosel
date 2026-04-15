import { CheckCircle2, XCircle } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';

export function StatusBadge() {
  const { currentPhoto } = useProject();

  if (!currentPhoto?.status) return null;

  if (currentPhoto.status === 'selected') {
    return (
      <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-sm font-medium text-green-700">
        <CheckCircle2 className="h-4 w-4" />
        Selected
      </div>
    );
  }

  if (currentPhoto.status === 'skipped') {
    return (
      <div className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-sm font-medium text-red-700">
        <XCircle className="h-4 w-4" />
        Skipped
      </div>
    );
  }

  return null;
}