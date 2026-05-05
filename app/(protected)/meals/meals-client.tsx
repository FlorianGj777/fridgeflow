"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { MealWithIngredients } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import MealForm from "@/components/meal-form";

interface MealsClientProps {
  initialMeals: MealWithIngredients[];
  userId: string;
  fridgeIngredients: string[];
}

export default function MealsClient({
  initialMeals,
  userId,
  fridgeIngredients,
}: MealsClientProps) {
  const [meals, setMeals] = useState<MealWithIngredients[]>(initialMeals);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealWithIngredients | null>(null);
  const [deletingMeal, setDeletingMeal] = useState<MealWithIngredients | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const filteredMeals = useMemo(
    () => meals.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())),
    [meals, search]
  );

  const allIngredients = useMemo(() => {
    const names = new Set<string>([...fridgeIngredients]);
    for (const meal of meals) {
      for (const ing of meal.meal_ingredients) {
        if (ing.ingredient_name.trim()) names.add(ing.ingredient_name.trim());
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "fr"));
  }, [meals, fridgeIngredients]);

  const handleSave = async (
    data: Omit<MealWithIngredients, "id" | "user_id" | "created_at">
  ) => {
    setLoading(true);
    try {
      if (editingMeal) {
        const { error: mealErr } = await supabase
          .from("meals")
          .update({ name: data.name, description: data.description, servings: data.servings })
          .eq("id", editingMeal.id);
        if (mealErr) throw mealErr;

        await supabase.from("meal_ingredients").delete().eq("meal_id", editingMeal.id);

        if (data.meal_ingredients.length > 0) {
          const { error: ingErr } = await supabase
            .from("meal_ingredients")
            .insert(data.meal_ingredients.map((i) => ({ ...i, meal_id: editingMeal.id })));
          if (ingErr) throw ingErr;
        }

        const { data: updated } = await supabase
          .from("meals").select("*, meal_ingredients(*)").eq("id", editingMeal.id).single();
        setMeals((prev) => prev.map((m) => (m.id === editingMeal.id ? updated! : m)));
      } else {
        const { data: newMeal, error: mealErr } = await supabase
          .from("meals")
          .insert({ user_id: userId, name: data.name, description: data.description, servings: data.servings })
          .select().single();
        if (mealErr) throw mealErr;

        if (data.meal_ingredients.length > 0) {
          const { error: ingErr } = await supabase
            .from("meal_ingredients")
            .insert(data.meal_ingredients.map((i) => ({ ...i, meal_id: newMeal.id })));
          if (ingErr) throw ingErr;
        }

        const { data: full } = await supabase
          .from("meals").select("*, meal_ingredients(*)").eq("id", newMeal.id).single();
        setMeals((prev) => [full!, ...prev]);
      }
      setShowForm(false);
      setEditingMeal(null);
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMeal) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("meals").delete().eq("id", deletingMeal.id);
      if (error) throw error;
      setMeals((prev) => prev.filter((m) => m.id !== deletingMeal.id));
    } catch {
      toast.error("Échec de la suppression.");
    } finally {
      setLoading(false);
      setDeletingMeal(null);
    }
  };

  const openCreate = () => { setEditingMeal(null); setShowForm(true); };
  const openEdit = (meal: MealWithIngredients) => { setEditingMeal(meal); setShowForm(true); };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Mes Repas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {meals.length} recette{meals.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Nouveau
        </Button>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un repas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Liste */}
      {filteredMeals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {search ? (
            <>
              <p className="font-medium text-foreground">Aucun résultat pour &ldquo;{search}&rdquo;</p>
              <p className="text-sm text-muted-foreground mt-1">Essayez un autre terme</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-foreground">Aucun repas enregistré</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                Créez votre premier repas pour commencer à planifier votre semaine
              </p>
              <Button onClick={openCreate} className="mt-5 gap-2">
                <Plus className="w-4 h-4" />
                Créer mon premier repas
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredMeals.map((meal) => (
            <div key={meal.id} className="bg-card border rounded-lg p-3.5 group hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-semibold text-sm leading-snug truncate">{meal.name}</h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {meal.servings} portion{meal.servings !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {meal.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{meal.description}</p>
                  )}
                  {meal.meal_ingredients.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {meal.meal_ingredients.slice(0, 4).map((ing) => (
                        <span
                          key={ing.id}
                          className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 font-medium"
                        >
                          {ing.ingredient_name}
                        </span>
                      ))}
                      {meal.meal_ingredients.length > 4 && (
                        <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                          +{meal.meal_ingredients.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => openEdit(meal)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeletingMeal(meal)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <MealForm
          meal={editingMeal}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingMeal(null); }}
          loading={loading}
          allIngredients={allIngredients}
        />
      )}

      <AlertDialog open={!!deletingMeal} onOpenChange={(open) => !open && setDeletingMeal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce repas ?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deletingMeal?.name}&rdquo; sera définitivement supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
