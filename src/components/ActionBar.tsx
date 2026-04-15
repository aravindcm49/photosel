import { Button } from '@/components/ui/button';
import { useProject } from '@/context/ProjectContext';
import { PeopleTagInput } from '@/components/PeopleTagInput';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ActionBar() {
  const { markPhoto, goToNext } = useProject();

  const handleSkip = () => {
    markPhoto('skipped');
    goToNext();
  };

  const handleAdd = () => {
    markPhoto('selected');
    goToNext();
  };

  return (
    <div className="flex items-center justify-center gap-4 border-t bg-background p-4">
      <Tooltip>
        <TooltipTrigger className="inline-flex">
          <Button
            variant="outline"
            size="lg"
            onClick={handleSkip}
            className="min-w-[120px]"
          >
            Skip
          </Button>
        </TooltipTrigger>
        <TooltipContent>Skip (S)</TooltipContent>
      </Tooltip>

      <div className="flex-1 max-w-md">
        <PeopleTagInput />
      </div>

      <Tooltip>
        <TooltipTrigger className="inline-flex">
          <Button
            size="lg"
            onClick={handleAdd}
            className="min-w-[120px]"
          >
            Add to List
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add to List (A)</TooltipContent>
      </Tooltip>
    </div>
  );
}