import { splitParagraphsWithOffsets } from './paragraph-blocks';

// Match surviving paragraphs before assigning edited paragraphs. Never reuse a
// page/index key after text changes: it can now belong to a different message.
export function rebaseSpeakerAssignments(assignments: Record<string, string>, before: string, after: string): Record<string, string> {
  const old = splitParagraphsWithOffsets(before), next = splitParagraphsWithOffsets(after);
  let prefix = 0, suffix = 0;
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix++;
  while (suffix < before.length - prefix && suffix < after.length - prefix && before[before.length - 1 - suffix] === after[after.length - 1 - suffix]) suffix++;
  const oldEnd = before.length - suffix, newEnd = after.length - suffix, delta = after.length - before.length;
  const used = new Set<number>(), matched = new Map<number, number>();
  const bind = (i: number, j: number) => { matched.set(i, j); used.add(j); };
  old.forEach((p, i) => {
    const end = p.start + p.text.length;
    const target = end <= prefix ? p.start : p.start >= oldEnd ? p.start + delta : -1;
    const j = next.findIndex((q, j) => !used.has(j) && q.start === target && q.text === p.text);
    if (j >= 0) bind(i, j);
  });
  old.forEach((p, i) => {
    if (matched.has(i)) return;
    const candidates = next.map((q, j) => !used.has(j) && q.text === p.text ? j : -1).filter(j => j >= 0);
    if (candidates.length === 1 && old.filter((q, k) => !matched.has(k) && q.text === p.text).length === 1) bind(i, candidates[0]);
  });
  const editedOld = old.map((p, i) => !matched.has(i) && p.start <= oldEnd && p.start + p.text.length >= prefix ? i : -1).filter(i => i >= 0);
  const editedNew = next.map((p, j) => !used.has(j) && p.start <= newEnd && p.start + p.text.length >= prefix ? j : -1).filter(j => j >= 0);
  if (editedOld.length === 1 && editedNew.length === 1) bind(editedOld[0], editedNew[0]);
  const result: Record<string, string> = Object.fromEntries(Object.entries(assignments).filter(([key]) => !key.startsWith('text:') && !/^manual-\d+-\d+:\d+$/.test(key)));
  // Keep speaker boundaries inside merged paragraphs as well. They become
  // paragraph assignments again if the user restores the separator.
  const spans: { start: number; end: number; speaker: string }[] = [];
  old.forEach((p, i) => {
    const end = p.start + p.text.length;
    const anchors = Object.entries(assignments).filter(([key]) => key.startsWith('text:'))
      .map(([key, speaker]) => ({ start: Number(key.slice(5)), speaker }))
      .filter(a => a.start >= p.start && a.start < end).sort((a, b) => a.start - b.start);
    anchors.forEach((a, index) => {
      const stop = anchors[index + 1]?.start ?? end;
      const j = matched.get(i);
      if (j !== undefined && p.text === next[j].text) {
        spans.push({ start: next[j].start + a.start - p.start, end: next[j].start + stop - p.start, speaker: a.speaker });
        return;
      }
      if (a.start < prefix) spans.push({ start: a.start, end: Math.min(stop, prefix), speaker: a.speaker });
      if (stop > oldEnd) spans.push({ start: Math.max(a.start, oldEnd) + delta, end: stop + delta, speaker: a.speaker });
      // Replacement text inside a message belongs to that message, not the next.
      if (a.start <= prefix && stop >= oldEnd && prefix < end && newEnd > prefix)
        spans.push({ start: prefix, end: newEnd, speaker: a.speaker });
      if (j !== undefined && !spans.some(s => s.start < next[j].start + next[j].text.length && s.end > next[j].start))
        spans.push({ start: next[j].start, end: next[j].start + next[j].text.length, speaker: a.speaker });
    });
  });
  spans.sort((a, b) => a.start - b.start);
  next.forEach(p => {
    const end = p.start + p.text.length;
    const overlaps = spans.filter(s => s.start < end && s.end > p.start);
    result[`text:${p.start}`] = overlaps[0]?.speaker ?? '__narration__';
    for (const span of overlaps) {
      if (span.start > p.start) result[`text:${span.start}`] = span.speaker;
    }
  });
  return result;
}
