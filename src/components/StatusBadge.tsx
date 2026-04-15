import { CheckCircle2, XCircle } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { useState, useEffect } from 'react';

export function StatusBadge() {
  const { currentPhoto } = useProject();
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (currentPhoto?.status && currentPhoto.status !== status) {
      setStatus(currentPhoto.status);
      setVisible(true);
    } else if (!currentPhoto?.status) {
      setVisible(false);
      setStatus(null);
    }
  }, [currentPhoto?.status]);

  // Auto-fade after 2 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!status) return null;

  return (
    <div
      className={`transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {status === 'selected' && (
        <div className="flex items-center gap-1.5 rounded-full bg-green-500/30 px-3 py-1.5 text-sm font-medium text-green-300 backdrop-blur-sm border border-green-500/30">
          <CheckCircle2 className="h-4 w-4" />
          Selected
        </div>
      )}
      {status === 'skipped' && (
        <div className="flex items-center gap-1.5 rounded-full bg-red-500/30 px-3 py-1.5 text-sm font-medium text-red-300 backdrop-blur-sm border border-red-500/30">
          <XCircle className="h-4 w-4" />
          Skipped
        </div>
      )}
    </div>
  );
}