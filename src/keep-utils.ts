/**
 * Returns true if a todo line is an empty (text-less) checkbox.
 */
export function isEmptyTodo(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === "- [ ]" || trimmed === "- [  ]";
}

/**
 * Builds a human-readable keep summary for a Notice.
 * Returns null if there is nothing to report.
 */
export function buildKeepNotice(
  todosKept: number,
  headingNotFoundMessage: string | null
): string | null {
  const parts: string[] = [];
  if (headingNotFoundMessage) parts.push(headingNotFoundMessage);
  if (todosKept > 0)
    parts.push(`Kept ${todosKept} incomplete todo${todosKept > 1 ? "s" : ""}.`);
  return parts.length > 0 ? parts.join("\n") : null;
}
