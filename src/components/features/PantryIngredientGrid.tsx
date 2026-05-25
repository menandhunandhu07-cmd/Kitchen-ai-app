'use client';

import React from 'react';
import { Card } from '../ui/Card';

export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
  freshness: 'fresh' | 'expiring' | 'expired';
  icon: string; // Emoji or SVG path
}

interface PantryIngredientGridProps {
  ingredients: Ingredient[];
  onIngredientClick: (ingredient: Ingredient) => void;
}

export function PantryIngredientGrid({ ingredients, onIngredientClick }: PantryIngredientGridProps) {
  return (
    <div className="grid-4-cols gap-4 mt-4">
      {ingredients.map((ingredient) => (
        <Card 
          key={ingredient.id} 
          className="cursor-pointer hover:bg-bg-tertiary flex flex-col items-center p-3 gap-2 relative"
          onClick={() => onIngredientClick(ingredient)}
        >
          <div className={`freshness-badge ${ingredient.freshness}`}></div>
          <div className="text-3xl mt-2">{ingredient.icon}</div>
          <div className="text-center w-full">
            <div className="text-sm font-medium truncate w-full">{ingredient.name}</div>
            <div className="text-xs text-text-tertiary mt-1">{ingredient.quantity}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
