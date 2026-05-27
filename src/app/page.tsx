"use client";

import React, { useState, useEffect } from "react";
import { SearchBar } from "@/components/features/SearchBar";
import { FilterChipsGroup } from "@/components/features/FilterChipsGroup";
import { PantryIngredientGrid, Ingredient } from "@/components/features/PantryIngredientGrid";
import { RecipeCard, Recipe } from "@/components/features/RecipeCard";
import { AISuggestionPanel } from "@/components/features/AISuggestionPanel";
import { BottomNavigation } from "@/components/features/BottomNavigation";
import { PantryItemModal } from "@/components/features/PantryItemModal";
import { Plus, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

const FILTERS = [
  { id: "veg", label: "Vegetarian" },
  { id: "quick", label: "Quick <30 min" },
  { id: "high-protein", label: "High Protein" },
  { id: "low-carb", label: "Low Carb" },
  { id: "dairy-free", label: "Dairy Free" },
];

const MOCK_PANTRY: Ingredient[] = [
  { id: "1", name: "Eggs", quantity: "12 pcs", freshness: "fresh", icon: "🥚" },
  { id: "2", name: "Spinach", quantity: "200g", freshness: "expiring", icon: "🥬" },
  { id: "3", name: "Chicken Breast", quantity: "500g", freshness: "fresh", icon: "🍗" },
  { id: "4", name: "Milk", quantity: "1L", freshness: "expired", icon: "🥛" },
  { id: "5", name: "Tomatoes", quantity: "4 pcs", freshness: "expiring", icon: "🍅" },
  { id: "6", name: "Onions", quantity: "1 kg", freshness: "fresh", icon: "🧅" },
  { id: "7", name: "Pasta", quantity: "500g", freshness: "fresh", icon: "🍝" },
  { id: "8", name: "Cheese", quantity: "200g", freshness: "fresh", icon: "🧀" },
];

const FALLBACK_RECIPE: Recipe = {
  id: "fr1",
  title: "Protein-Packed Spinach Omelette",
  image: "https://images.unsplash.com/photo-1510693062634-9721735165b5?q=80&w=2938&auto=format&fit=crop",
  rating: 4.8,
  timeMinutes: 15,
  calories: 320,
  protein: 24,
  carbs: 4,
  tags: ["Vegetarian", "High Protein", "Quick"],
  steps: [
    { id: "s1", description: "Whisk eggs in a bowl with a pinch of salt and pepper." },
    { id: "s2", description: "Heat a non-stick pan with a little oil over medium heat." },
    { id: "s3", description: "Sauté the spinach until wilted.", timerMinutes: 2 },
    { id: "s4", description: "Pour the eggs over the spinach and cook until set.", timerMinutes: 4 },
  ],
};

const FALLBACK_SUGGESTIONS = [
  { id: "1", text: "Swap Milk for Almond Milk since your milk is expired.", action: "swap" as const },
  { id: "2", text: "Scale recipe to 2 servings (you have enough eggs).", action: "scale" as const },
  { id: "3", text: "Add to Thursday Meal Plan", action: "plan" as const },
];

// Helper to safely load pantry from localStorage
const loadPantryFromLocalStorage = (): Ingredient[] => {
  if (typeof window === "undefined") return MOCK_PANTRY;
  try {
    const stored = localStorage.getItem("kitchen_ai_pantry");
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem("kitchen_ai_pantry", JSON.stringify(MOCK_PANTRY));
    return MOCK_PANTRY;
  } catch (e) {
    return MOCK_PANTRY;
  }
};

// Helper to save pantry to localStorage
const savePantryToLocalStorage = (items: Ingredient[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("kitchen_ai_pantry", JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save pantry to localStorage:", e);
  }
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Local-first state management
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

  // 1. Initialize pantry from LocalStorage and sync with backend in background
  useEffect(() => {
    const localData = loadPantryFromLocalStorage();
    setPantry(localData);
    setIsPantryLoading(false);

    // Silently sync with backend database if available (runs in background)
    fetch("/api/pantry")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.items && data.items.length > 0) {
          setPantry(data.items);
          savePantryToLocalStorage(data.items);
        }
      })
      .catch((e) => {
        console.warn("Firestore sync not available. Running in local sandbox mode.", e);
      });
  }, []);

  // 2. Fetch matched recipe using client-passed pantry & filters
  const fetchMatchedRecipe = async () => {
    setIsRecipeLoading(true);
    try {
      const queryFilters = activeFilters.map((f) => {
        const match = FILTERS.find((x) => x.id === f);
        return match ? match.label : f;
      });

      const res = await fetch("/api/recipes/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pantry: pantry,
          filters: queryFilters,
        }),
      });
      const data = await res.json();

      if (data.success && data.recipe) {
        setRecipe(data.recipe);
      } else {
        throw new Error("Match response unsuccessful");
      }
    } catch (e) {
      console.warn("Failed to fetch matched recipe from backend, using local fallback.", e);
      
      // Select appropriate mock recipe based on active filters
      const isVeg = activeFilters.includes("veg");
      if (isVeg) {
        setRecipe({
          id: "fr2",
          title: "Sautéed Spinach & Garlic Cheese Pasta",
          image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop",
          rating: 4.7,
          timeMinutes: 20,
          calories: 450,
          protein: 15,
          carbs: 58,
          tags: ["Vegetarian", "Quick"],
          steps: [
            { id: "s1", description: "Boil water in a pot and cook pasta with salt until al dente.", timerMinutes: 10 },
            { id: "s2", description: "In a pan, sauté minced onions and tomatoes until soft.", timerMinutes: 3 },
            { id: "s3", description: "Add spinach and stir until wilted. Mix in boiled pasta and shredded cheese.", timerMinutes: 2 },
            { id: "s4", description: "Serve hot, garnished with extra cheese." },
          ],
        });
      } else {
        setRecipe(FALLBACK_RECIPE);
      }
    } finally {
      setIsRecipeLoading(false);
    }
  };

  // Trigger recipe matcher whenever pantry values or filters change
  useEffect(() => {
    if (!isPantryLoading) {
      fetchMatchedRecipe();
    }
  }, [
    JSON.stringify(pantry.map((i) => ({ id: i.id, q: i.quantity, f: i.freshness }))),
    activeFilters,
  ]);

  // 3. Fetch AI Suggestions using current pantry list
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
          pantry: pantry,
        }),
      });
      const data = await res.json();
      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
      } else {
        throw new Error("Suggestions fetch failed");
      }
    } catch (e) {
      console.warn("Failed to fetch suggestions from backend, using local fallback.", e);
      setSuggestions(FALLBACK_SUGGESTIONS);
    } finally {
      setIsSuggestionsLoading(false);
    }
  };

  // Modal Handlers
  const handleOpenAddModal = () => {
    setSelectedIngredient(null);
    setIsPantryModalOpen(true);
  };

  const handleOpenEditModal = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIsPantryModalOpen(true);
  };

  // Save changes locally and silently attempt background Firestore sync
  const handleSaveIngredient = async (ingredientData: Partial<Ingredient>) => {
    let updatedPantry: Ingredient[];

    if (ingredientData.id) {
      // Edit existing item
      updatedPantry = pantry.map((item) =>
        item.id === ingredientData.id ? (ingredientData as Ingredient) : item
      );
    } else {
      // Add new item
      const newItem: Ingredient = {
        id: Date.now().toString(),
        name: ingredientData.name || "",
        quantity: ingredientData.quantity || "",
        freshness: ingredientData.freshness || "fresh",
        icon: ingredientData.icon || "🥑",
      };
      updatedPantry = [...pantry, newItem];
    }

    // Instantly update UI and LocalStorage
    setPantry(updatedPantry);
    savePantryToLocalStorage(updatedPantry);
    setIsPantryModalOpen(false);

    // Background server sync (fails silently)
    try {
      await fetch("/api/pantry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ingredientData),
      });
    } catch (e) {
      console.warn("Background pantry save sync failed (operating locally).", e);
    }
  };

  // Delete changes locally and silently attempt background Firestore sync
  const handleDeleteIngredient = async (id: string) => {
    // Instantly update UI and LocalStorage
    const updatedPantry = pantry.filter((item) => item.id !== id);
    setPantry(updatedPantry);
    savePantryToLocalStorage(updatedPantry);
    setIsPantryModalOpen(false);

    // Background server sync (fails silently)
    try {
      await fetch(`/api/pantry?id=${id}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.warn("Background pantry delete sync failed (operating locally).", e);
    }
  };

  return (
    <div className="main-content flex flex-col gap-6">
      {/* Header Area */}
      <div className="flex flex-col gap-1">
        <h1 className="h1">Hello, Chef ✨</h1>
        <p className="text-body">What are we cooking today?</p>
      </div>

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
