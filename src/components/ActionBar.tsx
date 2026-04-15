import { Button } from '@/components/ui/button';
import { useProject } from '@/context/ProjectContext';
import { PeopleTagInput } from '@/components/PeopleTagInput';

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
      <Button
        variant="outline"
        size="lg"
        onClick={handleSkip}
        className="min-w-[120px]"
      >
        Skip
      </Button>
      <div className="flex-1 max-w-md">
        <PeopleTagInput />
      </div>
      <Button
        size="lg"
        onClick={handleAdd}
        className="min-w-[120px]"
      >
        Add to List
      </Button>
    </div>
  );
}