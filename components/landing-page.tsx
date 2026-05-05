"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Calendar, Refrigerator, ChefHat } from "lucide-react";
import { toast } from "sonner";

export default function LandingPage() {
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) toast.error("Échec de la connexion. Veuillez réessayer.");
  };

  const features = [
    {
      icon: ChefHat,
      title: "Mes Recettes",
      description: "Créez et stockez toutes vos recettes avec ingrédients et portions.",
    },
    {
      icon: Calendar,
      title: "Planning Semaine",
      description: "Planifiez les déjeuners et dîners de toute la semaine.",
    },
    {
      icon: Refrigerator,
      title: "Suivi du Frigo",
      description: "Sachez exactement ce qu'il y a dans votre frigo.",
    },
    {
      icon: ShoppingCart,
      title: "Courses Intelligentes",
      description: "Générez votre liste de courses depuis votre planning.",
    },
  ];

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      {/* Header */}
      <header className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <Refrigerator className="w-4.5 h-4.5 text-primary-foreground" style={{ width: "18px", height: "18px" }} />
          </div>
          <span className="text-lg font-semibold tracking-tight">FridgeFlow</span>
        </div>
        <Button onClick={handleGoogleSignIn} size="sm" className="gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Se connecter
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col md:flex-row">
        {/* Left: text + CTA */}
        <div className="flex flex-col justify-center px-8 py-12 md:w-1/2 md:py-20 md:px-16 lg:px-20">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-foreground">
            La gestion des repas,{" "}
            <span className="text-primary">simplifiée.</span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-md">
            Planifiez votre semaine, gérez votre frigo et ne manquez plus jamais
            un ingrédient.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleGoogleSignIn}
              size="lg"
              className="gap-3 font-semibold"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuer avec Google
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Gratuit · Aucune carte bancaire requise</p>
        </div>

        {/* Right: feature preview */}
        <div className="flex flex-col justify-center px-6 pb-12 md:w-1/2 md:py-20 md:px-12 lg:px-16">
          {/* Mock app preview */}
          <div className="bg-card border rounded-lg shadow-sm overflow-hidden max-w-sm mx-auto w-full">
            {/* Mini top bar */}
            <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
              <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
                <Refrigerator className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="text-xs font-semibold">FridgeFlow</span>
            </div>
            {/* Sample rows */}
            <div className="divide-y">
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">Lundi — Dîner</div>
                  <div className="text-[11px] text-muted-foreground">Pâtes Carbonara · 2 portions</div>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">Planifié</span>
              </div>
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 bg-orange-100 rounded flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">Liste générée</div>
                  <div className="text-[11px] text-muted-foreground">6 articles · 3 déjà en stock</div>
                </div>
                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">3 à acheter</span>
              </div>
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                  <Refrigerator className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">Frigo mis à jour</div>
                  <div className="text-[11px] text-muted-foreground">Stock déduit automatiquement</div>
                </div>
                <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-medium">Auto</span>
              </div>
            </div>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-2.5 mt-6 max-w-sm mx-auto w-full">
            {features.map((f) => (
              <div key={f.title} className="bg-card border rounded-lg p-3">
                <f.icon className="w-4 h-4 text-primary mb-2" strokeWidth={2} />
                <div className="text-xs font-semibold">{f.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{f.description}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
