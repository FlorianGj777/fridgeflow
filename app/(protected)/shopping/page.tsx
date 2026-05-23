import { createClient } from "@/lib/supabase/server";
import ShoppingClient from "./shopping-client";

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

  return (
    <ShoppingClient
      initialList={shoppingList || []}
      weeklyPlan={weeklyPlan || []}
      meals={meals || []}
      userId={user!.id}
      shouldGenerate={shouldGenerate}
    />
  );
}
