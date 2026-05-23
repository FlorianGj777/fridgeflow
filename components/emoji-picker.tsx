"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import Emoji from "@/components/emoji";

// Sélection d'emojis nourriture/cuisine courants
const FOOD_EMOJIS = [
  "🍕", "🍔", "🌭", "🥪", "🌮", "🥙", "🥗", "🥘",
  "🍝", "🍜", "🍲", "🥣", "🍛", "🍱", "🥟", "🍣",
  "🍤", "🍙", "🍘", "🍚", "🍢", "🍡", "🥠", "🥧",
  "🍮", "🥮", "🍯", "🥛", "🍵", "☕", "🫖", "🍾",
  "🍷", "🥂", "🍻", "🥃", "🍸", "🍹", "🧊", "🥚",
  "🍳", "🥩", "🍗", "🥓", "🍖", "🌶️", "🫑", "🥒",
  "🥬", "🥦", "🌽", "🥕", "🧅", "🧄", "🌰", "🥔",
  "🍆", "🥑", "🥥", "🍅", "🍒", "🍓", "🥝", "🍑",
  "🍐", "🍎", "🍏", "🍊", "🍋", "🍌", "🍉", "🍇",
  "🍈", "🍍", "🥭", "🫐", "🍰", "🎂", "🧁", "🍩",
  "🍪", "🍿", "🍫", "🍬", "🍭", "🥨", "🥯", "🥖",
  "🥐", "🍞", "🧇", "🥞", "🧈", "🌯", "🫔", "🍔",
  "🥡", "🍴", "🍽️", "🥄", "🔪",
];

interface EmojiPickerProps {
  value: string | null;
  onChange: (emoji: string | null) => void;
}

export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "h-10 w-10 rounded-md border flex items-center justify-center transition-colors",
          value
            ? "bg-primary/5 border-primary/30 hover:bg-primary/10"
            : "bg-background border-input hover:bg-muted"
        )}
        title={value ? "Changer l'emoji" : "Choisir un emoji"}
      >
        {value ? <Emoji emoji={value} size={22} /> : <Smile className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-50 top-full mt-1 left-0 w-[280px] max-h-64 overflow-y-auto bg-white border border-border rounded-xl shadow-lg p-2">
            <div className="grid grid-cols-8 gap-0.5">
              {FOOD_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSelect(emoji)}
                  className={cn(
                    "h-8 w-8 rounded flex items-center justify-center hover:bg-muted transition-colors",
                    value === emoji && "bg-primary/10"
                  )}
                >
                  <Emoji emoji={emoji} size={20} />
                </button>
              ))}
            </div>
            {value && (
              <div className="pt-2 mt-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="w-full text-xs text-muted-foreground"
                >
                  Retirer l&apos;emoji
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
