import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

export interface ChipInputRef {
  hasUncommitted: () => boolean;
  clear: () => void;
  focus: () => void;
}

interface ChipInputProps {
  onChipsChange: (chips: string[]) => void;
  globalPeople: string[];
  onFocusChange?: (focused: boolean) => void;
}

export const ChipInput = forwardRef<ChipInputRef, ChipInputProps>(function ChipInput(
  { onChipsChange, globalPeople, onFocusChange },
  ref
) {
  const [chips, setChips] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track latest values for imperative handle
  const chipsRef = useRef(chips);
  chipsRef.current = chips;
  const inputValueRef = useRef(inputValue);
  inputValueRef.current = inputValue;

  useImperativeHandle(ref, () => ({
    hasUncommitted: () => inputValueRef.current.trim() !== '' || chipsRef.current.length > 0,
    clear: () => {
      setChips([]);
      setInputValue('');
      chipsRef.current = [];
      inputValueRef.current = '';
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    },
    focus: () => {
      inputRef.current?.focus();
    },
  }));

  useEffect(() => {
    onChipsChange(chips);
  }, [chips, onChipsChange]);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  const updateSuggestions = useCallback(
    (value: string) => {
      if (value.trim()) {
        const filtered = globalPeople.filter(
          (name) =>
            name.toLowerCase().includes(value.toLowerCase()) &&
            !chips.includes(name)
        );
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      setSelectedSuggestion(-1);
    },
    [globalPeople, chips]
  );

  const addChip = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (trimmed && !chips.includes(trimmed)) {
        setChips((prev) => [...prev, trimmed]);
      }
      setInputValue('');
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    },
    [chips]
  );

  const removeChip = useCallback(
    (index: number) => {
      setChips((prev) => prev.filter((_, i) => i !== index));
    },
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Check if comma was typed
    if (value.includes(',')) {
      const parts = value.split(',').map((s) => s.trim()).filter(Boolean);
      for (const part of parts) {
        addChip(part);
      }
      setInputValue('');
      return;
    }

    setInputValue(value);
    updateSuggestions(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
        addChip(suggestions[selectedSuggestion]);
      } else if (inputValue.trim()) {
        addChip(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && chips.length > 0) {
      removeChip(chips.length - 1);
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setSelectedSuggestion((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setSelectedSuggestion((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleFocus = () => {
    onFocusChange?.(true);
    if (inputValue.trim()) {
      updateSuggestions(inputValue);
    }
  };

  const handleBlur = () => {
    // Delay to allow clicking on suggestions
    blurTimerRef.current = setTimeout(() => {
      onFocusChange?.(false);
      setShowSuggestions(false);
      if (inputValue.trim()) {
        addChip(inputValue);
      }
    }, 200);
  };

  const handleSuggestionClick = (name: string) => {
    addChip(name);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-background px-3 py-2">
        {chips.map((chip, index) => (
          <button
            key={index}
            onClick={() => removeChip(index)}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-sm hover:bg-primary/20"
            type="button"
          >
            {chip}
            <span className="text-xs text-muted-foreground">×</span>
          </button>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={chips.length === 0 ? 'Type names (comma-separated)...' : ''}
          className="min-w-[100px] flex-1 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-auto rounded-lg border bg-popover shadow-md">
          {suggestions.map((name, index) => (
            <button
              key={name}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-accent ${
                index === selectedSuggestion ? 'bg-accent' : ''
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSuggestionClick(name);
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

// Export a focus helper for external use
export function focusChipInput() {
  const input = document.querySelector<HTMLInputElement>(
    '[data-chip-input="true"] input, .chip-input-field input'
  );
  input?.focus();
}
