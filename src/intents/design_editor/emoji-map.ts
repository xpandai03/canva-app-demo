import vocabulary from "./vocabulary.json";

export const EMOJI_MAP: Record<string, string> = Object.fromEntries(
  vocabulary.map((entry) => [entry.word, entry.emoji]),
);

export const WORD_CATEGORY_MAP: Record<string, string> = Object.fromEntries(
  vocabulary.map((entry) => [entry.word, entry.category]),
);

export const VOCABULARY_SIZE = vocabulary.length;

export interface VocabEntry {
  word: string;
  emoji: string;
}

export interface VocabCategory {
  category: string;
  entries: VocabEntry[];
}

const byCategory = new Map<string, VocabEntry[]>();
for (const entry of vocabulary) {
  const list = byCategory.get(entry.category) ?? [];
  list.push({ word: entry.word, emoji: entry.emoji });
  byCategory.set(entry.category, list);
}

export const VOCABULARY_BY_CATEGORY: VocabCategory[] = Array.from(
  byCategory.entries(),
)
  .map(([category, entries]) => ({ category, entries }))
  .sort((a, b) => a.category.localeCompare(b.category));
