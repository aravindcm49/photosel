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
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
          aria-label="Rotate photo"
        >
          <RotateCw className="h-5 w-5" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Rotate (R)</TooltipContent>
    </Tooltip>
  );
}