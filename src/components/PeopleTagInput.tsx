import { useState, useEffect, useCallback } from 'react';
import { ChipInput } from '@/components/ChipInput';
import { PeopleBadges } from '@/components/PeopleBadges';
import { useProject } from '@/context/ProjectContext';
import { getAllPeople, addGlobalPerson } from '@/lib/db';

export function PeopleTagInput() {
  const { currentPhoto, tagPeople } = useProject();
  const [localChips, setLocalChips] = useState<string[]>([]);
  const [globalPeople, setGlobalPeople] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

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

  // Sync local chips with committed people when navigating
  useEffect(() => {
    if (!isFocused && currentPhoto) {
      setLocalChips(currentPhoto.people);
    }
  }, [currentPhoto, isFocused]);

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

      // Add new names to global people list
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
      if (!focused && localChips.length > 0) {
        commitPeople(localChips);
      }
    },
    [localChips, commitPeople]
  );

  const handleRemoveBadge = useCallback(
    (index: number) => {
      if (!currentPhoto) return;
      const updated = [...currentPhoto.people];
      updated.splice(index, 1);
      tagPeople(updated);
      setLocalChips(updated);
    },
    [currentPhoto, tagPeople]
  );

  return (
    <div className="w-full">
      {currentPhoto && currentPhoto.people.length > 0 && !isFocused && (
        <PeopleBadges people={currentPhoto.people} onRemove={handleRemoveBadge} />
      )}
      <ChipInput
        onChipsChange={handleChipsChange}
        globalPeople={globalPeople}
        onFocusChange={handleFocusChange}
      />
    </div>
  );
}