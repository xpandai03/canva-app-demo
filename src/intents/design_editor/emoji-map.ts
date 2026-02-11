import vocabulary from "./vocabulary.json";

export const EMOJI_MAP: Record<string, string> = Object.fromEntries(
  vocabulary.map((entry) => [entry.word, entry.emoji]),
);

export const WORD_CATEGORY_MAP: Record<string, string> = Object.fromEntries(
  vocabulary.map((entry) => [entry.word, entry.category]),
);

export const VOCABULARY_SIZE = vocabulary.length;
