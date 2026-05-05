"use client";

import { useState, useMemo } from "react";
import { WeeklyPlan, MealWithIngredients } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, Trash2, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const SLOT_NAMES: Record<string, string> = { lunch: "Déjeuner", dinner: "Dîner" };

interface SlotModalProps {
  dayIndex: number;
  slot: "lunch" | "dinner";
  existing?: WeeklyPlan;
  meals: MealWithIngredients[];
  onSave: (dayIndex: number, slot: "lunch" | "dinner", mealId: string, servings: number) => void;
  onRemove?: () => void;
  onClose: () => void;
}

export default function SlotModal({
  dayIndex,
  slot,
  existing,
  meals,
  onSave,
  onRemove,
  onClose,
}: SlotModalProps) {
  const existingMeal = existing ? meals.find((m) => m.id === existing.meal_id) : null;
  const [search, setSearch] = useState("");
  const [selectedMeal, setSelectedMeal] = useState<MealWithIngredients | null>(existingMeal ?? null);
  const [servings, setServings] = useState(existing?.servings_planned ?? existingMeal?.servings ?? 2);

  const filteredMeals = useMemo(
    () => meals.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())),
    [meals, search]
  );

  const handleSave = () => {
    if (!selectedMeal) return;
    onSave(dayIndex, slot, selectedMeal.id, servings);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85dvh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {DAY_NAMES[dayIndex]} — {SLOT_NAMES[slot]}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un repas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            {filteredMeals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucun repas trouvé</p>
              </div>
            ) : (
              filteredMeals.map((meal) => (
                <button
                  key={meal.id}
                  onClick={() => { setSelectedMeal(meal); setServings(meal.servings); }}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl border transition-all",
                    selectedMeal?.id === meal.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-transparent hover:bg-muted/50"
                  )}
                >
                  <div className="font-medium text-sm">{meal.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {meal.servings} portion{meal.servings !== 1 ? "s" : ""} · {meal.meal_ingredients.length} ingrédient{meal.meal_ingredients.length !== 1 ? "s" : ""}
                  </div>
                </button>
              ))
            )}
          </div>

          {selectedMeal && (
            <div className="border-t pt-4 space-y-1.5">
              <Label htmlFor="servings">Portions pour ce jour</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setServings((s) => Math.max(1, s - 1))}>–</Button>
                <Input id="servings" type="number" min={1} value={servings} onChange={(e) => setServings(Number(e.target.value))} className="w-16 text-center" />
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setServings((s) => s + 1)}>+</Button>
                <span className="text-sm text-muted-foreground">(défaut : {selectedMeal.servings})</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 gap-2">
          {onRemove && (
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/5 gap-1.5 mr-auto" onClick={onRemove}>
              <Trash2 className="w-3.5 h-3.5" />
              Retirer
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={!selectedMeal}>
            {existing ? "Mettre à jour" : "Ajouter au planning"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
