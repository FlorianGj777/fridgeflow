"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { WeeklyPlan, MealWithIngredients } from "@/types/database";
import {
  BASE_DAY_KEYS,
  EXTRA_DAY_KEYS,
  dayKeyLabel,
  sortDayKeys,
} from "@/lib/days";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShoppingCart, Plus, X } from "lucide-react";
import { toast } from "sonner";
import SlotModal from "@/components/slot-modal";
import Emoji from "@/components/emoji";

interface PlanClientProps {
  initialPlan: WeeklyPlan[];
  meals: MealWithIngredients[];
  userId: string;
  initialExtraDays: string[];
}

export default function PlanClient({
  initialPlan,
  meals,
  userId,
  initialExtraDays,
}: PlanClientProps) {
  const [plan, setPlan] = useState<WeeklyPlan[]>(initialPlan);
  const [selectedSlot, setSelectedSlot] = useState<{
    dayKey: string;
    slot: "lunch" | "dinner";
    existing?: WeeklyPlan;
  } | null>(null);
  // Jours extras affichés — persistés dans le profil utilisateur (synchronisé multi-appareils)
  const [pendingExtraDays, setPendingExtraDays] = useState<string[]>(initialExtraDays);

  const supabase = createClient();

  // Persiste les jours extras dans Supabase à chaque changement
  const persistExtraDays = useCallback(
    async (days: string[]) => {
      await supabase
        .from("profiles")
        .update({ extra_days: days })
        .eq("id", userId);
    },
    [supabase, userId]
  );

  // Recharge planning + extra_days
  const refetchAll = useCallback(async () => {
    const [{ data: planData }, { data: profileData }] = await Promise.all([
      supabase.from("weekly_plan").select("*").eq("user_id", userId),
      supabase.from("profiles").select("extra_days").eq("id", userId).single(),
    ]);
    if (planData) setPlan(planData);
    if (profileData?.extra_days) setPendingExtraDays(profileData.extra_days);
  }, [supabase, userId]);

  // Sync multi-appareils
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refetchAll();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refetchAll]);

  // Auto-cleanup orphelins (repas supprimés)
  useEffect(() => {
    const mealIds   = new Set(meals.map((m) => m.id));
    const orphanIds = plan.filter((p) => !mealIds.has(p.meal_id)).map((p) => p.id);
    if (orphanIds.length === 0) return;
    supabase
      .from("weekly_plan")
      .delete()
      .in("id", orphanIds)
      .then(() => {
        setPlan((prev) => prev.filter((p) => !orphanIds.includes(p.id)));
      });
  }, [meals]); // eslint-disable-line react-hooks/exhaustive-deps

  // Liste des jours à afficher : base + extras (avec repas ou pending)
  const visibleDayKeys = useMemo(() => {
    const fromPlan = plan.map((p) => p.day_key);
    const all      = new Set<string>([...BASE_DAY_KEYS, ...fromPlan, ...pendingExtraDays]);
    return sortDayKeys(Array.from(all));
  }, [plan, pendingExtraDays]);

  // Jours extras disponibles à ajouter (pas encore affichés)
  const availableExtras = useMemo(
    () => EXTRA_DAY_KEYS.filter((k) => !visibleDayKeys.includes(k)),
    [visibleDayKeys]
  );

  const getPlanSlots = (dayKey: string, slot: "lunch" | "dinner") =>
    plan
      .filter(
        (p) =>
          p.day_key === dayKey &&
          p.meal_slot === slot &&
          meals.some((m) => m.id === p.meal_id)
      );

  const getMeal = (mealId: string) => meals.find((m) => m.id === mealId);

  const handleSlotSave = async (
    dayKey: string,
    slot: "lunch" | "dinner",
    mealId: string,
    servings: number,
    existingId?: string
  ) => {
    if (existingId) {
      const { data, error } = await supabase
        .from("weekly_plan")
        .update({ meal_id: mealId, servings_planned: servings })
        .eq("id", existingId)
        .select()
        .single();
      if (error) {
        toast.error("Échec de la mise à jour.");
        return;
      }
      setPlan((prev) => prev.map((p) => (p.id === existingId ? data : p)));
    } else {
      const { data, error } = await supabase
        .from("weekly_plan")
        .insert({
          user_id: userId,
          day_key: dayKey,
          meal_slot: slot,
          meal_id: mealId,
          servings_planned: servings,
        })
        .select()
        .single();
      if (error) {
        toast.error("Échec de l'ajout au planning.");
        return;
      }
      setPlan((prev) => [...prev, data]);
    }
    setSelectedSlot(null);
  };

  const handleSlotRemove = async (planEntry: WeeklyPlan) => {
    const { error } = await supabase
      .from("weekly_plan")
      .delete()
      .eq("id", planEntry.id);
    if (error) {
      toast.error("Échec de la suppression.");
      return;
    }
    setPlan((prev) => prev.filter((p) => p.id !== planEntry.id));
    setSelectedSlot(null);
  };

  const removeExtraDay = async (dayKey: string) => {
    // Supprime toutes les entrées de ce jour
    const entriesToRemove = plan.filter((p) => p.day_key === dayKey);
    if (entriesToRemove.length > 0) {
      const ids = entriesToRemove.map((p) => p.id);
      await supabase.from("weekly_plan").delete().in("id", ids);
      setPlan((prev) => prev.filter((p) => p.day_key !== dayKey));
    }
    const newExtras = pendingExtraDays.filter((k) => k !== dayKey);
    setPendingExtraDays(newExtras);
    persistExtraDays(newExtras);
  };

  const addExtraDay = (dayKey: string) => {
    if (!pendingExtraDays.includes(dayKey) && !visibleDayKeys.includes(dayKey)) {
      const newExtras = [...pendingExtraDays, dayKey];
      setPendingExtraDays(newExtras);
      persistExtraDays(newExtras);
    }
  };

  const isExtraDay = (dayKey: string) =>
    !(BASE_DAY_KEYS as readonly string[]).includes(dayKey);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Planning</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Repas de la semaine
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => {
            window.location.href = "/shopping";
          }}
        >
          <ShoppingCart className="w-4 h-4" />
          Courses
        </Button>
      </div>

      {/* Ajouter un jour (au-dessus) */}
      {availableExtras.length > 0 && (
        <AddDayButton
          availableExtras={availableExtras}
          onAdd={addExtraDay}
          variant="top"
        />
      )}

      {/* Tableau des jours */}
      <div className="bg-card border rounded-lg overflow-hidden">
        {/* Header (desktop) */}
        <div className="hidden md:grid grid-cols-[140px_1fr_1fr_40px] gap-2 px-4 py-2 border-b bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <span>Jour</span>
          <span>Midi</span>
          <span>Soir</span>
          <span></span>
        </div>

        <div className="divide-y">
          {visibleDayKeys.map((dayKey) => {
            const lunchEntries  = getPlanSlots(dayKey, "lunch");
            const dinnerEntries = getPlanSlots(dayKey, "dinner");
            const extra         = isExtraDay(dayKey);

            return (
              <div
                key={dayKey}
                className="md:grid md:grid-cols-[140px_1fr_1fr_40px] md:gap-2 px-4 py-2.5 items-start"
              >
                {/* Day label */}
                <div className="flex items-center justify-between md:justify-start">
                  <span className={`font-semibold text-sm ${extra ? "text-primary" : ""}`}>
                    {dayKeyLabel(dayKey)}
                  </span>
                  {extra && (
                    <button
                      onClick={() => removeExtraDay(dayKey)}
                      className="md:ml-2 text-muted-foreground hover:text-destructive transition-colors p-0.5"
                      title="Retirer ce jour"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Midi */}
                <SlotCell
                  label="Midi"
                  entries={lunchEntries}
                  getMeal={getMeal}
                  onSelectExisting={(e) =>
                    setSelectedSlot({ dayKey, slot: "lunch", existing: e })
                  }
                  onAdd={() => setSelectedSlot({ dayKey, slot: "lunch" })}
                />

                {/* Soir */}
                <SlotCell
                  label="Soir"
                  entries={dinnerEntries}
                  getMeal={getMeal}
                  onSelectExisting={(e) =>
                    setSelectedSlot({ dayKey, slot: "dinner", existing: e })
                  }
                  onAdd={() => setSelectedSlot({ dayKey, slot: "dinner" })}
                />

                {/* spacer for grid */}
                <div className="hidden md:block" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Ajouter un jour (en-dessous) */}
      {availableExtras.length > 0 && (
        <AddDayButton
          availableExtras={availableExtras}
          onAdd={addExtraDay}
          variant="bottom"
        />
      )}

      {selectedSlot && (
        <SlotModal
          dayKey={selectedSlot.dayKey}
          slot={selectedSlot.slot}
          existing={selectedSlot.existing}
          meals={meals}
          onSave={handleSlotSave}
          onRemove={
            selectedSlot.existing
              ? () => handleSlotRemove(selectedSlot.existing!)
              : undefined
          }
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </div>
  );
}

// --- Cellule pour un créneau (midi ou soir) ---
function SlotCell({
  label,
  entries,
  getMeal,
  onSelectExisting,
  onAdd,
}: {
  label: string;
  entries: WeeklyPlan[];
  getMeal: (id: string) => MealWithIngredients | undefined;
  onSelectExisting: (e: WeeklyPlan) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-start gap-2 md:gap-0 mt-1.5 md:mt-0">
      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide w-8 md:hidden flex-shrink-0 pt-1">
        {label}
      </span>
      <div className="flex-1 min-w-0 space-y-1">
        {entries.map((entry) => {
          const meal = getMeal(entry.meal_id);
          if (!meal) return null;
          return (
            <button
              key={entry.id}
              onClick={() => onSelectExisting(entry)}
              className="flex items-center gap-1.5 w-full text-left hover:text-primary transition-colors"
            >
              {meal.emoji && (
                <Emoji emoji={meal.emoji} size={18} className="flex-shrink-0" />
              )}
              <span className="text-sm font-medium truncate">{meal.name}</span>
              {entry.servings_planned !== meal.servings && (
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  ×{entry.servings_planned}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={onAdd}
          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
        >
          <Plus className="w-3 h-3" />
          {entries.length === 0 && <span>Ajouter</span>}
        </button>
      </div>
    </div>
  );
}

// --- Bouton ajouter un jour avec dropdown ---
function AddDayButton({
  availableExtras,
  onAdd,
  variant,
}: {
  availableExtras: string[];
  onAdd: (key: string) => void;
  variant: "top" | "bottom";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 w-full md:w-auto ${variant === "top" ? "" : ""}`}
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter un jour
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
        {availableExtras.map((key) => (
          <DropdownMenuItem key={key} onClick={() => onAdd(key)}>
            {dayKeyLabel(key)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
