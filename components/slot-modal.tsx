"use client";

import { useState, useMemo } from "react";
import { WeeklyPlan, MealWithIngredients } from "@/types/database";
import { dayKeyLabel } from "@/lib/days";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Trash2, ChefHat, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import Emoji from "@/components/emoji";

const SLOT_NAMES: Record<string, string> = { lunch: "Midi", dinner: "Soir" };

interface SlotModalProps {
  dayKey: string;
  slot: "lunch" | "dinner";
  existing?: WeeklyPlan;
  meals: MealWithIngredients[];
  onSave: (dayKey: string, slot: "lunch" | "dinner", mealId: string, servings: number, existingId?: string) => void | Promise<void>;
  onRemove?: () => void | Promise<void>;
  onClose: () => void;
}

export default function SlotModal({
  dayKey,
  slot,
  existing,
  meals,
  onSave,
  onRemove,
  onClose,
}: SlotModalProps) {
  const existingMeal = existing ? meals.find((m) => m.id === existing.meal_id) : null;
  const [search, setSearch] = useState("");
  const [servings, setServings] = useState<number>(existing?.servings_planned ?? existingMeal?.servings ?? 2);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const filteredMeals = useMemo(() => {
    const filtered = meals.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
    // Met le repas actuellement assigné en haut de la liste (en édition)
    if (!existingMeal) return filtered;
    const idx = filtered.findIndex((m) => m.id === existingMeal.id);
    if (idx <= 0) return filtered;
    return [filtered[idx], ...filtered.slice(0, idx), ...filtered.slice(idx + 1)];
  }, [meals, search, existingMeal]);

  // Tap sur un repas → applique immédiatement
  const handlePickMeal = async (meal: MealWithIngredients) => {
    if (saving) return;
    const safeServings = Math.max(1, Math.floor(Number(servings) || 1));
    setSaving(true);
    try {
      await onSave(dayKey, slot, meal.id, safeServings, existing?.id);
    } finally {
      setSaving(false);
    }
  };

  // Confirme un changement de portions sans changer de repas
  const handleUpdateServings = async () => {
    if (!existing || !existingMeal || saving) return;
    const safeServings = Math.max(1, Math.floor(Number(servings) || 1));
    setSaving(true);
    try {
      await onSave(dayKey, slot, existingMeal.id, safeServings, existing.id);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemove || removing) return;
    setRemoving(true);
    try {
      await onRemove();
    } finally {
      setRemoving(false);
    }
  };

  const handleServingsChange = (raw: string) => {
    if (raw === "") { setServings(1); return; }
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 1) setServings(n);
  };

  const servingsChanged = existing && servings !== existing.servings_planned;

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && !removing && onClose()}>
      <DialogContent className="max-h-[85dvh] flex flex-col gap-0 p-0">
        {/* Header fixe */}
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle>
            {dayKeyLabel(dayKey)} — {SLOT_NAMES[slot]}
          </DialogTitle>
        </DialogHeader>

        {/* Barre d'actions TOUJOURS visible en haut (au-dessus du clavier mobile) */}
        <div className="px-6 pb-3 space-y-2 border-b">
          {/* Portions + bouton "Mettre à jour les portions" (en édition uniquement) */}
          {existing && existingMeal && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Portions
              </span>
              <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setServings((s) => Math.max(1, s - 1))}>–</Button>
              <Input
                type="number"
                min={1}
                value={servings}
                onChange={(e) => handleServingsChange(e.target.value)}
                className="w-14 text-center h-8"
              />
              <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setServings((s) => s + 1)}>+</Button>
              {servingsChanged && (
                <Button
                  size="sm"
                  className="ml-auto gap-1.5"
                  onClick={handleUpdateServings}
                  disabled={saving || removing}
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Appliquer
                </Button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onRemove && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/5 gap-1.5"
                onClick={handleRemove}
                disabled={saving || removing}
              >
                {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Retirer
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving || removing}
              className="ml-auto"
            >
              Annuler
            </Button>
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={existing ? "Changer pour un autre repas..." : "Rechercher un repas..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Aide */}
          <p className="text-[11px] text-muted-foreground">
            {existing ? "Touchez un repas pour le remplacer" : "Touchez un repas pour l'ajouter"}
          </p>
        </div>

        {/* Liste scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-3 min-h-0">
          {filteredMeals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucun repas trouvé</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredMeals.map((meal) => {
                const isCurrent = existingMeal?.id === meal.id;
                return (
                  <button
                    key={meal.id}
                    onClick={() => handlePickMeal(meal)}
                    disabled={saving || removing}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl border transition-all disabled:opacity-50",
                      isCurrent
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-transparent hover:bg-muted/50 active:bg-muted"
                    )}
                  >
                    <div className="font-medium text-sm flex items-center gap-1.5">
                      {meal.emoji && <Emoji emoji={meal.emoji} size={18} />}
                      <span>{meal.name}</span>
                      {isCurrent && (
                        <span className="ml-auto text-[10px] bg-primary text-primary-foreground rounded px-1.5 py-0.5 font-semibold">
                          Actuel
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {meal.servings} portion{meal.servings !== 1 ? "s" : ""} · {meal.meal_ingredients.length} ingrédient{meal.meal_ingredients.length !== 1 ? "s" : ""}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
