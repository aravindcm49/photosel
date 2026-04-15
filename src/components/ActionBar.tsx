import { Button } from '@/components/ui/button';
import { useProject } from '@/context/ProjectContext';
import { PeopleTagInput } from '@/components/PeopleTagInput';
import type { PeopleTagInputRef } from '@/components/PeopleTagInput';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { forwardRef, useImperativeHandle, useRef } from 'react';

export interface ActionBarRef {
  hasUncommittedTags: () => boolean;
  clearUncommitted: () => void;
  focusTagInput: () => void;
}

interface ActionBarProps {
  onTagInputFocusChange?: (focused: boolean) => void;
}

export const ActionBar = forwardRef<ActionBarRef, ActionBarProps>(function ActionBar(
  { onTagInputFocusChange },
  ref
) {
  const { markPhoto, goToNext } = useProject();
  const peopleTagInputRef = useRef<PeopleTagInputRef>(null);

  useImperativeHandle(ref, () => ({
    hasUncommittedTags: () => peopleTagInputRef.current?.hasUncommitted() ?? false,
    clearUncommitted: () => peopleTagInputRef.current?.clear(),
    focusTagInput: () => peopleTagInputRef.current?.focus(),
  }));

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
        <PeopleTagInput ref={peopleTagInputRef} onFocusChange={onTagInputFocusChange} />
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
});