"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ShoppingListItem, WeeklyPlan, MealWithIngredients, FridgeItem, UNITS, Unit,
} from "@/types/database";
import { generateShoppingList } from "@/lib/shopping-logic";
import { categorizeIngredient, displayQuantity } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShoppingCart, RefreshCw, Plus, Trash2, Loader2, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import IngredientInput from "@/components/ingredient-input";

// Traduction des catégories
const CATEGORY_FR: Record<string, string> = {
  "Produce": "Fruits & Légumes",
  "Dairy": "Produits laitiers",
  "Meat & Fish": "Viandes & Poissons",
  "Grains & Pasta": "Céréales & Pâtes",
  "Canned & Pantry": "Conserves & Épicerie",
  "Frozen": "Surgelés",
  "Beverages": "Boissons",
  "Bakery": "Boulangerie",
  "Other": "Autre",
};

interface ShoppingClientProps {
  initialList: ShoppingListItem[];
  weeklyPlan: WeeklyPlan[];
  meals: MealWithIngredients[];
  fridgeItems: FridgeItem[];
  userId: string;
  weekStartDate: string;
  shouldGenerate: boolean;
}

export default function ShoppingClient({
  initialList, weeklyPlan, meals, fridgeItems, userId, weekStartDate, shouldGenerate,
}: ShoppingClientProps) {
  const [list, setList] = useState<ShoppingListItem[]>(initialList);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [manualName, setManualName] = useState("");
  const [manualQty, setManualQty] = useState<number>(1);
  const [manualUnit, setManualUnit] = useState<Unit>("unit");

  const supabase = createClient();

  // Agrège les ingrédients connus : repas + frigo + liste de courses (mis à jour automatiquement)
  const allIngredients = useMemo(() => {
    const names = new Set<string>();
    for (const meal of meals) {
      for (const ing of meal.meal_ingredients) {
        if (ing.ingredient_name.trim()) names.add(ing.ingredient_name.trim());
      }
    }
    for (const item of fridgeItems) {
      if (item.ingredient_name.trim()) names.add(item.ingredient_name.trim());
    }
    for (const item of list) {
      if (item.ingredient_name.trim()) names.add(item.ingredient_name.trim());
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "fr"));
  }, [meals, fridgeItems, list]);

  useEffect(() => {
    if (shouldGenerate) handleGenerate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync multi-appareils : recharge la liste de courses quand l'app redevient visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible") return;
      const { data } = await supabase
        .from("shopping_list")
        .select("*")
        .eq("user_id", userId)
        .order("ingredient_name");
      if (data) setList(data);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [supabase, userId]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const generated = generateShoppingList(weeklyPlan, meals, fridgeItems);
      await supabase.from("shopping_list").delete().eq("user_id", userId).eq("is_manual", false);

      if (generated.length > 0) {
        const { data, error } = await supabase.from("shopping_list").insert(
          generated.map((item) => ({ user_id: userId, ingredient_name: item.ingredient_name, quantity_needed: item.quantity_needed, unit: item.unit, is_purchased: false, week_start_date: weekStartDate, is_manual: false }))
        ).select();
        if (error) throw error;
        setList((prev) => [...prev.filter((i) => i.is_manual), ...(data || [])]);
      } else {
        setList((prev) => prev.filter((i) => i.is_manual));
      }

    } catch {
      toast.error("Échec de la génération de la liste.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePurchased = async (item: ShoppingListItem) => {
    const newValue = !item.is_purchased;
    const { data, error } = await supabase.from("shopping_list").update({ is_purchased: newValue }).eq("id", item.id).select().single();
    if (error) { toast.error("Échec de la mise à jour."); return; }
    setList((prev) => prev.map((i) => (i.id === item.id ? data : i)));

    // ⚠️ Récupère l'état frigo FRAIS depuis la DB (les props sont stales,
    // notamment après plusieurs toggles successifs ou si autre appareil)
    const { data: currentFridge } = await supabase
      .from("fridge_items")
      .select("*")
      .eq("user_id", userId)
      .ilike("ingredient_name", item.ingredient_name)
      .eq("unit", item.unit);

    const existing = currentFridge?.[0];

    try {
      if (newValue) {
        // Coché → ajouter au frigo
        if (existing) {
          const { error: e } = await supabase.from("fridge_items").update({ quantity: existing.quantity + item.quantity_needed }).eq("id", existing.id);
          if (e) throw e;
        } else {
          const { error: e } = await supabase.from("fridge_items").insert({ user_id: userId, ingredient_name: item.ingredient_name, quantity: item.quantity_needed, unit: item.unit });
          if (e) throw e;
        }
      } else {
        // Décoché → annuler l'ajout au frigo
        if (existing) {
          const newQty = existing.quantity - item.quantity_needed;
          if (newQty <= 0) {
            const { error: e } = await supabase.from("fridge_items").delete().eq("id", existing.id);
            if (e) throw e;
          } else {
            const { error: e } = await supabase.from("fridge_items").update({ quantity: newQty }).eq("id", existing.id);
            if (e) throw e;
          }
        }
      }
    } catch {
      toast.error("Échec de la mise à jour du frigo.");
    }
  };

  const handleAddManual = async () => {
    if (!manualName.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from("shopping_list").insert({
        user_id: userId, ingredient_name: manualName.trim(), quantity_needed: manualQty,
        unit: manualUnit, is_purchased: false, week_start_date: weekStartDate, is_manual: true,
      }).select().single();
      if (error) throw error;
      setList((prev) => [...prev, data]);
      setManualName(""); setManualQty(1); setManualUnit("unit"); setShowAddForm(false);
    } catch {
      toast.error("Échec de l'ajout.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (item: ShoppingListItem) => {
    const { error } = await supabase.from("shopping_list").delete().eq("id", item.id);
    if (error) { toast.error("Échec de la suppression."); return; }
    setList((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handleAdjustQuantity = async (item: ShoppingListItem, delta: number) => {
    const isInteger = item.unit === "unit" || item.unit === "pinch";
    const step      = ["g", "ml"].includes(item.unit) ? 50 : ["kg", "L"].includes(item.unit) ? 0.5 : 1;
    const target    = item.quantity_needed + delta * step;
    // Si on descendrait à 0 ou en-dessous, on ne fait rien (l'utilisateur peut supprimer via la corbeille)
    if (target <= 0) return;
    const newQty = isInteger ? Math.max(1, Math.round(target)) : Math.round(target * 10) / 10;
    const { data, error } = await supabase
      .from("shopping_list").update({ quantity_needed: newQty }).eq("id", item.id).select().single();
    if (!error && data) setList((prev) => prev.map((i) => (i.id === item.id ? data : i)));
  };

  const handleClearPurchased = async () => {
    setLoading(true);
    try {
      const purchasedIds = list.filter((i) => i.is_purchased).map((i) => i.id);
      if (purchasedIds.length === 0) return;
      await supabase.from("shopping_list").delete().in("id", purchasedIds);
      setList((prev) => prev.filter((i) => !i.is_purchased));
    } catch {
      toast.error("Échec de la suppression.");
    } finally {
      setLoading(false);
      setShowClearConfirm(false);
    }
  };

  const grouped = useMemo(() => {
    const groups: Record<string, ShoppingListItem[]> = {};
    const unpurchased = list.filter((i) => !i.is_purchased);
    const purchased = list.filter((i) => i.is_purchased);
    for (const item of unpurchased) {
      const cat = categorizeIngredient(item.ingredient_name);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    const sortedGroups = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    return { groups: sortedGroups, purchased };
  }, [list]);

  const totalItems = list.length;
  const purchasedCount = list.filter((i) => i.is_purchased).length;

  return (
    <div className="p-4 md:p-6 space-y-4 md:max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Liste de courses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{purchasedCount}/{totalItems} articles achetés</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Générer
          </Button>
        </div>
      </div>

      {totalItems > 0 && (
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(purchasedCount / totalItems) * 100}%` }} />
        </div>
      )}

      {totalItems === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="font-semibold text-foreground">Liste vide</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-[220px]">
            Planifiez vos repas de la semaine et générez votre liste de courses
          </p>
          <div className="flex gap-2 mt-5">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4" />
              Ajouter
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleGenerate} disabled={loading}>
              <RefreshCw className="w-4 h-4" />
              Générer
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.groups.map(([category, items]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                {CATEGORY_FR[category] || category}
              </h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <ShoppingItemRow
                    key={item.id} item={item}
                    onToggle={() => handleTogglePurchased(item)}
                    onDelete={() => handleDeleteItem(item)}
                    onAdjust={(delta) => handleAdjustQuantity(item, delta)}
                  />
                ))}
              </div>
            </div>
          ))}

          {grouped.purchased.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Achetés ({grouped.purchased.length})
                </h3>
                <button onClick={() => setShowClearConfirm(true)} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
                  <Trash2 className="w-3 h-3" />
                  Effacer
                </button>
              </div>
              <div className="space-y-2 opacity-60">
                {grouped.purchased.map((item) => (
                  <ShoppingItemRow
                    key={item.id} item={item}
                    onToggle={() => handleTogglePurchased(item)}
                    onDelete={() => handleDeleteItem(item)}
                    onAdjust={(delta) => handleAdjustQuantity(item, delta)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un article</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom de l&apos;article</Label>
              <IngredientInput value={manualName} onChange={setManualName} allIngredients={allIngredients} placeholder="ex. Huile d'olive" autoFocus />
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1.5">
                <Label>Quantité</Label>
                <Input type="number" min={0} step="any" value={manualQty} onChange={(e) => setManualQty(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Unité</Label>
                <Select value={manualUnit} onValueChange={(v) => setManualUnit(v as Unit)}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Annuler</Button>
            <Button onClick={handleAddManual} disabled={loading || !manualName.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajouter à la liste"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Effacer les articles achetés ?</AlertDialogTitle>
            <AlertDialogDescription>
              {grouped.purchased.length} article{grouped.purchased.length !== 1 ? "s" : ""} seront supprimés de la liste. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearPurchased} className="bg-destructive hover:bg-destructive/90">Effacer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ShoppingItemRow({
  item, onToggle, onDelete, onAdjust,
}: {
  item: ShoppingListItem;
  onToggle: () => void;
  onDelete: () => void;
  onAdjust: (delta: number) => void;
}) {
  return (
    <div className={cn(
      "bg-card border rounded-lg px-3 py-2.5 flex items-center gap-2.5 transition-colors hover:border-primary/20",
      item.is_purchased && "opacity-55"
    )}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={cn(
          "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
          item.is_purchased ? "bg-primary border-primary" : "border-border hover:border-primary/50"
        )}
      >
        {item.is_purchased && <CheckCheck className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />}
      </button>

      {/* Nom */}
      <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
        <span className={cn("text-sm font-medium", item.is_purchased && "line-through text-muted-foreground")}>
          {item.ingredient_name}
        </span>
        {item.is_manual && (
          <span className="text-[10px] bg-accent text-accent-foreground rounded px-1.5 py-0.5 font-medium flex-shrink-0">
            manuel
          </span>
        )}
      </div>

      {/* Quantité +/- */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onAdjust(-1)}
          className="w-6 h-6 rounded border text-sm hover:bg-muted flex items-center justify-center transition-colors"
        >–</button>
        <span className="text-xs text-muted-foreground w-16 text-center tabular-nums">
          {displayQuantity(item.quantity_needed)} {item.unit}
        </span>
        <button
          onClick={() => onAdjust(1)}
          className="w-6 h-6 rounded border text-sm hover:bg-muted flex items-center justify-center transition-colors"
        >+</button>
      </div>

      {/* Supprimer */}
      <button
        onClick={onDelete}
        className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 p-1"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
