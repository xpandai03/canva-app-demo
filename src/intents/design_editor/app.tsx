import { useState, useEffect } from "react";
import {
  Alert,
  ArrowLeftIcon,
  Badge,
  Box,
  Button,
  Column,
  Columns,
  Pill,
  ProgressBar,
  Rows,
  Text,
  Title,
} from "@canva/app-ui-kit";
import { useSelection } from "@canva/app-hooks";
import * as styles from "styles/components.css";
import {
  EMOJI_MAP,
  VOCABULARY_BY_CATEGORY,
  VOCABULARY_SIZE,
  WORD_CATEGORY_MAP,
} from "./emoji-map";

type AppStatus = "idle" | "running" | "success" | "error";

interface RunStats {
  scannedWords: number;
  matchedWords: number;
  uniqueMatched: number;
  supportsAdded: number;
  categoriesUsed: string[];
  vocabularySize: number;
}

function addVisualSupportsWithStats(text: string): {
  rewrittenText: string;
  stats: RunStats;
} {
  let scannedWords = 0;
  let matchedWords = 0;
  let supportsAdded = 0;
  const uniqueTerms = new Set<string>();
  const categoriesUsed = new Set<string>();

  const rewrittenText = text.replace(
    /\b\w+\b/g,
    (word, offset, original) => {
      scannedWords++;
      const lower = word.toLowerCase();
      const emoji = EMOJI_MAP[lower];
      if (!emoji) return word;

      matchedWords++;
      uniqueTerms.add(lower);
      const category = WORD_CATEGORY_MAP[lower];
      if (category) categoriesUsed.add(category);

      const after = original.substring(offset + word.length);
      if (after.startsWith(` ${emoji}`)) return word;

      supportsAdded++;
      return `${word} ${emoji}`;
    },
  );

  return {
    rewrittenText,
    stats: {
      scannedWords,
      matchedWords,
      uniqueMatched: uniqueTerms.size,
      supportsAdded,
      categoriesUsed: Array.from(categoriesUsed),
      vocabularySize: VOCABULARY_SIZE,
    },
  };
}

