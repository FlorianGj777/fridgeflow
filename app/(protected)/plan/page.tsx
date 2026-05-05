import { createClient } from "@/lib/supabase/server";
import PlanClient from "./plan-client";
import { getWeekStart, formatWeekStartDate } from "@/lib/utils";

export default async function PlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const weekStart = getWeekStart();
  const weekStartDate = formatWeekStartDate(weekStart);

  const [{ data: weeklyPlan }, { data: meals }] = await Promise.all([
    supabase
      .from("weekly_plan")
      .select("*")
      .eq("user_id", user!.id)
      .eq("week_start_date", weekStartDate),
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
      initialWeekStart={weekStartDate}
    />
  );
}
