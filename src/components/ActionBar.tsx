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
  commitTags: () => void;
}

interface ActionBarProps {
  onTagInputFocusChange?: (focused: boolean) => void;
}

export const ActionBar = forwardRef<ActionBarRef, ActionBarProps>(function ActionBar(
  { onTagInputFocusChange },
  ref
) {
  const { markAndAdvance } = useProject();
  const peopleTagInputRef = useRef<PeopleTagInputRef>(null);

  useImperativeHandle(ref, () => ({
    hasUncommittedTags: () => peopleTagInputRef.current?.hasUncommitted() ?? false,
    clearUncommitted: () => peopleTagInputRef.current?.clear(),
    focusTagInput: () => peopleTagInputRef.current?.focus(),
    commitTags: () => peopleTagInputRef.current?.commitTags(),
  }));

  const handleSkip = () => {
    peopleTagInputRef.current?.commitTags();
    markAndAdvance('skipped');
  };

  const handleAdd = () => {
    peopleTagInputRef.current?.commitTags();
    markAndAdvance('selected');
  };

  return (
    <div className="flex items-center justify-center gap-4 p-2">
      <Tooltip>
        <TooltipTrigger className="inline-flex">
          <Button
            variant="outline"
            size="lg"
            onClick={handleSkip}
            className="min-w-[100px] border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
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
            className="min-w-[100px] bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/30"
          >
            Add to List
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add to List (A)</TooltipContent>
      </Tooltip>
    </div>
  );
});
