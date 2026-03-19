/**
 * Returns true if a todo line is an empty (text-less) checkbox.
 */
export function isEmptyTodo(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === "- [ ]" || trimmed === "- [  ]";
}

/**
 * Inserts todos into note content, either after a template heading or appended
 * at the end. Returns the modified content and whether the heading was found.
 */
export function insertTodosIntoNote(
  content: string,
  todos: string[],
  heading: string,
  leadingNewLine: boolean
): { content: string; headingFound: boolean } {
  const todoBlock = `\n${todos.join("\n")}`;

  if (heading === "none") {
    return { content: content + todoBlock, headingFound: true };
  }

  const updated = content.replace(
    heading,
    `${heading}${leadingNewLine ? "\n" : ""}${todoBlock}`
  );

  if (updated === content) {
    // Heading not found — fall back to appending at the end
    return { content: content + todoBlock, headingFound: false };
  }

  return { content: updated, headingFound: true };
}

/**
 * Returns note content with the specified todo lines removed.
 */
export function removeTodosFromNote(content: string, todos: string[]): string {
  const todoSet = new Set(todos);
  return content
    .split("\n")
    .filter((line) => !todoSet.has(line))
    .join("\n");
}

/**
 * Builds a human-readable keep summary for a Notice.
 * Returns null if there is nothing to report.
 */
export function buildKeepNotice(
  todosAdded: number,
  emptiesRemoved: number,
  headingNotFoundMessage: string | null
): string | null {
  const parts: string[] = [];
  if (headingNotFoundMessage) parts.push(headingNotFoundMessage);
  if (todosAdded > 0)
    parts.push(`- ${todosAdded} todo${todosAdded > 1 ? "s" : ""} kept.`);
  if (emptiesRemoved > 0)
    parts.push(
      `- ${emptiesRemoved} empty todo${emptiesRemoved > 1 ? "s" : ""} removed.`
    );
  return parts.length > 0 ? parts.join("\n") : null;
}
