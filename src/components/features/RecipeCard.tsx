'use client';

import React, { useState } from 'react';
import { Clock, Flame, Star, Activity, Play, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import styles from './RecipeCard.module.css';

export interface RecipeStep {
  id: string;
  description: string;
  timerMinutes?: number;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  rating: number;
  timeMinutes: number;
  calories: number;
  protein: number;
  carbs: number;
  tags: string[];
  steps: RecipeStep[];
}

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  return (
    <Card className={`card ${styles['recipe-card']}`}>
      <div 
        className={styles['recipe-image-container']}
        style={{ backgroundImage: `url(${recipe.image})` }}
      >
        <div className={styles['recipe-gradient']}></div>
        <div className={styles['recipe-rating']}>
          <Star size={14} className="text-status-warning fill-status-warning" color="var(--status-warning)" fill="var(--status-warning)" />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{recipe.rating}</span>
        </div>
      </div>
      
      <div className={styles['recipe-content']}>
        <div>
          <h2 className="h2 mb-2">{recipe.title}</h2>
          <div className={styles['recipe-tags']}>
            {recipe.tags.map(tag => (
              <span key={tag} className={styles['recipe-tag']}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className={styles['recipe-stats']}>
          <div className={styles['recipe-stat']}>
            <Clock size={16} color="var(--text-tertiary)" />
            <span>{recipe.timeMinutes} min</span>
          </div>
          <div className={styles['recipe-stat']}>
            <Flame size={16} color="var(--text-tertiary)" />
            <span>{recipe.calories} kcal</span>
          </div>
          <div className={styles['recipe-stat']}>
            <Activity size={16} color="var(--text-tertiary)" />
            <span>{recipe.protein}g Protein</span>
          </div>
          <div className={styles['recipe-stat']}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--text-tertiary)' }}></div>
            <span>{recipe.carbs}g Carbs</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <h3 className="h3">Preparation Steps</h3>
          {recipe.steps.map((step, index) => (
            <div 
              key={step.id} 
              className={`${styles['recipe-step']} ${activeStepId === step.id ? styles['active'] : ''}`}
              onClick={() => setActiveStepId(step.id)}
            >
              <div className={styles['step-number']}>
                {index + 1}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.875rem' }}>{step.description}</p>
                {step.timerMinutes && (
                  <div className={styles['step-timer']}>
                    <Play size={12} />
                    <span>{step.timerMinutes}:00 Timer</span>
                  </div>
                )}
              </div>
              {activeStepId === step.id && (
                <CheckCircle size={20} color="var(--status-success)" style={{ alignSelf: 'center', flexShrink: 0 }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
