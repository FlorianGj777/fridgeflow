"use client";

import { useState } from "react";
import { MealWithIngredients, MealIngredient, UNITS, Unit } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Loader2 } from "lucide-react";
import IngredientInput from "@/components/ingredient-input";

type IngredientDraft = {
  id?: string;
  ingredient_name: string;
  quantity: number;
  unit: Unit;
};

interface MealFormProps {
  meal: MealWithIngredients | null;
  onSave: (
    data: Omit<MealWithIngredients, "id" | "user_id" | "created_at">
  ) => void;
  onClose: () => void;
  loading: boolean;
  allIngredients: string[];
}

export default function MealForm({
  meal,
  onSave,
  onClose,
  loading,
  allIngredients,
}: MealFormProps) {
  const [name, setName] = useState(meal?.name ?? "");
  const [description, setDescription] = useState(meal?.description ?? "");
  const [servings, setServings] = useState(meal?.servings ?? 2);
  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    meal?.meal_ingredients.map((i) => ({
      id: i.id,
      ingredient_name: i.ingredient_name,
      quantity: i.quantity,
      unit: i.unit as Unit,
    })) ?? [{ ingredient_name: "", quantity: 1, unit: "unit" as Unit }]
  );

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { ingredient_name: "", quantity: 1, unit: "unit" as Unit },
    ]);
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const updateIngredient = (
    index: number,
    field: keyof IngredientDraft,
    value: string | number
  ) => {
    setIngredients((prev) =>
      prev.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validIngredients = ingredients
      .filter((i) => i.ingredient_name.trim())
      .map((i) => ({
        id: i.id ?? crypto.randomUUID(),
        meal_id: meal?.id ?? "",
        ingredient_name: i.ingredient_name.trim(),
        quantity: Number(i.quantity) || 1,
        unit: i.unit,
      })) as MealIngredient[];

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      servings: Number(servings) || 2,
      meal_ingredients: validIngredients,
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meal ? "Modifier le repas" : "Nouveau repas"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom du repas *</Label>
            <Input
              id="name"
              placeholder="ex. Pâtes Carbonara"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Notes ou description courte..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Portions */}
          <div className="space-y-1.5">
            <Label htmlFor="servings">Portions par défaut</Label>
            <Input
              id="servings"
              type="number"
              min={1}
              max={20}
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className="w-24"
            />
          </div>

          {/* Ingrédients */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ingrédients</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addIngredient}
                className="h-7 text-xs gap-1 text-primary"
              >
                <Plus className="w-3 h-3" />
                Ajouter
              </Button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <IngredientInput
                    value={ing.ingredient_name}
                    onChange={(v) => updateIngredient(index, "ingredient_name", v)}
                    allIngredients={allIngredients}
                    placeholder="Nom de l'ingrédient"
                    className="flex-1 text-sm"
                  />
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={ing.quantity}
                    onChange={(e) =>
                      updateIngredient(index, "quantity", e.target.value)
                    }
                    className="w-16 text-sm"
                  />
                  <Select
                    value={ing.unit}
                    onValueChange={(v) => updateIngredient(index, "unit", v)}
                  >
                    <SelectTrigger className="w-20 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeIngredient(index)}
                    disabled={ingredients.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : meal ? (
                "Enregistrer"
              ) : (
                "Créer le repas"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
