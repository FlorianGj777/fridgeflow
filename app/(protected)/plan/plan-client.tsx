"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { WeeklyPlan, MealWithIngredients } from "@/types/database";
import { getWeekStart, formatWeekStartDate, addDays, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

  const supabase     = createClient();
  const weekStartObj = new Date(weekStartDate + "T00:00:00");

  // Recharge le planning depuis Supabase
  const refetchPlan = useCallback(async (weekDate: string) => {
    const { data } = await supabase
      .from("weekly_plan").select("*")
      .eq("user_id", userId).eq("week_start_date", weekDate);
    if (data) setPlan(data);
  }, [supabase, userId]);

  // Auto-cleanup : supprime les entrées dont le repas n'existe plus
  // (sécurité supplémentaire si des orphelins se sont créés avant la cascade)
  useEffect(() => {
    const mealIds       = new Set(meals.map((m) => m.id));
    const orphanIds     = plan.filter((p) => !mealIds.has(p.meal_id)).map((p) => p.id);
    if (orphanIds.length === 0) return;
    supabase.from("weekly_plan").delete().in("id", orphanIds).then(() => {
      setPlan((prev) => prev.filter((p) => !orphanIds.includes(p.id)));
    });
  }, [meals]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync automatique quand l'app redevient visible (changement d'onglet / retour sur l'app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refetchPlan(weekStartDate);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [weekStartDate, refetchPlan]);

  const navigateWeek = async (direction: -1 | 1) => {
    setLoadingWeek(true);
    const newStart     = addDays(weekStartObj, direction * 7);
    const newStartDate = formatWeekStartDate(newStart);
    setWeekStartDate(newStartDate);
    await refetchPlan(newStartDate);
    setLoadingWeek(false);
  };

  // Retourne TOUS les repas d'un créneau (supporte plusieurs repas par créneau)
  // Filtre les orphelins : entrées dont le repas a été supprimé
  const getPlanSlots = (dayIndex: number, slot: "lunch" | "dinner") =>
    plan.filter(
      (p) =>
        p.day_of_week === dayIndex &&
        p.meal_slot === slot &&
        meals.some((m) => m.id === p.meal_id)
    );

  const getMeal = (mealId: string) => meals.find((m) => m.id === mealId);

  const handleSlotSave = async (
    dayIndex: number,
    slot: "lunch" | "dinner",
    mealId: string,
    servings: number,
    existingId?: string
  ) => {
    if (existingId) {
      // Mise à jour d'un repas existant
      const { data, error } = await supabase.from("weekly_plan")
        .update({ meal_id: mealId, servings_planned: servings })
        .eq("id", existingId).select().single();
      if (error) { toast.error("Échec de la mise à jour."); return; }
      setPlan((prev) => prev.map((p) => (p.id === existingId ? data : p)));
    } else {
      // Toujours insérer un nouveau repas (plusieurs par créneau possibles)
      const { data, error } = await supabase.from("weekly_plan")
        .insert({
          user_id: userId,
          week_start_date: weekStartDate,
          day_of_week: dayIndex,
          meal_slot: slot,
          meal_id: mealId,
          servings_planned: servings,
        })
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
      // Protection contre division par zéro / NaN si meal.servings est invalide
      if (!meal.servings || meal.servings < 1) throw new Error("Portions invalides");
      const ratio = planEntry.servings_planned / meal.servings;

      // Marquer le planning comme fait — si ça échoue, on ne touche pas au frigo
      const { error: planErr } = await supabase
        .from("weekly_plan").update({ is_completed: true }).eq("id", planEntry.id);
      if (planErr) throw planErr;

      // Mise à jour du frigo (best-effort : un échec ici ne défait pas le marquage)
      for (const ing of meal.meal_ingredients) {
        if (!ing.ingredient_name?.trim()) continue;
        const needed   = ing.quantity * ratio;
        if (!isFinite(needed) || needed <= 0) continue;
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
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateWeek(-1)} disabled={loadingWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center text-sm font-medium text-muted-foreground">
          Semaine du {formatDate(weekStartObj)}
        </div>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateWeek(1)} disabled={loadingWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grille des jours */}
      <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-7 md:gap-2">
        {DAYS_SHORT.map((day, dayIndex) => {
          const dayDate = addDays(weekStartObj, dayIndex);
          const isToday = formatDate(dayDate) === formatDate(new Date());

          return (
            <div
              key={day}
              className={`bg-card border rounded-lg overflow-hidden flex flex-col ${isToday ? "border-primary/40" : ""}`}
            >
              {/* En-tête du jour */}
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
                  const planEntries = getPlanSlots(dayIndex, slot);
                  const slotLabel   = slot === "lunch" ? "Midi" : "Soir";

                  return (
                    <div key={slot} className="px-3 py-2 flex items-start gap-2 md:flex-col md:gap-1 md:min-h-[60px]">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide w-8 md:w-auto flex-shrink-0 pt-0.5 md:pt-0">
                        {slotLabel}
                      </span>
                      <div className="flex-1 min-w-0 md:w-full space-y-1">
                        {planEntries.map((planEntry) => {
                          const meal = getMeal(planEntry.meal_id);
                          if (!meal) return null;
                          return (
                            <div key={planEntry.id} className="flex items-center gap-1.5">
                              <div className="flex-1 min-w-0">
                                {planEntry.is_completed ? (
                                  <span className="text-xs text-muted-foreground line-through leading-snug block truncate">
                                    {meal.name}
                                  </span>
                                ) : (
                                  <button
                                    className="text-xs font-medium text-left leading-snug hover:text-primary transition-colors w-full truncate block"
                                    onClick={() => setSelectedSlot({ dayIndex, slot, existing: planEntry })}
                                  >
                                    {meal.name}
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {!planEntry.is_completed && (
                                  <span className="text-[10px] text-muted-foreground">×{planEntry.servings_planned}</span>
                                )}
                                {planEntry.is_completed ? (
                                  <span className="text-[10px] bg-muted text-muted-foreground rounded px-1 py-0.5 font-medium">Fait</span>
                                ) : (
                                  <button
                                    onClick={() => handleMarkDone(planEntry)}
                                    disabled={markingDone === planEntry.id}
                                    className="w-5 h-5 rounded border border-border hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-colors flex-shrink-0"
                                    title="Marquer comme fait"
                                  >
                                    <Check className="w-2.5 h-2.5 text-muted-foreground" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {/* Bouton ajouter un repas (toujours visible) */}
                        <button
                          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
                          onClick={() => setSelectedSlot({ dayIndex, slot })}
                        >
                          <Plus className="w-3 h-3" />
                          {planEntries.length === 0 && <span className="md:hidden">Ajouter</span>}
                        </button>
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

    </div>
  );
}
