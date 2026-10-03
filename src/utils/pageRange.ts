/**
 * Parses user page input like "1, 2, 3, 5" or "1-3, 5"
 * Returns sorted unique array of 1-indexed numbers <= maxPages.
 */
export function parsePageRange(rangeStr: string, maxPages: number): number[] {
  if (!rangeStr || !rangeStr.trim()) return [];
  const pages = new Set<number>();
  const tokens = rangeStr.split(/[\s,]+/);
  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;
    if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      const start = parseInt(parts[0], 10);
      const end = parseInt(parts[1], 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        for (let i = min; i <= max; i++) {
          if (i >= 1 && i <= maxPages) pages.add(i);
        }
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= maxPages) {
        pages.add(num);
      }
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Converts array of page numbers to human-readable string like "1, 2, 3, 5"
 */
export function formatPageRange(pages: number[]): string {
  if (!pages || pages.length === 0) return '';
  return pages.sort((a, b) => a - b).join(', ');
}
