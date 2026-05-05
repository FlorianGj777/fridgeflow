export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          servings: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          servings?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          servings?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      meal_ingredients: {
        Row: {
          id: string;
          meal_id: string;
          ingredient_name: string;
          quantity: number;
          unit: string;
        };
        Insert: {
          id?: string;
          meal_id: string;
          ingredient_name: string;
          quantity: number;
          unit: string;
        };
        Update: {
          id?: string;
          meal_id?: string;
          ingredient_name?: string;
          quantity?: number;
          unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_ingredients_meal_id_fkey";
            columns: ["meal_id"];
            isOneToOne: false;
            referencedRelation: "meals";
            referencedColumns: ["id"];
          }
        ];
      };
      weekly_plan: {
        Row: {
          id: string;
          user_id: string;
          week_start_date: string;
          day_of_week: number;
          meal_slot: "lunch" | "dinner";
          meal_id: string;
          servings_planned: number;
          is_completed: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start_date: string;
          day_of_week: number;
          meal_slot: "lunch" | "dinner";
          meal_id: string;
          servings_planned?: number;
          is_completed?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start_date?: string;
          day_of_week?: number;
          meal_slot?: "lunch" | "dinner";
          meal_id?: string;
          servings_planned?: number;
          is_completed?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "weekly_plan_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "weekly_plan_meal_id_fkey";
            columns: ["meal_id"];
            isOneToOne: false;
            referencedRelation: "meals";
            referencedColumns: ["id"];
          }
        ];
      };
      fridge_items: {
        Row: {
          id: string;
          user_id: string;
          ingredient_name: string;
          quantity: number;
          unit: string;
          added_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ingredient_name: string;
          quantity: number;
          unit: string;
          added_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ingredient_name?: string;
          quantity?: number;
          unit?: string;
          added_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fridge_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      shopping_list: {
        Row: {
          id: string;
          user_id: string;
          ingredient_name: string;
          quantity_needed: number;
          unit: string;
          is_purchased: boolean;
          week_start_date: string | null;
          is_manual: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          ingredient_name: string;
          quantity_needed: number;
          unit: string;
          is_purchased?: boolean;
          week_start_date?: string | null;
          is_manual?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          ingredient_name?: string;
          quantity_needed?: number;
          unit?: string;
          is_purchased?: boolean;
          week_start_date?: string | null;
          is_manual?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "shopping_list_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Meal = Database["public"]["Tables"]["meals"]["Row"];
export type MealIngredient =
  Database["public"]["Tables"]["meal_ingredients"]["Row"];
export type WeeklyPlan = Database["public"]["Tables"]["weekly_plan"]["Row"];
export type FridgeItem = Database["public"]["Tables"]["fridge_items"]["Row"];
export type ShoppingListItem =
  Database["public"]["Tables"]["shopping_list"]["Row"];

export type MealWithIngredients = Meal & {
  meal_ingredients: MealIngredient[];
};

export type WeeklyPlanWithMeal = WeeklyPlan & {
  meal: MealWithIngredients;
};

export type Unit =
  | "g"
  | "kg"
  | "ml"
  | "L"
  | "unit"
  | "tbsp"
  | "tsp"
  | "pinch";

export const UNITS: Unit[] = ["g", "kg", "ml", "L", "unit", "tbsp", "tsp", "pinch"];

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
