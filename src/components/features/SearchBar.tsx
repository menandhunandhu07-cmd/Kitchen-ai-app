'use client';

import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onAISuggest: () => void;
}

export function SearchBar({ onSearch, onAISuggest }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(query);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex items-center gap-2">
        <div className="flex-1">
          <Input 
            icon={<Search size={20} />}
            placeholder="Ingredient, dish, or cuisine..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button onClick={onAISuggest} className="flex-shrink-0 !px-4" aria-label="AI Suggest">
          <Sparkles size={20} />
          <span className="hidden sm:inline">AI Suggest</span>
        </Button>
      </div>
    </div>
  );
}
