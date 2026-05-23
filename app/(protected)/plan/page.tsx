import { createClient } from "@/lib/supabase/server";
import PlanClient from "./plan-client";

export default async function PlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: weeklyPlan }, { data: meals }] = await Promise.all([
    supabase
      .from("weekly_plan")
      .select("*")
      .eq("user_id", user!.id),
    supabase
      .from("meals")
      .select("*, meal_ingredients(*)")
      .eq("user_id", user!.id)
      .order("name"),
  ]);

  return (
    <PlanClient
      initialPlan={weeklyPlan || []}
      meals={meals || []}
      userId={user!.id}
    />
  );
}
