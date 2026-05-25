"use client";

import React, { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Ingredient } from "./PantryIngredientGrid";

interface PantryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ingredient: Partial<Ingredient>) => void;
  onDelete: (id: string) => void;
  ingredient?: Ingredient | null; // If null/undefined, we are in "Add" mode
}

const DEFAULT_EMOJIS = ["🥚", "🥬", "🍗", "🥛", "🍅", "🧅", "🍝", "🧀", "🥑", "🥕", "🥩", "🍞", "🍎", "🍌", "🌶️", "🧄"];

export function PantryItemModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  ingredient,
}: PantryItemModalProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [freshness, setFreshness] = useState<"fresh" | "expiring" | "expired">("fresh");
  const [icon, setIcon] = useState("🥑");

  // Sync state with open modal modes
  useEffect(() => {
    if (ingredient) {
      setName(ingredient.name);
      setQuantity(ingredient.quantity);
      setFreshness(ingredient.freshness);
      setIcon(ingredient.icon);
    } else {
      setName("");
      setQuantity("");
      setFreshness("fresh");
      setIcon("🥑");
    }
  }, [ingredient, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !quantity.trim()) return;

    onSave({
      id: ingredient?.id,
      name: name.trim(),
      quantity: quantity.trim(),
      freshness,
      icon,
    });
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50 transition-opacity"
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 50 }}
        onClick={onClose}
      />
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[440px] bg-bg-secondary rounded-2xl z-50 p-6 flex flex-col gap-4 shadow-xl border border-bg-glass animate-fade-in"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: "440px",
          backgroundColor: "var(--bg-secondary)",
          borderRadius: "var(--radius-lg)",
          zIndex: 51,
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <h3 className="h3 text-xl font-semibold">
            {ingredient ? "Edit Ingredient" : "Add Ingredient"}
          </h3>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Ingredient Name
            </label>
            <Input
              placeholder="e.g. Spinach, Garlic, Butter"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Quantity / Measurement
            </label>
            <Input
              placeholder="e.g. 200g, 3 pcs, 1 bottle"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Freshness Status
            </label>
            <div className="flex gap-2 mt-1">
              {(["fresh", "expiring", "expired"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFreshness(status)}
                  className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg capitalize border transition-all ${
                    freshness === status
                      ? status === "fresh"
                        ? "bg-status-success/20 border-status-success text-status-success"
                        : status === "expiring"
                        ? "bg-status-warning/20 border-status-warning text-status-warning"
                        : "bg-status-danger/20 border-status-danger text-status-danger"
                      : "bg-bg-tertiary border-white/5 text-text-secondary hover:bg-bg-tertiary/75"
                  }`}
                  style={{
                    backgroundColor:
                      freshness === status
                        ? status === "fresh"
                          ? "rgba(46, 204, 113, 0.15)"
                          : status === "expiring"
                          ? "rgba(241, 196, 15, 0.15)"
                          : "rgba(231, 76, 60, 0.15)"
                        : "var(--bg-tertiary)",
                    borderColor:
                      freshness === status
                        ? status === "fresh"
                          ? "var(--status-success)"
                          : status === "expiring"
                          ? "var(--status-warning)"
                          : "var(--status-danger)"
                        : "rgba(255, 255, 255, 0.05)",
                    color:
                      freshness === status
                        ? status === "fresh"
                          ? "var(--status-success)"
                          : status === "expiring"
                          ? "var(--status-warning)"
                          : "var(--status-danger)"
                        : "var(--text-secondary)",
                  }}
                >
                  {status === "expiring" ? "Expiring Soon" : status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Select Icon / Emoji
            </label>
            <div className="flex gap-2 items-center mt-1">
              <div
                className="text-3xl p-2 bg-bg-tertiary rounded-xl border border-white/5 flex items-center justify-center w-14 h-14"
                style={{ backgroundColor: "var(--bg-tertiary)", border: "1px solid rgba(255, 255, 255, 0.05)" }}
              >
                {icon}
              </div>
              <Input
                placeholder="Or type custom emoji"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="flex-1"
                maxLength={2}
              />
            </div>
            <div className="grid grid-cols-8 gap-2 mt-2 max-h-[84px] overflow-y-auto p-1 bg-bg-tertiary/50 rounded-lg">
              {DEFAULT_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`text-xl p-1 rounded hover:bg-white/10 transition-colors ${
                    icon === emoji ? "bg-white/15 scale-110" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
            {ingredient && (
              <Button
                type="button"
                onClick={() => onDelete(ingredient.id)}
                className="!bg-status-danger/25 !text-status-danger border border-status-danger/20 hover:!bg-status-danger/35 flex-shrink-0"
                style={{
                  backgroundColor: "rgba(231, 76, 60, 0.2)",
                  color: "var(--status-danger)",
                  border: "1px solid rgba(231, 76, 60, 0.2)",
                }}
              >
                <Trash2 size={18} />
              </Button>
            )}
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 !bg-bg-tertiary hover:!bg-bg-tertiary/75 border border-white/5"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                color: "var(--text-primary)",
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
