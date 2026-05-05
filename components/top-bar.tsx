"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Profile } from "@/types/database";
import { LogOut, Refrigerator } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface TopBarProps {
  profile: Profile | null;
}

export default function TopBar({ profile }: TopBarProps) {
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initials = (profile?.display_name || profile?.email || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
          <Refrigerator className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-foreground text-base tracking-tight">FridgeFlow</span>
      </div>

      <div className="flex items-center gap-1.5">
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.display_name || "Utilisateur"}
            width={28}
            height={28}
            className="rounded-full border border-border"
          />
        ) : (
          <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">{initials}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          title="Se déconnecter"
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    </header>
  );
}
