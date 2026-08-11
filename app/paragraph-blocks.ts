export type ParagraphRole = "dialogue" | "narration" | "thought" | "other";
export type ParagraphPresentation = "line" | "bubble" | "quote";
export type ParagraphLineStyle = "vertical-solid" | "vertical-double" | "vertical-dotted" | "vertical-dashed" | "horizontal-short" | "horizontal-double" | "horizontal-dotted" | "horizontal-dashed";

export type ParagraphMark = {
  id: string;
  start: number;
  end: number;
  role?: ParagraphRole;
  presentation?: ParagraphPresentation;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  presentationColor?: string;
  lineStyle?: ParagraphLineStyle;
  linePosition?: "above" | "below";
};

export type ParagraphSlice = {
  text: string;
  start: number;
  blankLinesBefore: number;
};

const paragraphRoles = new Set<ParagraphRole>(["dialogue", "narration", "thought", "other"]);
const paragraphPresentations = new Set<ParagraphPresentation>(["line", "bubble", "quote"]);
const paragraphLineStyles = new Set<ParagraphLineStyle>(["vertical-solid", "vertical-double", "vertical-dotted", "vertical-dashed", "horizontal-short", "horizontal-double", "horizontal-dotted", "horizontal-dashed"]);
const colorPattern = /^#[0-9a-f]{6}$/i;

function verticalizeParagraphLineStyle(lineStyle?: ParagraphLineStyle): ParagraphLineStyle | undefined {
  if (!lineStyle || lineStyle.startsWith("vertical")) return lineStyle;
  if (lineStyle === "horizontal-double") return "vertical-double";
  if (lineStyle === "horizontal-dotted") return "vertical-dotted";
  if (lineStyle === "horizontal-dashed") return "vertical-dashed";
  return "vertical-solid";
}

export function splitParagraphsWithOffsets(text: string): ParagraphSlice[] {
  const output: ParagraphSlice[] = [];
  const matcher = /[^\n](?:[\s\S]*?)(?=\n{2,}|$)/g;
  let previousEnd = 0;
  for (const match of text.matchAll(matcher)) {
    const value = match[0].replace(/\n+$/, "");
    const start = match.index ?? 0;
    const separator = text.slice(previousEnd, start);
    const newlineCount = (separator.match(/\n/g) || []).length;
    if (value) {
      output.push({
        text: value,
        start,
        blankLinesBefore: output.length ? Math.max(0, newlineCount - 2) : newlineCount,
      });
      previousEnd = start + value.length;
    }
  }
  return output;
}

export function normalizeParagraphMarks(values?: ParagraphMark[]): ParagraphMark[] {
  return (values || []).flatMap((mark, index) => {
    const start = Math.max(0, Number(mark?.start));
    const end = Math.max(start, Number(mark?.end));
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
    const role = paragraphRoles.has(mark.role as ParagraphRole) ? mark.role : undefined;
    const presentation = paragraphPresentations.has(mark.presentation as ParagraphPresentation) ? mark.presentation : undefined;
    const color = colorPattern.test(mark.color || "") ? mark.color : undefined;
    const presentationColor = colorPattern.test(mark.presentationColor || "") ? mark.presentationColor : undefined;
    const bold = mark.bold === true ? true : undefined;
    const italic = mark.italic === true ? true : undefined;
    const lineStyle = paragraphLineStyles.has(mark.lineStyle as ParagraphLineStyle) ? verticalizeParagraphLineStyle(mark.lineStyle) : undefined;
    const linePosition = mark.linePosition === "above" || mark.linePosition === "below" ? mark.linePosition : undefined;
    if (!role && !presentation && !color && !bold && !italic && !presentationColor && !lineStyle && !linePosition) return [];
    return [{
      id: mark.id || `paragraph-mark-${index}-${start}`,
      start,
      end,
      role,
      presentation,
      color,
      bold,
      italic,
      presentationColor,
      lineStyle,
      linePosition,
    }];
  });
}

export function rebaseParagraphMarks(marks: ParagraphMark[], before: string, after: string): ParagraphMark[] {
  if (before === after) return marks;
  let prefix = 0;
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix += 1;
  let suffix = 0;
  while (suffix < before.length - prefix && suffix < after.length - prefix && before[before.length - 1 - suffix] === after[after.length - 1 - suffix]) suffix += 1;
  const oldEnd = before.length - suffix;
  const delta = after.length - before.length;

  return marks.flatMap((mark) => {
    if (mark.end <= prefix) return [mark];
    if (mark.start >= oldEnd) return [{ ...mark, start: mark.start + delta, end: mark.end + delta }];
    if (mark.start <= prefix && mark.end >= oldEnd) return [{ ...mark, end: Math.max(mark.start + 1, mark.end + delta) }];
    return [];
  });
}
