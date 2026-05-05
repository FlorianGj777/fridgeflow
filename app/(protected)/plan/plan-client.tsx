"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WeeklyPlan, MealWithIngredients } from "@/types/database";
import { getWeekStart, formatWeekStartDate, addDays, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, ShoppingCart, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import SlotModal from "@/components/slot-modal";

const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAYS_FULL  = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

interface PlanClientProps {
  initialPlan: WeeklyPlan[];
  meals: MealWithIngredients[];
  userId: string;
  initialWeekStart: string;
}

export default function PlanClient({ initialPlan, meals, userId, initialWeekStart }: PlanClientProps) {
  const [weekStartDate, setWeekStartDate]   = useState(initialWeekStart);
  const [plan, setPlan]                     = useState<WeeklyPlan[]>(initialPlan);
  const [loadingWeek, setLoadingWeek]       = useState(false);
  const [selectedSlot, setSelectedSlot]     = useState<{ dayIndex: number; slot: "lunch" | "dinner"; existing?: WeeklyPlan } | null>(null);
  const [generatingList, setGeneratingList] = useState(false);
  const [markingDone, setMarkingDone]       = useState<string | null>(null);
  const [confirmDone, setConfirmDone]       = useState<WeeklyPlan | null>(null);

  const supabase    = createClient();
  const weekStartObj = new Date(weekStartDate + "T00:00:00");

  const navigateWeek = async (direction: -1 | 1) => {
    setLoadingWeek(true);
    const newStart     = addDays(weekStartObj, direction * 7);
    const newStartDate = formatWeekStartDate(newStart);
    setWeekStartDate(newStartDate);
    const { data } = await supabase
      .from("weekly_plan").select("*")
      .eq("user_id", userId).eq("week_start_date", newStartDate);
    setPlan(data || []);
    setLoadingWeek(false);
  };

  const getPlanSlot = (dayIndex: number, slot: "lunch" | "dinner") =>
    plan.find((p) => p.day_of_week === dayIndex && p.meal_slot === slot);

  const getMeal = (mealId: string) => meals.find((m) => m.id === mealId);

  const handleSlotSave = async (dayIndex: number, slot: "lunch" | "dinner", mealId: string, servings: number) => {
    const existing = getPlanSlot(dayIndex, slot);
    if (existing) {
      const { data, error } = await supabase.from("weekly_plan")
        .update({ meal_id: mealId, servings_planned: servings }).eq("id", existing.id).select().single();
      if (error) { toast.error("Échec de la mise à jour."); return; }
      setPlan((prev) => prev.map((p) => (p.id === existing.id ? data : p)));
    } else {
      const { data, error } = await supabase.from("weekly_plan")
        .insert({ user_id: userId, week_start_date: weekStartDate, day_of_week: dayIndex, meal_slot: slot, meal_id: mealId, servings_planned: servings })
        .select().single();
      if (error) { toast.error("Échec de l'ajout au planning."); return; }
      setPlan((prev) => [...prev, data]);
    }
    setSelectedSlot(null);
  };

  const handleSlotRemove = async (planEntry: WeeklyPlan) => {
    const { error } = await supabase.from("weekly_plan").delete().eq("id", planEntry.id);
    if (error) { toast.error("Échec de la suppression."); return; }
    setPlan((prev) => prev.filter((p) => p.id !== planEntry.id));
    setSelectedSlot(null);
  };

  const handleMarkDone = async (planEntry: WeeklyPlan) => {
    setMarkingDone(planEntry.id);
    try {
      const meal = getMeal(planEntry.meal_id);
      if (!meal) throw new Error("Repas introuvable");
      const ratio = planEntry.servings_planned / meal.servings;

      await supabase.from("weekly_plan").update({ is_completed: true }).eq("id", planEntry.id);

      for (const ing of meal.meal_ingredients) {
        const needed = ing.quantity * ratio;
        const normName = ing.ingredient_name.toLowerCase().trim();
        const { data: fridgeItems } = await supabase.from("fridge_items").select("*")
          .eq("user_id", userId).ilike("ingredient_name", normName).eq("unit", ing.unit);
        if (fridgeItems && fridgeItems.length > 0) {
          const fridgeItem = fridgeItems[0];
          await supabase.from("fridge_items")
            .update({ quantity: Math.max(0, fridgeItem.quantity - needed) }).eq("id", fridgeItem.id);
        }
      }

      setPlan((prev) => prev.map((p) => (p.id === planEntry.id ? { ...p, is_completed: true } : p)));
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setMarkingDone(null);
      setConfirmDone(null);
    }
  };

  const isCurrentWeek = weekStartDate === formatWeekStartDate(getWeekStart());

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Planning Semaine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatDate(weekStartObj)} – {formatDate(addDays(weekStartObj, 6))}
            {isCurrentWeek && (
              <span className="ml-1.5 text-primary font-medium">· cette semaine</span>
            )}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setGeneratingList(true);
            window.location.href = `/shopping?generate=true&week=${weekStartDate}`;
          }}
          disabled={generatingList}
        >
          <ShoppingCart className="w-4 h-4" />
          Courses
        </Button>
      </div>

      {/* Navigation semaine */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline" size="icon"
          className="h-8 w-8"
          onClick={() => navigateWeek(-1)}
          disabled={loadingWeek}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center text-sm font-medium text-muted-foreground">
          Semaine du {formatDate(weekStartObj)}
        </div>
        <Button
          variant="outline" size="icon"
          className="h-8 w-8"
          onClick={() => navigateWeek(1)}
          disabled={loadingWeek}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grille des jours — liste sur mobile, colonnes sur desktop */}
      <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-7 md:gap-2">
        {DAYS_SHORT.map((day, dayIndex) => {
          const dayDate    = addDays(weekStartObj, dayIndex);
          const lunchSlot  = getPlanSlot(dayIndex, "lunch");
          const dinnerSlot = getPlanSlot(dayIndex, "dinner");
          const isToday    = formatDate(dayDate) === formatDate(new Date());

          return (
            <div
              key={day}
              className={`bg-card border rounded-lg overflow-hidden flex flex-col ${isToday ? "border-primary/40" : ""}`}
            >
              {/* Day header */}
              <div className={`px-3 py-2 flex items-center gap-2 border-b md:flex-col md:items-start md:gap-0.5 ${isToday ? "bg-primary/5" : "bg-muted/30"}`}>
                <span className="font-semibold text-sm">{DAYS_FULL[dayIndex]}</span>
                <span className="text-xs text-muted-foreground">{formatDate(dayDate)}</span>
                {isToday && (
                  <span className="ml-auto md:ml-0 text-[10px] bg-primary text-primary-foreground rounded px-1.5 py-0.5 font-semibold">
                    Auj.
                  </span>
                )}
              </div>

              <div className="divide-y flex-1">
                {(["lunch", "dinner"] as const).map((slot) => {
                  const planEntry = slot === "lunch" ? lunchSlot : dinnerSlot;
                  const meal      = planEntry ? getMeal(planEntry.meal_id) : null;
                  const slotLabel = slot === "lunch" ? "Midi" : "Soir";

                  return (
                    <div key={slot} className="px-3 py-2 flex items-start gap-2 md:flex-col md:gap-1 md:min-h-[60px]">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide w-8 md:w-auto flex-shrink-0 pt-0.5 md:pt-0">
                        {slotLabel}
                      </span>
                      <div className="flex-1 min-w-0 flex items-center gap-1.5 md:flex-col md:items-start md:gap-1">
                        {meal ? (
                          <>
                            {planEntry?.is_completed ? (
                              <span className="text-xs text-muted-foreground line-through leading-snug">{meal.name}</span>
                            ) : (
                              <button
                                className="text-xs font-medium text-left leading-snug hover:text-primary transition-colors w-full"
                                onClick={() => setSelectedSlot({ dayIndex, slot, existing: planEntry })}
                              >
                                {meal.name}
                              </button>
                            )}
                            <div className="flex items-center gap-1 flex-shrink-0 md:flex-shrink">
                              {planEntry && !planEntry.is_completed && (
                                <span className="text-[10px] text-muted-foreground">×{planEntry.servings_planned}</span>
                              )}
                              {planEntry?.is_completed && (
                                <span className="text-[10px] bg-muted text-muted-foreground rounded px-1 py-0.5 font-medium">Fait</span>
                              )}
                              {planEntry && !planEntry.is_completed && (
                                <button
                                  onClick={() => setConfirmDone(planEntry)}
                                  disabled={markingDone === planEntry.id}
                                  className="w-5 h-5 rounded border border-border hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-colors flex-shrink-0"
                                  title="Marquer comme fait"
                                >
                                  <Check className="w-2.5 h-2.5 text-muted-foreground" />
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <button
                            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
                            onClick={() => setSelectedSlot({ dayIndex, slot })}
                          >
                            <Plus className="w-3 h-3" />
                            <span className="md:hidden">Ajouter</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedSlot && (
        <SlotModal
          dayIndex={selectedSlot.dayIndex}
          slot={selectedSlot.slot}
          existing={selectedSlot.existing}
          meals={meals}
          onSave={handleSlotSave}
          onRemove={selectedSlot.existing ? () => handleSlotRemove(selectedSlot.existing!) : undefined}
          onClose={() => setSelectedSlot(null)}
        />
      )}

      <AlertDialog open={!!confirmDone} onOpenChange={(open) => !open && setConfirmDone(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marquer comme fait ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le repas sera marqué comme terminé et les ingrédients utilisés seront déduits de votre frigo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleMarkDone(confirmDone!)}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