function formatCategoryName(cat: string): string {
  return cat
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const App = () => {
  const selection = useSelection("plaintext");
  const [status, setStatus] = useState<AppStatus>("idle");
  const [stats, setStats] = useState<RunStats | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showVocabBreakdown, setShowVocabBreakdown] = useState(false);

  const hasSelection = selection.count > 0;
  const isRunning = status === "running";

  useEffect(() => {
    if (selection.count === 0) {
      setStatus("idle");
      setStats(null);
      setErrorMessage(null);
      setShowVocabBreakdown(false);
    }
  }, [selection.count]);

  const resetToIdle = () => {
    setStatus("idle");
    setStats(null);
    setErrorMessage(null);
  };

  const onClick = async () => {
    setStatus("running");
    setStats(null);
    setErrorMessage(null);

    try {
      const draft = await selection.read();

      let totalScanned = 0;
      let totalMatched = 0;
      let totalAdded = 0;
      const allUniqueTerms = new Set<string>();
      const allCategories = new Set<string>();

      draft.contents.forEach((s) => {
        const { rewrittenText, stats: itemStats } =
          addVisualSupportsWithStats(s.text);
        s.text = rewrittenText;

        totalScanned += itemStats.scannedWords;
        totalMatched += itemStats.matchedWords;
        totalAdded += itemStats.supportsAdded;
      });

      // Deduplicate unique terms and categories across all content items
      draft.contents.forEach((s) => {
        for (const match of s.text.matchAll(/\b\w+\b/g)) {
          const lower = match[0].toLowerCase();
          if (EMOJI_MAP[lower]) {
            allUniqueTerms.add(lower);
            const cat = WORD_CATEGORY_MAP[lower];
            if (cat) allCategories.add(cat);
          }
        }
      });

      await draft.save();

      setStats({
        scannedWords: totalScanned,
        matchedWords: totalMatched,
        uniqueMatched: allUniqueTerms.size,
        supportsAdded: totalAdded,
        categoriesUsed: Array.from(allCategories),
        vocabularySize: VOCABULARY_SIZE,
      });
      setStatus("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred.",
      );
      setStatus("error");
    }
  };

  const coveragePercent = stats
    ? Math.round((stats.uniqueMatched / stats.vocabularySize) * 100)
    : 0;

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="3u">
        <Text>
          Select text in the editor, then click the button to add emoji visual
          supports.
        </Text>

        <Button
          variant="primary"
          onClick={onClick}
          disabled={!hasSelection || isRunning}
          loading={isRunning}
          stretch
        >
          {isRunning ? "Adding Supports..." : "Add Visual Supports"}
        </Button>

        {status === "idle" && !hasSelection && (
          <Text size="small" tone="tertiary">
            Select a text element (single-click) to enable.
          </Text>
        )}

        {status === "idle" && hasSelection && (
          <Text size="small" tone="primary">
            Text selected — ready to add visual supports.
          </Text>
        )}

        {status === "error" && errorMessage && (
          <Alert tone="critical" onDismiss={resetToIdle}>
            {errorMessage}
          </Alert>
        )}

        {status === "success" && stats && showVocabBreakdown && (
          <Box
            background="neutralLow"
            borderRadius="standard"
            padding="2u"
          >
            <Rows spacing="2u">
              <Columns spacing="1u" alignY="center">
                <Column width="content">
                  <Button
                    variant="tertiary"
                    size="small"
                    icon={ArrowLeftIcon}
                    onClick={() => setShowVocabBreakdown(false)}
                    ariaLabel="Back to run summary"
                  />
                </Column>
                <Column>
                  <Title size="small">
                    Vocabulary ({VOCABULARY_SIZE} words)
                  </Title>
                </Column>
              </Columns>
              <Box className={styles.vocabBreakdownList}>
                <Rows spacing="3u">
                  {VOCABULARY_BY_CATEGORY.map(({ category, entries }) => (
                    <Box key={category}>
                      <Rows spacing="1u">
                        <Text size="xsmall" tone="primary">
                          {formatCategoryName(category)} ({entries.length})
                        </Text>
                        <Text size="xsmall" tone="secondary">
                          {entries
                            .map((e) => `${e.word} ${e.emoji}`)
                            .join(", ")}
                        </Text>
                      </Rows>
                    </Box>
                  ))}
                </Rows>
              </Box>
            </Rows>
          </Box>
        )}

        {status === "success" && stats && !showVocabBreakdown && (
          <Box
            background="neutralLow"
            borderRadius="standard"
            padding="2u"
          >
            <Rows spacing="2u">
              <Title size="small">Run Summary</Title>

              {stats.supportsAdded > 0 ? (
                <Alert tone="positive">
                  Added {stats.supportsAdded} visual support
                  {stats.supportsAdded !== 1 ? "s" : ""}.
                </Alert>
              ) : (
                <Alert tone="info">
                  Already optimized — no changes needed.
                </Alert>
              )}

              <Columns spacing="2u">
                <Column width="1/2">
                  <Rows spacing="1u">
                    <Text size="xsmall" tone="tertiary">
                      Words Scanned
                    </Text>
                    <Text size="small" variant="bold">
                      {stats.scannedWords}
                    </Text>
                    <Text size="xsmall" tone="tertiary">
                      Supports Added
                    </Text>
                    <Text size="small" variant="bold">
                      {stats.supportsAdded}
                    </Text>
                    <Text size="xsmall" tone="tertiary">
                      Unique Terms
                    </Text>
                    <Text size="small" variant="bold">
                      {stats.uniqueMatched}
                    </Text>
                  </Rows>
                </Column>
                <Column width="1/2">
                  <Rows spacing="1u">
                    <Text size="xsmall" tone="tertiary">
                      Total Matches
                    </Text>
                    <Text size="small" variant="bold">
                      {stats.matchedWords}
                    </Text>
                    <Text size="xsmall" tone="tertiary">
                      Vocab Size
                    </Text>
                    <Button
                      variant="tertiary"
                      onClick={() => setShowVocabBreakdown(true)}
                      ariaLabel="View full vocabulary breakdown (331 words)"
                    >
                      {String(stats.vocabularySize)}
                    </Button>
                    <Text size="xsmall" tone="tertiary">
                      Coverage
                    </Text>
                    <Text size="small" variant="bold">
                      {coveragePercent}%
                    </Text>
                  </Rows>
                </Column>
              </Columns>

              <ProgressBar
                value={coveragePercent}
                size="small"
                ariaLabel="Vocabulary coverage"
              />

              {stats.categoriesUsed.length > 0 && (
                <Box
                  display="flex"
                  flexWrap="wrap"
                  className={styles.categoryPills}
                >
                  {stats.categoriesUsed.slice(0, 6).map((cat) => (
                    <Pill
                      key={cat}
                      text={formatCategoryName(cat)}
                      size="xsmall"
                      disabled
                    />
                  ))}
                  {stats.categoriesUsed.length > 6 && (
                    <Badge
                      tone="assist"
                      text={`+${stats.categoriesUsed.length - 6}`}
                      ariaLabel={`${stats.categoriesUsed.length - 6} more categories`}
                    />
                  )}
                </Box>
              )}
            </Rows>
          </Box>
        )}
      </Rows>
    </div>
  );
};
