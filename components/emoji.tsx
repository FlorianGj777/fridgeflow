"use client";

import { cn } from "@/lib/utils";

interface EmojiProps {
  emoji: string;
  size?: number;
  className?: string;
}

// Convertit un emoji en suite de codepoints hex (format Twemoji)
function emojiToCodepoint(emoji: string): string {
  const codePoints: string[] = [];
  for (const char of emoji) {
    const code = char.codePointAt(0);
    if (code && code !== 0xfe0f) {
      codePoints.push(code.toString(16));
    }
  }
  return codePoints.join("-");
}

/**
 * Affiche un emoji via Twemoji (rendu uniforme et "joli" sur tous les OS).
 * Fallback automatique : si l'image ne charge pas, l'emoji natif s'affiche.
 */
export default function Emoji({ emoji, size = 18, className }: EmojiProps) {
  if (!emoji) return null;
  const codepoint = emojiToCodepoint(emoji);
  const src       = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/${codepoint}.svg`;

  return (
    <img
      src={src}
      alt={emoji}
      width={size}
      height={size}
      className={cn("inline-block align-[-0.125em] select-none", className)}
      style={{ width: size, height: size }}
      loading="lazy"
      draggable={false}
    />
  );
}
