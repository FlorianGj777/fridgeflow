import { createClient } from "@/lib/supabase/server";
import ShoppingClient from "./shopping-client";
import { getWeekStart, formatWeekStartDate } from "@/lib/utils";

export default async function ShoppingPage({
  searchParams,
}: {
  searchParams: { generate?: string; week?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const weekStart = getWeekStart();
  const weekStartDate =
    searchParams.week || formatWeekStartDate(weekStart);
  const shouldGenerate = searchParams.generate === "true";

  const [
    { data: shoppingList },
    { data: weeklyPlan },
    { data: meals },
    { data: fridgeItems },
  ] = await Promise.all([
    supabase
      .from("shopping_list")
      .select("*")
      .eq("user_id", user!.id)
      .order("ingredient_name"),
    supabase
      .from("weekly_plan")
      .select("*")
      .eq("user_id", user!.id)
      .eq("week_start_date", weekStartDate),
    supabase
      .from("meals")
      .select("*, meal_ingredients(*)")
      .eq("user_id", user!.id),
    supabase
      .from("fridge_items")
      .select("*")
      .eq("user_id", user!.id),
  ]);

  return (
    <ShoppingClient
      initialList={shoppingList || []}
      weeklyPlan={weeklyPlan || []}
      meals={meals || []}
      fridgeItems={fridgeItems || []}
      userId={user!.id}
      weekStartDate={weekStartDate}
      shouldGenerate={shouldGenerate}
    />
  );
}
