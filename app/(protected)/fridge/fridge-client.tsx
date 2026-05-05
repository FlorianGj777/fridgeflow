"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { FridgeItem, UNITS, Unit } from "@/types/database";
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
import { Plus, Search, Trash2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { displayQuantity, cn } from "@/lib/utils";
import IngredientInput from "@/components/ingredient-input";

interface FridgeClientProps {
  initialItems: FridgeItem[];
  userId: string;
  allIngredients: string[];
}

export default function FridgeClient({ initialItems, userId, allIngredients: ingredientsFromMeals }: FridgeClientProps) {
  const [items, setItems] = useState<FridgeItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FridgeItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<FridgeItem | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<Unit>("g");

  const supabase = createClient();

  const allIngredients = useMemo(() => {
    const names = new Set<string>([
      ...ingredientsFromMeals,
      ...items.map((i) => i.ingredient_name),
    ]);
    return Array.from(names).sort((a, b) => a.localeCompare(b, "fr"));
  }, [ingredientsFromMeals, items]);

  const filteredItems = useMemo(
    () => items
      .filter((i) => i.ingredient_name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (a.quantity === 0 && b.quantity !== 0) return 1;
        if (a.quantity !== 0 && b.quantity === 0) return -1;
        return a.ingredient_name.localeCompare(b.ingredient_name);
      }),
    [items, search]
  );

  const openCreate = () => {
    setEditingItem(null); setName(""); setQuantity(1); setUnit("g"); setShowForm(true);
  };

  const openEdit = (item: FridgeItem) => {
    setEditingItem(item); setName(item.ingredient_name); setQuantity(item.quantity);
    setUnit(item.unit as Unit); setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      if (editingItem) {
        const { data, error } = await supabase
          .from("fridge_items")
          .update({ ingredient_name: name.trim(), quantity, unit: unit as string })
          .eq("id", editingItem.id).select().single();
        if (error) throw error;
        setItems((prev) => prev.map((i) => (i.id === editingItem.id ? data : i)));
      } else {
        const existing = items.find(
          (i) => i.ingredient_name.toLowerCase() === name.toLowerCase() && i.unit === unit
        );
        if (existing) {
          const { data, error } = await supabase
            .from("fridge_items")
            .update({ quantity: existing.quantity + quantity })
            .eq("id", existing.id).select().single();
          if (error) throw error;
          setItems((prev) => prev.map((i) => (i.id === existing.id ? data : i)));
        } else {
          const { data, error } = await supabase
            .from("fridge_items")
            .insert({ user_id: userId, ingredient_name: name.trim(), quantity, unit })
            .select().single();
          if (error) throw error;
          setItems((prev) => [...prev, data]);
        }
      }
      setShowForm(false);
    } catch {
      toast.error("Échec de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("fridge_items").delete().eq("id", deletingItem.id);
      if (error) throw error;
      setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
    } catch {
      toast.error("Échec de la suppression.");
    } finally {
      setLoading(false);
      setDeletingItem(null);
    }
  };

  const handleInlineQuantityChange = async (item: FridgeItem, newQty: number) => {
    const qty = Math.max(0, newQty);
    const { data, error } = await supabase
      .from("fridge_items").update({ quantity: qty }).eq("id", item.id).select().single();
    if (!error && data) setItems((prev) => prev.map((i) => (i.id === item.id ? data : i)));
  };

  const inStock = items.filter((i) => i.quantity > 0).length;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Mon Frigo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {inStock} article{inStock !== 1 ? "s" : ""} en stock
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Ajouter
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher dans le frigo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {search ? (
            <>
              <p className="font-medium text-foreground">Introuvable</p>
              <p className="text-sm text-muted-foreground mt-1">Essayez un autre terme</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-foreground">Frigo vide</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-[200px]">
                Ajoutez ce que vous avez pour suivre votre stock
              </p>
              <Button onClick={openCreate} className="mt-5 gap-2">
                <Plus className="w-4 h-4" />
                Ajouter un article
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "bg-card border rounded-lg px-3.5 py-2.5 flex items-center gap-3 group hover:border-primary/30 transition-colors",
                item.quantity === 0 && "opacity-50"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{item.ingredient_name}</div>
                <div className="text-xs text-muted-foreground">
                  {displayQuantity(item.quantity)} {item.unit}
                  {item.quantity === 0 && (
                    <span className="ml-1.5 text-amber-500 font-medium">· Épuisé</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleInlineQuantityChange(item, item.quantity - 1)}
                  className="w-6 h-6 rounded border text-sm hover:bg-muted flex items-center justify-center transition-colors"
                >–</button>
                <span className="text-sm font-medium w-12 text-center tabular-nums">
                  {displayQuantity(item.quantity)}
                </span>
                <button
                  onClick={() => handleInlineQuantityChange(item, item.quantity + 1)}
                  className="w-6 h-6 rounded border text-sm hover:bg-muted flex items-center justify-center transition-colors"
                >+</button>
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={() => openEdit(item)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeletingItem(item)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => !open && setShowForm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Modifier l'article" : "Ajouter au frigo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="item-name">Ingrédient</Label>
              <IngredientInput
                value={name}
                onChange={setName}
                allIngredients={allIngredients}
                placeholder="ex. Œufs"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="item-qty">Quantité</Label>
                <Input
                  id="item-qty"
                  type="number"
                  min={0}
                  step="any"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unité</Label>
                <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
                  <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={loading || !name.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editingItem ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet article ?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deletingItem?.ingredient_name}&rdquo; sera retiré de votre frigo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
