# FridgeFlow — Smart Grocery Manager

A mobile-first grocery management app built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **Supabase**.

Plan your meals, track your fridge inventory, and generate smart shopping lists automatically.

---

## Features

- **Meal Library** — Create recipes with dynamic ingredient lists, quantities, and units
- **Weekly Planner** — Assign meals to lunch/dinner slots for Mon–Sun with servings scaling
- **Fridge Tracker** — Track what's in your fridge; auto-deduct when meals are marked done
- **Smart Shopping List** — Auto-generated from your weekly plan minus what's already in the fridge
- **Google OAuth** — Sign in with Google via Supabase Auth
- **Mobile-first** — Max 430px width, bottom navigation, safe area insets

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Supabase](https://supabase.com) account (free tier works)
- A Google Cloud project with OAuth credentials

---

## 1. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these in your Supabase project: **Settings → API**.

---

## 2. Database Setup (SQL Migration)

Run this SQL in your Supabase project: **SQL Editor → New Query**.

```sql
-- ============================================================
-- FridgeFlow Database Schema
-- ============================================================

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meals
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  servings INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal Ingredients
CREATE TABLE meal_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'unit'
);

-- Weekly Plan
CREATE TABLE weekly_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  meal_slot TEXT NOT NULL CHECK (meal_slot IN ('lunch', 'dinner')),
  meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  servings_planned INTEGER NOT NULL DEFAULT 2,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (user_id, week_start_date, day_of_week, meal_slot)
);

-- Fridge Items
CREATE TABLE fridge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'unit',
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shopping List
CREATE TABLE shopping_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity_needed NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'unit',
  is_purchased BOOLEAN NOT NULL DEFAULT FALSE,
  week_start_date DATE,
  is_manual BOOLEAN NOT NULL DEFAULT FALSE
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE fridge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Meals policies
CREATE POLICY "Users can CRUD own meals"
  ON meals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Meal ingredients policies (via meal ownership)
CREATE POLICY "Users can CRUD own meal_ingredients"
  ON meal_ingredients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM meals
      WHERE meals.id = meal_ingredients.meal_id
        AND meals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meals
      WHERE meals.id = meal_ingredients.meal_id
        AND meals.user_id = auth.uid()
    )
  );

-- Weekly plan policies
CREATE POLICY "Users can CRUD own weekly_plan"
  ON weekly_plan FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fridge items policies
CREATE POLICY "Users can CRUD own fridge_items"
  ON fridge_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Shopping list policies
CREATE POLICY "Users can CRUD own shopping_list"
  ON shopping_list FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Indexes for performance
-- ============================================================

CREATE INDEX meals_user_id_idx ON meals(user_id);
CREATE INDEX meal_ingredients_meal_id_idx ON meal_ingredients(meal_id);
CREATE INDEX weekly_plan_user_week_idx ON weekly_plan(user_id, week_start_date);
CREATE INDEX fridge_items_user_id_idx ON fridge_items(user_id);
CREATE INDEX shopping_list_user_id_idx ON shopping_list(user_id);
```

---

## 3. Google OAuth Setup

### In Google Cloud Console
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → **APIs & Services → Credentials**
3. Click **Create Credentials → OAuth Client ID**
4. Application type: **Web application**
5. Add Authorized redirect URIs:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
6. Copy the **Client ID** and **Client Secret**

### In Supabase Dashboard
1. Go to **Authentication → Providers → Google**
2. Enable it
3. Paste your **Client ID** and **Client Secret**
4. Save

---

## 4. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add your environment variables in the Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Add your production URL to Google OAuth redirect URIs:
```
https://your-app.vercel.app/auth/callback
```

---

## Project Structure

```
├── app/
│   ├── (auth)/
│   │   └── auth/callback/route.ts     # OAuth callback handler
│   ├── (protected)/
│   │   ├── layout.tsx                 # Auth guard + nav shell
│   │   ├── meals/                     # Meal library
│   │   ├── plan/                      # Weekly planner
│   │   ├── fridge/                    # Fridge inventory
│   │   └── shopping/                  # Shopping list
│   ├── globals.css
│   ├── layout.tsx                     # Root layout
│   └── page.tsx                       # Landing page
├── components/
│   ├── ui/                            # shadcn/ui base components
│   ├── bottom-nav.tsx
│   ├── top-bar.tsx
│   ├── landing-page.tsx
│   ├── meal-form.tsx
│   └── slot-modal.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Browser client
│   │   ├── server.ts                  # Server client
│   │   └── middleware.ts              # Session refresh
│   ├── shopping-logic.ts              # Auto-generate shopping list
│   └── utils.ts                       # Helpers, unit normalization
├── types/
│   └── database.ts                    # TypeScript types for DB
└── middleware.ts                       # Route protection
```

---

## Shopping List Logic

The shopping list is computed by:
1. Aggregating all ingredients needed for the current week's planned meals (scaled by servings)
2. Normalizing units (e.g., 1 kg = 1000 g, 1 L = 1000 ml) for comparison
3. Subtracting what's already in the fridge
4. Showing only what's still missing

When a shopping item is checked as purchased, its quantity is automatically added to the fridge inventory.
When a meal is marked as done, the used ingredients are deducted from the fridge.
