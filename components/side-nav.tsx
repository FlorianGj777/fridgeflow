"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChefHat, Calendar, Refrigerator, ShoppingCart, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types/database";
import Image from "next/image";

const tabs = [
  { href: "/meals",    label: "Mes Repas",   icon: ChefHat },
  { href: "/plan",     label: "Semaine",     icon: Calendar },
  { href: "/fridge",   label: "Mon Frigo",   icon: Refrigerator },
  { href: "/shopping", label: "Courses",     icon: ShoppingCart },
];

interface SideNavProps {
  profile: Profile | null;
}

export default function SideNav({ profile }: SideNavProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initials = (profile?.display_name || profile?.email || "U")
    .charAt(0).toUpperCase();

  return (
    <aside className="hidden md:flex flex-col w-56 border-r bg-background h-dvh sticky top-0 flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
            <Refrigerator className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-base tracking-tight">FridgeFlow</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon
                className="h-4 w-4 flex-shrink-0"
                strokeWidth={isActive ? 2.5 : 2}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="p-3 border-t flex items-center gap-2">
        {profile?.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.display_name || "Utilisateur"}
            width={28}
            height={28}
            className="rounded-full border border-border flex-shrink-0"
          />
        ) : (
          <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-primary">{initials}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate leading-tight">
            {profile?.display_name || profile?.email || "Utilisateur"}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
          title="Se déconnecter"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
}
