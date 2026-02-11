import { Button, Rows, Text } from "@canva/app-ui-kit";
import { useSelection } from "@canva/app-hooks";
import * as styles from "styles/components.css";
import { EMOJI_MAP } from "./emoji-map";

function addVisualSupports(text: string): string {
  return text.replace(/\b\w+\b/g, (word, offset, original) => {
    const emoji = EMOJI_MAP[word.toLowerCase()];
    if (!emoji) return word;
    const after = original.substring(offset + word.length);
    if (after.startsWith(` ${emoji}`)) return word;
    return `${word} ${emoji}`;
  });
}

export const App = () => {
  const selection = useSelection("plaintext");

  const onClick = async () => {
    const draft = await selection.read();
    draft.contents.forEach((s) => (s.text = addVisualSupports(s.text)));
    await draft.save();
  };

  const hasSelection = selection.count > 0;

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Text>
          Select text in the editor, then click the button to add emoji visual
          supports.
        </Text>
        <Button
          variant="primary"
          onClick={onClick}
          disabled={!hasSelection}
          stretch
        >
          Add Visual Supports
        </Button>
        <Text size="small" tone={hasSelection ? "primary" : "tertiary"}>
          {hasSelection
            ? "Text element selected."
            : "Select a text element (single-click the text box) to enable this action."}
        </Text>
      </Rows>
    </div>
  );
};
