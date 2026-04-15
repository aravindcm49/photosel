import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { ChipInput, type ChipInputRef } from '@/components/ChipInput';
import { useProject } from '@/context/ProjectContext';
import { getAllPeople, addGlobalPerson } from '@/lib/db';

export interface PeopleTagInputRef {
  hasUncommitted: () => boolean;
  clear: () => void;
  focus: () => void;
}

interface PeopleTagInputProps {
  onFocusChange?: (focused: boolean) => void;
}

export const PeopleTagInput = forwardRef<PeopleTagInputRef, PeopleTagInputProps>(function PeopleTagInput(
  { onFocusChange },
  ref
) {
  const { currentPhoto, tagPeople } = useProject();
  const [localChips, setLocalChips] = useState<string[]>([]);
  const [globalPeople, setGlobalPeople] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const chipInputRef = useRef<ChipInputRef>(null);

  useEffect(() => {
    async function loadPeople() {
      try {
        const people = await getAllPeople();
        setGlobalPeople(people.map((p) => p.name));
      } catch {
        // Ignore errors
      }
    }
    loadPeople();
  }, []);

  // Sync local chips with committed people when photo changes
  useEffect(() => {
    if (!isFocused && currentPhoto) {
      setLocalChips(currentPhoto.people);
    }
  }, [currentPhoto, isFocused]);

  useImperativeHandle(ref, () => ({
    hasUncommitted: () => {
      if (!isFocused) return false;
      const inputUncommitted = chipInputRef.current?.hasUncommitted() ?? false;
      if (inputUncommitted) return true;
      if (currentPhoto && localChips.length !== currentPhoto.people.length) return true;
      if (currentPhoto && !localChips.every((chip, i) => chip === currentPhoto.people[i])) return true;
      return false;
    },
    clear: () => {
      chipInputRef.current?.clear();
      if (currentPhoto) {
        setLocalChips(currentPhoto.people);
      }
    },
    focus: () => {
      chipInputRef.current?.focus();
    },
  }));

  const handleChipsChange = useCallback(
    (chips: string[]) => {
      setLocalChips(chips);
    },
    []
  );

  const commitPeople = useCallback(
    async (people: string[]) => {
      if (!currentPhoto) return;

      tagPeople(people);

      for (const name of people) {
        if (!globalPeople.includes(name)) {
          try {
            await addGlobalPerson(name);
            setGlobalPeople((prev) => [...prev, name]);
          } catch {
            // Ignore duplicate errors
          }
        }
      }
    },
    [currentPhoto, tagPeople, globalPeople]
  );

  const handleFocusChange = useCallback(
    (focused: boolean) => {
      setIsFocused(focused);
      onFocusChange?.(focused);
      if (!focused && localChips.length > 0) {
        commitPeople(localChips);
      }
    },
    [localChips, commitPeople, onFocusChange]
  );

  const handleRemoveChip = useCallback(
    (index: number) => {
      const updated = [...localChips];
      updated.splice(index, 1);
      setLocalChips(updated);
      commitPeople(updated);
    },
    [localChips, commitPeople]
  );

  return (
    <div className="w-full">
      <ChipInput
        ref={chipInputRef}
        onChipsChange={handleChipsChange}
        globalPeople={globalPeople}
        onFocusChange={handleFocusChange}
        initialChips={currentPhoto?.people ?? []}
        onRemoveChip={handleRemoveChip}
      />
    </div>
  );
});
