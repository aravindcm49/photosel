import { RotateCw } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function RotateButton() {
  const { rotatePhoto } = useProject();

  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex">
        <button
          onClick={rotatePhoto}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label="Rotate photo"
        >
          <RotateCw className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Rotate (R)</TooltipContent>
    </Tooltip>
  );
}
