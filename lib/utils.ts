import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert all quantities to grams/ml base for comparison
const UNIT_TO_BASE: Record<string, { base: string; factor: number }> = {
  g: { base: "g", factor: 1 },
  kg: { base: "g", factor: 1000 },
  ml: { base: "ml", factor: 1 },
  L: { base: "ml", factor: 1000 },
  unit: { base: "unit", factor: 1 },
  tbsp: { base: "ml", factor: 15 },
  tsp: { base: "ml", factor: 5 },
  pinch: { base: "g", factor: 0.5 },
};

export function normalizeQuantity(
  quantity: number,
  unit: string
): { quantity: number; baseUnit: string } {
  const conversion = UNIT_TO_BASE[unit];
  if (!conversion) return { quantity, baseUnit: unit };
  return {
    quantity: quantity * conversion.factor,
    baseUnit: conversion.base,
  };
}

export function normalizeIngredientName(name: string): string {
  let n = name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // supprime les accents (é→e, è→e, etc.)
  // Gestion du pluriel simple : retire le 's' final pour les mots > 3 lettres
  // oignons→oignon, tomates→tomate, epinards→epinard
  if (n.length > 3 && n.endsWith("s")) n = n.slice(0, -1);
  return n;
}

// Get Monday of the current week
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatWeekStartDate(date: Date): string {
  // Utilise les composants locaux (et non UTC via toISOString)
  // pour éviter le décalage de fuseau horaire (ex. France UTC+2)
  const year  = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day   = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatDateLong(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// Simple keyword-based category detection
export function categorizeIngredient(name: string): string {
  const lower = name.toLowerCase();

  const categories: Record<string, string[]> = {
    "Produce": [
      "apple", "banana", "orange", "lemon", "lime", "tomato", "potato",
      "carrot", "onion", "garlic", "pepper", "cucumber", "lettuce", "spinach",
      "broccoli", "cauliflower", "celery", "mushroom", "zucchini", "eggplant",
      "avocado", "mango", "strawberry", "blueberry", "raspberry", "grape",
      "watermelon", "pineapple", "peach", "pear", "plum", "cherry", "kiwi",
      "herb", "basil", "parsley", "cilantro", "mint", "thyme", "rosemary",
      "ginger", "shallot", "leek", "asparagus", "artichoke", "beet",
    ],
    "Dairy": [
      "milk", "cream", "butter", "cheese", "yogurt", "mozzarella", "cheddar",
      "parmesan", "brie", "feta", "ricotta", "sour cream", "cottage cheese",
      "whipped cream", "half and half",
    ],
    "Meat & Fish": [
      "chicken", "beef", "pork", "lamb", "turkey", "duck", "salmon", "tuna",
      "shrimp", "cod", "tilapia", "bacon", "sausage", "ham", "steak",
      "ground beef", "mince", "fish", "seafood", "prawn", "lobster", "crab",
    ],
    "Grains & Pasta": [
      "bread", "rice", "pasta", "noodle", "flour", "oat", "quinoa", "barley",
      "couscous", "tortilla", "bagel", "cracker", "cereal", "corn", "polenta",
    ],
    "Canned & Pantry": [
      "can", "canned", "tomato sauce", "paste", "broth", "stock", "bean",
      "lentil", "chickpea", "olive oil", "oil", "vinegar", "soy sauce",
      "honey", "jam", "peanut butter", "sugar", "salt", "pepper", "spice",
      "sauce", "ketchup", "mustard", "mayonnaise",
    ],
    "Frozen": [
      "frozen", "ice cream", "peas frozen",
    ],
    "Beverages": [
      "juice", "water", "coffee", "tea", "wine", "beer", "soda", "drink",
    ],
    "Bakery": [
      "cake", "cookie", "muffin", "pastry", "croissant", "donut",
    ],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }

  return "Other";
}

export function displayQuantity(quantity: number): string {
  if (quantity % 1 === 0) return quantity.toString();
  return quantity.toFixed(1);
}
