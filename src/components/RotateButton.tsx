import { RotateCcw, RotateCw } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function RotateButton() {
  const { rotateLeft, rotateRight } = useProject();

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger className="inline-flex">
          <button
            onClick={rotateLeft}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Rotate left"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Rotate Left (Ctrl+J)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger className="inline-flex">
          <button
            onClick={rotateRight}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Rotate right"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Rotate Right (Ctrl+K)</TooltipContent>
      </Tooltip>
    </div>
  );
}
