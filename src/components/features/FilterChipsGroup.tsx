'use client';

import React, { useState } from 'react';
import { FilterChip } from '../ui/FilterChip';

export interface FilterOption {
  id: string;
  label: string;
}

interface FilterChipsGroupProps {
  options: FilterOption[];
  onFilterChange: (activeFilters: string[]) => void;
}

export function FilterChipsGroup({ options, onFilterChange }: FilterChipsGroupProps) {
  const [activeIds, setActiveIds] = useState<string[]>([]);

  const toggleFilter = (id: string) => {
    const newActiveIds = activeIds.includes(id)
      ? activeIds.filter(activeId => activeId !== id)
      : [...activeIds, id];
      
    setActiveIds(newActiveIds);
    onFilterChange(newActiveIds);
  };

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
      {options.map((option) => (
        <FilterChip
          key={option.id}
          label={option.label}
          active={activeIds.includes(option.id)}
          onClick={() => toggleFilter(option.id)}
        />
      ))}
    </div>
  );
}
