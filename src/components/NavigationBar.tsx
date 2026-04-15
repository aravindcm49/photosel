import { Button } from '@/components/ui/button';
import { useProject } from '@/context/ProjectContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function NavigationBar() {
  const { currentIndex, totalPhotos, goToNext, goToPrevious } = useProject();

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalPhotos - 1;

  return (
    <div className="flex items-center justify-center gap-2 py-2">
      <Tooltip>
        <TooltipTrigger className="inline-flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            disabled={isFirst}
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Previous (←)</TooltipContent>
      </Tooltip>

      <span className="min-w-[60px] text-center text-sm text-muted-foreground">
        {currentIndex + 1} / {totalPhotos}
      </span>

      <Tooltip>
        <TooltipTrigger className="inline-flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            disabled={isLast}
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Next (→)</TooltipContent>
      </Tooltip>
    </div>
  );
}