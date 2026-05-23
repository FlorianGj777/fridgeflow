// Gestion des jours du planning : jours de base (lun-dim) + jours décalés (-1, +1)

export const BASE_DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const BASE_DAY_LABELS_FR: Record<string, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

// Parse une day_key comme "monday", "saturday-1", "monday+1"
export function parseDayKey(key: string): { dayName: string; offset: number } {
  const match = key.match(/^([a-z]+)([+-]\d+)?$/);
  if (!match) return { dayName: "monday", offset: 0 };
  const [, dayName, offsetStr] = match;
  const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
  return { dayName, offset };
}

// Label français lisible : "Lundi", "Samedi -1", "Lundi +1"
export function dayKeyLabel(key: string): string {
  const { dayName, offset } = parseDayKey(key);
  const baseLabel = BASE_DAY_LABELS_FR[dayName] || dayName;
  if (offset === 0) return baseLabel;
  if (offset > 0) return `${baseLabel} +${offset}`;
  return `${baseLabel} ${offset}`;
}

// Ordre numérique pour tri : -7..-1 (semaine précédente), 0..6 (semaine en cours), 7..13 (semaine suivante)
export function dayKeyOrder(key: string): number {
  const { dayName, offset } = parseDayKey(key);
  const dayIndex = BASE_DAY_KEYS.indexOf(dayName as typeof BASE_DAY_KEYS[number]);
  if (dayIndex === -1) return 999;
  return offset * 7 + dayIndex;
}

// Tous les jours décalés possibles, pour l'ajout d'un jour
export const EXTRA_DAY_KEYS: string[] = [
  // Semaine précédente
  "monday-1",
  "tuesday-1",
  "wednesday-1",
  "thursday-1",
  "friday-1",
  "saturday-1",
  "sunday-1",
  // Semaine suivante
  "monday+1",
  "tuesday+1",
  "wednesday+1",
  "thursday+1",
  "friday+1",
  "saturday+1",
  "sunday+1",
];

// Trie une liste de day_keys selon l'ordre temporel
export function sortDayKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => dayKeyOrder(a) - dayKeyOrder(b));
}
