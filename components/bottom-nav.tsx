"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, Calendar, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/meals",    label: "Repas",   icon: ChefHat },
  { href: "/plan",     label: "Semaine", icon: Calendar },
  { href: "/shopping", label: "Courses", icon: ShoppingCart },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-50 border-t">
      <div className="flex" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
              )}
              <Icon
                className={cn("h-5 w-5 transition-all", isActive && "scale-110")}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span className={cn(
                "text-[10px] tracking-wide",
                isActive ? "font-semibold" : "font-medium"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
