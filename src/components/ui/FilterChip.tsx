import React from 'react';

interface FilterChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  label: string;
}

export function FilterChip({ active = false, label, className = '', ...props }: FilterChipProps) {
  return (
    <button 
      className={`chip ${active ? 'chip-active' : ''} ${className}`}
      {...props}
    >
      {label}
    </button>
  );
}
