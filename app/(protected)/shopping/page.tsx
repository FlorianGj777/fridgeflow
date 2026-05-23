import { createClient } from "@/lib/supabase/server";
import ShoppingClient from "./shopping-client";
import { normalizeIngredientName } from "@/lib/utils";

export default async function ShoppingPage({
  searchParams,
}: {
  searchParams: { generate?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const shouldGenerate = searchParams.generate === "true";

  const [
    { data: shoppingList },
    { data: weeklyPlan },
    { data: meals },
  ] = await Promise.all([
    supabase
      .from("shopping_list")
      .select("*")
      .eq("user_id", user!.id)
      .order("ingredient_name"),
    supabase
      .from("weekly_plan")
      .select("*")
      .eq("user_id", user!.id),
    supabase
      .from("meals")
      .select("*, meal_ingredients(*)")
      .eq("user_id", user!.id),
  ]);

  // Auto-sync : tous les ingrédients des repas doivent être dans la liste
  // (cochés = "j'ai en stock", is_manual=false car ils viennent des repas)
  let finalList = shoppingList || [];
  if (meals && meals.length > 0) {
    const existingKeys = new Set(
      finalList.map(
        (item) => `${normalizeIngredientName(item.ingredient_name)}__${item.unit}`
      )
    );

    const seenKeys = new Set<string>();
    const toAdd: {
      user_id: string;
      ingredient_name: string;
      quantity_needed: number;
      unit: string;
      is_purchased: boolean;
      is_manual: boolean;
    }[] = [];

    for (const meal of meals) {
      for (const ing of meal.meal_ingredients) {
        if (!ing.ingredient_name?.trim()) continue;
        const key = `${normalizeIngredientName(ing.ingredient_name)}__${ing.unit}`;
        if (existingKeys.has(key) || seenKeys.has(key)) continue;
        seenKeys.add(key);
        toAdd.push({
          user_id: user!.id,
          ingredient_name: ing.ingredient_name.trim(),
          quantity_needed: 1,
          unit: ing.unit,
          is_purchased: true,
          is_manual: false,
        });
      }
    }

    if (toAdd.length > 0) {
      await supabase.from("shopping_list").insert(toAdd);
      const { data: refreshed } = await supabase
        .from("shopping_list")
        .select("*")
        .eq("user_id", user!.id)
        .order("ingredient_name");
      if (refreshed) finalList = refreshed;
    }
  }

  return (
    <ShoppingClient
      initialList={finalList}
      weeklyPlan={weeklyPlan || []}
      meals={meals || []}
      userId={user!.id}
      shouldGenerate={shouldGenerate}
    />
  );
}
