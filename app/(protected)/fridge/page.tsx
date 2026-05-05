import { createClient } from "@/lib/supabase/server";
import FridgeClient from "./fridge-client";

export default async function FridgePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: items }, { data: mealsData }] = await Promise.all([
    supabase.from("fridge_items").select("*").eq("user_id", user!.id).order("ingredient_name"),
    supabase.from("meals").select("meal_ingredients(ingredient_name)").eq("user_id", user!.id),
  ]);

  const allIngredients = [
    ...new Set(
      (mealsData ?? []).flatMap((m) =>
        (m.meal_ingredients as { ingredient_name: string }[]).map((i) => i.ingredient_name)
      )
    ),
  ].sort((a, b) => a.localeCompare(b, "fr"));

  return <FridgeClient initialItems={items || []} userId={user!.id} allIngredients={allIngredients} />;
}
