import {
  FridgeItem,
  MealWithIngredients,
  WeeklyPlan,
} from "@/types/database";
import {
  normalizeIngredientName,
  normalizeQuantity,
} from "@/lib/utils";

interface NeededIngredient {
  ingredient_name: string;
  quantity: number;
  unit: string;
  baseQuantity: number;
  baseUnit: string;
}

interface ShoppingItem {
  ingredient_name: string;
  quantity_needed: number;
  unit: string;
}

export function generateShoppingList(
  weeklyPlan: WeeklyPlan[],
  meals: MealWithIngredients[],
  fridgeItems: FridgeItem[]
): ShoppingItem[] {
  // Accumulate needed ingredients by normalized name + base unit
  const needed = new Map<string, NeededIngredient>();

  for (const slot of weeklyPlan) {
    // Ignorer les repas déjà marqués comme terminés
    if (slot.is_completed) continue;
    const meal = meals.find((m) => m.id === slot.meal_id);
    if (!meal) continue;

    const ratio = slot.servings_planned / meal.servings;

    for (const ingredient of meal.meal_ingredients) {
      const scaledQty = ingredient.quantity * ratio;
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

  // Build fridge lookup by normalized name + base unit
  const fridge = new Map<string, number>();
  for (const item of fridgeItems) {
    const normName = normalizeIngredientName(item.ingredient_name);
    const { quantity: baseQty, baseUnit } = normalizeQuantity(
      item.quantity,
      item.unit
    );
    const key = `${normName}__${baseUnit}`;
    fridge.set(key, (fridge.get(key) ?? 0) + baseQty);
  }

  // Compute what is missing
  const shoppingList: ShoppingItem[] = [];

  for (const [key, item] of needed.entries()) {
    const fridgeQty = fridge.get(key) ?? 0;
    const missing = Math.max(0, item.baseQuantity - fridgeQty);

    if (missing > 0) {
      // Convert back from base units to original unit
      const quantityInOriginalUnit = reverseNormalize(missing, item.unit);
      shoppingList.push({
        ingredient_name: item.ingredient_name,
        quantity_needed: quantityInOriginalUnit,
        unit: item.unit,
      });
    }
  }

  return shoppingList;
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
