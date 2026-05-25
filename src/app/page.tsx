"use client";

import React, { useState, useEffect } from "react";
import { SearchBar } from "@/components/features/SearchBar";
import { FilterChipsGroup } from "@/components/features/FilterChipsGroup";
import { PantryIngredientGrid, Ingredient } from "@/components/features/PantryIngredientGrid";
import { RecipeCard, Recipe } from "@/components/features/RecipeCard";
import { AISuggestionPanel } from "@/components/features/AISuggestionPanel";
import { BottomNavigation } from "@/components/features/BottomNavigation";
import { PantryItemModal } from "@/components/features/PantryItemModal";
import { Plus, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

const FILTERS = [
  { id: "veg", label: "Vegetarian" },
  { id: "quick", label: "Quick <30 min" },
  { id: "high-protein", label: "High Protein" },
  { id: "low-carb", label: "Low Carb" },
  { id: "dairy-free", label: "Dairy Free" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Real Database & AI State
  const [pantry, setPantry] = useState<Ingredient[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Loading States
  const [isPantryLoading, setIsPantryLoading] = useState(true);
  const [isRecipeLoading, setIsRecipeLoading] = useState(true);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  // Modal State
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [isPantryModalOpen, setIsPantryModalOpen] = useState(false);

  // Error States
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Pantry on Mount
  const fetchPantry = async (showLoading = true) => {
    if (showLoading) setIsPantryLoading(true);
    try {
      const res = await fetch("/api/pantry");
      const data = await res.json();
      if (data.success) {
        setPantry(data.items || []);
        setError(null);
      } else {
        throw new Error(data.error || "Failed to fetch pantry items.");
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Connection to Firestore failed.");
    } finally {
      setIsPantryLoading(false);
    }
  };

  // 2. Match recipe using pantry & filters
  const fetchMatchedRecipe = async () => {
    setIsRecipeLoading(true);
    try {
      // Map filter IDs to names/labels if preferred, or pass IDs directly
      const queryFilters = activeFilters.map(f => {
        const match = FILTERS.find(x => x.id === f);
        return match ? match.label : f;
      }).join(",");
      
      const res = await fetch(`/api/recipes/match?filters=${encodeURIComponent(queryFilters)}`);
      const data = await res.json();
      
      if (data.success && data.recipe) {
        setRecipe(data.recipe);
      } else {
        setRecipe(null);
        console.warn("No recipe matches found or server returned error.");
      }
    } catch (e) {
      console.error("Failed to match recipe:", e);
      setRecipe(null);
    } finally {
      setIsRecipeLoading(false);
    }
  };

  // 3. Fetch AI Suggestions
  const fetchSuggestions = async (searchQuery = "") => {
    setIsSuggestionsLoading(true);
    setIsAIPanelOpen(true);
    try {
      const res = await fetch("/api/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          recipe: recipe,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.suggestions || []);
      }
    } catch (e) {
      console.error("Failed to fetch suggestions:", e);
    } finally {
      setIsSuggestionsLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    fetchPantry();
  }, []);

  // Update matched recipe whenever pantry or filters change
  useEffect(() => {
    if (!isPantryLoading) {
      fetchMatchedRecipe();
    }
  }, [pantry.length, activeFilters]);

  // Modal Handlers
  const handleOpenAddModal = () => {
    setSelectedIngredient(null);
    setIsPantryModalOpen(true);
  };

  const handleOpenEditModal = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIsPantryModalOpen(true);
  };

  const handleSaveIngredient = async (ingredientData: Partial<Ingredient>) => {
    try {
      const res = await fetch("/api/pantry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ingredientData),
      });
      const data = await res.json();
      if (data.success) {
        setIsPantryModalOpen(false);
        // Refresh local list
        await fetchPantry(false);
      } else {
        alert("Failed to save pantry item: " + data.error);
      }
    } catch (e) {
      console.error("Save ingredient failed:", e);
      alert("An error occurred while saving the ingredient.");
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    try {
      const res = await fetch(`/api/pantry?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setIsPantryModalOpen(false);
        // Refresh local list
        await fetchPantry(false);
      } else {
        alert("Failed to delete pantry item: " + data.error);
      }
    } catch (e) {
      console.error("Delete ingredient failed:", e);
      alert("An error occurred while deleting the ingredient.");
    }
  };

  return (
    <div className="main-content flex flex-col gap-6">
      {/* Header Area */}
      <div className="flex flex-col gap-1">
        <h1 className="h1">Hello, Chef ✨</h1>
        <p className="text-body">What are we cooking today?</p>
      </div>

      {/* Connection Failure Error Banner */}
      {error && (
        <div 
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ backgroundColor: "var(--status-error-bg)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#FF8F8F" }}
        >
          <AlertCircle size={20} className="flex-shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Backend offline:</span> {error} Using offline mock sandbox mode.
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col gap-2">
        <SearchBar
          onSearch={(q) => fetchSuggestions(q)}
          onAISuggest={() => fetchSuggestions("")}
        />
        <FilterChipsGroup
          options={FILTERS}
          onFilterChange={setActiveFilters}
        />
      </div>

      {/* Recommended Recipe */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="h2">AI Match ✨</h2>
            {isRecipeLoading && (
              <RefreshCw size={14} className="animate-spin text-accent-primary" />
            )}
          </div>
          <button 
            onClick={fetchMatchedRecipe} 
            className="text-xs font-semibold text-accent-primary hover:underline flex items-center gap-1"
            disabled={isRecipeLoading}
          >
            <RefreshCw size={12} className={isRecipeLoading ? "animate-spin" : ""} />
            Re-match
          </button>
        </div>

        {isRecipeLoading ? (
          // Recipe skeleton loading state
          <div 
            className="card skeleton flex flex-col gap-4 w-full" 
            style={{ height: "380px", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div style={{ height: "200px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-md)" }} />
            <div className="flex flex-col gap-2 px-2">
              <div style={{ height: "24px", width: "65%", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }} />
              <div style={{ height: "16px", width: "40%", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }} />
              <div className="flex gap-4 mt-4">
                <div style={{ height: "20px", width: "60px", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }} />
                <div style={{ height: "20px", width: "60px", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }} />
                <div style={{ height: "20px", width: "60px", background: "rgba(255,255,255,0.03)", borderRadius: "4px" }} />
              </div>
            </div>
          </div>
        ) : recipe ? (
          <RecipeCard recipe={recipe} />
        ) : (
          // Recipe empty state
          <div 
            className="card flex flex-col items-center justify-center p-8 gap-3 text-center border-dashed"
            style={{ borderStyle: "dashed", borderColor: "rgba(255,255,255,0.15)", backgroundColor: "transparent" }}
          >
            <AlertCircle size={32} className="text-text-tertiary" />
            <div>
              <p className="font-semibold text-sm">No matched recipes</p>
              <p className="text-xs text-text-tertiary mt-1">Try adding more fresh ingredients or loosening filters.</p>
            </div>
            <Button onClick={() => fetchMatchedRecipe()} className="!py-2 !px-4 mt-2">
              Generate Recipe
            </Button>
          </div>
        )}
      </div>

      {/* Pantry Grid */}
      <div className="flex flex-col gap-1 mt-2">
        <div className="flex justify-between items-center">
          <h2 className="h2">Your Pantry</h2>
          <Button 
            onClick={handleOpenAddModal} 
            className="!py-1.5 !px-3 !text-xs font-semibold flex items-center gap-1"
          >
            <Plus size={14} />
            Add Item
          </Button>
        </div>

        {isPantryLoading ? (
          // Pantry grid skeleton loading state
          <div className="grid-4-cols gap-4 mt-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div 
                key={index} 
                className="skeleton" 
                style={{ height: "108px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)" }} 
              />
            ))}
          </div>
        ) : pantry.length > 0 ? (
          <PantryIngredientGrid
            ingredients={pantry}
            onIngredientClick={handleOpenEditModal}
          />
        ) : (
          // Pantry empty state
          <div 
            className="card flex flex-col items-center justify-center p-8 gap-3 text-center border-dashed mt-4"
            style={{ borderStyle: "dashed", borderColor: "rgba(255,255,255,0.15)", backgroundColor: "transparent" }}
          >
            <p className="font-semibold text-sm">Your pantry is empty</p>
            <p className="text-xs text-text-tertiary">Add items to allow the AI to suggest customized recipes!</p>
            <Button onClick={handleOpenAddModal} className="!py-2 !px-4 mt-2">
              Add First Ingredient
            </Button>
          </div>
        )}
      </div>

      {/* Overlays & Modals */}
      <AISuggestionPanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        suggestions={isSuggestionsLoading ? [
          { id: "l1", text: "AI is thinking up recommendations...", action: "swap" as const }
        ] : suggestions}
      />

      <PantryItemModal
        isOpen={isPantryModalOpen}
        onClose={() => setIsPantryModalOpen(false)}
        onSave={handleSaveIngredient}
        onDelete={handleDeleteIngredient}
        ingredient={selectedIngredient}
      />

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
