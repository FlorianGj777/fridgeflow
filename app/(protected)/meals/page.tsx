import { createClient } from "@/lib/supabase/server";
import MealsClient from "./meals-client";

export default async function MealsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: meals }, { data: fridgeItems }] = await Promise.all([
    supabase
      .from("meals")
      .select("*, meal_ingredients(*)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("fridge_items")
      .select("ingredient_name")
      .eq("user_id", user!.id),
  ]);

  const fridgeIngredients = (fridgeItems ?? []).map((i) => i.ingredient_name);

  return (
    <MealsClient
      initialMeals={meals || []}
      userId={user!.id}
      fridgeIngredients={fridgeIngredients}
    />
  );
}
