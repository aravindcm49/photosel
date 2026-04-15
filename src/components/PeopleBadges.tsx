import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface PeopleBadgesProps {
  people: string[];
  onRemove?: (index: number) => void;
}

export function PeopleBadges({ people, onRemove }: PeopleBadgesProps) {
  if (people.length === 0) return null;

  return (
    <div className="flex items-center justify-center overflow-x-auto py-1">
      <div className="flex gap-1">
        {people.map((name, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="flex items-center gap-1 whitespace-nowrap"
          >
            {name}
            {onRemove && (
              <button
                onClick={() => onRemove(index)}
                className="ml-0.5 rounded-full hover:bg-foreground/10"
                aria-label={`Remove ${name}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
}