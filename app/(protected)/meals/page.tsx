import { createClient } from "@/lib/supabase/server";
import MealsClient from "./meals-client";

export default async function MealsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: meals } = await supabase
    .from("meals")
    .select("*, meal_ingredients(*)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <MealsClient
      initialMeals={meals || []}
      userId={user!.id}
    />
  );
}
