import { MealWithIngredients, WeeklyPlan } from "@/types/database";
import { normalizeIngredientName, normalizeQuantity } from "@/lib/utils";

interface NeededIngredient {
  ingredient_name: string;
  quantity: number;
  unit: string;
  baseQuantity: number;
  baseUnit: string;
}

export interface NeededItem {
  ingredient_name: string;
  normalized_name: string;
  quantity_needed: number;
  unit: string;
}

/**
 * Calcule, à partir du planning + recettes, les quantités totales nécessaires
 * pour chaque ingrédient. Pas de soustraction du frigo (qui n'existe plus).
 */
export function computeNeededIngredients(
  weeklyPlan: WeeklyPlan[],
  meals: MealWithIngredients[]
): NeededItem[] {
  const needed = new Map<string, NeededIngredient>();

  for (const slot of weeklyPlan) {
    // Ignore les repas déjà cochés (mangés ou disponibles)
    if (slot.is_completed) continue;
    const meal = meals.find((m) => m.id === slot.meal_id);
    if (!meal) continue;
    if (!meal.servings || meal.servings < 1) continue;

    const ratio = slot.servings_planned / meal.servings;

    for (const ingredient of meal.meal_ingredients) {
      if (!ingredient.ingredient_name?.trim()) continue;
      const scaledQty = ingredient.quantity * ratio;
      if (!isFinite(scaledQty) || scaledQty <= 0) continue;

      const { quantity: baseQty, baseUnit } = normalizeQuantity(
        scaledQty,
        ingredient.unit
      );
      const normName = normalizeIngredientName(ingredient.ingredient_name);
      const key = `${normName}__${baseUnit}`;

      if (needed.has(key)) {
        const existing = needed.get(key)!;
        needed.set(key, {
          ...existing,
          quantity: existing.quantity + scaledQty,
          baseQuantity: existing.baseQuantity + baseQty,
        });
      } else {
        needed.set(key, {
          ingredient_name: ingredient.ingredient_name,
          quantity: scaledQty,
          unit: ingredient.unit,
          baseQuantity: baseQty,
          baseUnit,
        });
      }
    }
  }

  // Convertit les quantités dans l'unité d'origine
  const result: NeededItem[] = [];
  for (const item of needed.values()) {
    const qty = reverseNormalize(item.baseQuantity, item.unit);
    result.push({
      ingredient_name: item.ingredient_name,
      normalized_name: normalizeIngredientName(item.ingredient_name),
      quantity_needed: Math.round(qty * 100) / 100,
      unit: item.unit,
    });
  }
  return result;
}

function reverseNormalize(baseQuantity: number, targetUnit: string): number {
  const UNIT_TO_BASE: Record<string, number> = {
    g: 1,
    kg: 1000,
    ml: 1,
    L: 1000,
    unit: 1,
    tbsp: 15,
    tsp: 5,
    pinch: 0.5,
  };
  const factor = UNIT_TO_BASE[targetUnit] ?? 1;
  return baseQuantity / factor;
}
