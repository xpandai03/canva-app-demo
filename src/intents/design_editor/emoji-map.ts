import vocabulary from "./vocabulary.json";

export const EMOJI_MAP: Record<string, string> = Object.fromEntries(
  vocabulary.map((entry) => [entry.word, entry.emoji]),
);
