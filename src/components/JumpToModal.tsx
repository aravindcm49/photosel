import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface JumpToModalProps {
  maxIndex: number;
  onJump: (index: number) => void;
  onClose: () => void;
}

export function JumpToModal({ maxIndex, onJump, onClose }: JumpToModalProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1) {
      setError('Enter a valid number');
      return;
    }
    if (num > maxIndex) {
      setError(`Max is ${maxIndex}`);
      return;
    }
    setError(null);
    onJump(num - 1); // Convert 1-based to 0-based
  }, [value, maxIndex, onJump]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setValue(digits);
    const num = parseInt(digits, 10);
    if (isNaN(num)) {
      setError(null);
    } else if (num < 1) {
      setError('Enter a valid number');
    } else if (num > maxIndex) {
      setError(`Max is ${maxIndex}`);
    } else {
      setError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-4 w-72 rounded-lg border bg-background p-6 shadow-lg">
        <h3 className="mb-3 text-center text-sm font-semibold">Jump to photo</h3>
        <Input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`1 – ${maxIndex}`}
          className="mb-2 text-center text-lg"
          autoFocus
        />
        {error && (
          <p className="mb-2 text-xs text-red-500">{error}</p>
        )}
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" size="sm" onClick={handleSubmit} disabled={!!error || !value}>
            Go
          </Button>
        </div>
      </div>
    </div>
  );
}
