"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { normalizeIngredientName } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface IngredientInputProps {
  value: string;
  onChange: (value: string) => void;
  allIngredients: string[];
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export default function IngredientInput({
  value,
  onChange,
  allIngredients,
  placeholder = "Nom de l'ingrédient",
  className,
  autoFocus,
}: IngredientInputProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const getSuggestions = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed.length < 1) return [];
    const normInput = normalizeIngredientName(trimmed);
    return allIngredients
      .filter((name) => {
        const normName = normalizeIngredientName(name);
        // Exclure si la valeur est déjà exactement celle-ci
        if (normName === normInput) return false;
        return normName.includes(normInput);
      })
      .slice(0, 8);
  }, [value, allIngredients]);

  const suggestions = getSuggestions();

  const handleSelect = (name: string) => {
    onChange(name);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  // Ouvrir/fermer selon les suggestions disponibles
  useEffect(() => {
    setActiveIndex(-1);
    setOpen(suggestions.length > 0);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        className={className}
        autoFocus={autoFocus}
        autoComplete="off"
      />
      {open && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((name, idx) => (
            <li
              key={name}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(name); }}
              className={cn(
                "px-3 py-2 text-sm cursor-pointer transition-colors",
                idx === activeIndex
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted text-foreground"
              )}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
