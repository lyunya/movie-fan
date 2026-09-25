/** One adjacent-pair pass: a short, reversible tune-up, never a global score. */
export function comparePair(
  ids: string[],
  index: number,
  choice: 'left' | 'right' | 'tie' | 'skip'
) {
  const next = [...ids]
  if (choice === 'right' && index >= 0 && index + 1 < next.length) {
    ;[next[index], next[index + 1]] = [next[index + 1]!, next[index]!]
  }
  return next
}
