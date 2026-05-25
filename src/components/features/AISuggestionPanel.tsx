'use client';

import React from 'react';
import { X, Sparkles, Plus, Scale, CalendarPlus, Repeat } from 'lucide-react';
import { Button } from '../ui/Button';

interface AISuggestionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: {
    id: string;
    text: string;
    action: 'swap' | 'scale' | 'plan' | 'add';
  }[];
}

export function AISuggestionPanel({ isOpen, onClose, suggestions }: AISuggestionPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40 }}
        onClick={onClose}
      />
      <div 
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-bg-secondary rounded-t-xl z-50 p-5 flex flex-col gap-4 animate-fade-in"
        style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: '100%', 
          maxWidth: '480px', 
          backgroundColor: 'var(--bg-secondary)', 
          borderTopLeftRadius: 'var(--radius-xl)', 
          borderTopRightRadius: 'var(--radius-xl)', 
          zIndex: 50, 
          padding: '20px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-accent-primary">
            <Sparkles size={20} />
            <h3 className="h3">AI Suggestions</h3>
          </div>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-4 bg-bg-tertiary rounded-lg flex items-center gap-4">
              <div className="p-2 bg-bg-glass rounded-full text-accent-secondary">
                {suggestion.action === 'swap' && <Repeat size={18} />}
                {suggestion.action === 'scale' && <Scale size={18} />}
                {suggestion.action === 'plan' && <CalendarPlus size={18} />}
                {suggestion.action === 'add' && <Plus size={18} />}
              </div>
              <p className="text-sm flex-1">{suggestion.text}</p>
            </div>
          ))}
        </div>

        <Button className="w-full mt-2" onClick={onClose}>
          Apply Selected Suggestions
        </Button>
      </div>
    </>
  );
}
