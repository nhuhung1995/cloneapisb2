const JAPANESE_SUFFIX_REPLACEMENTS: Array<[RegExp, string]> = [
  [/丁目/g, '-'],
  [/番地/g, '-'],
  [/番/g, '-'],
  [/号/g, '']
];

export function toHalfWidth(input: string): string {
  return input
    .replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/　/g, ' ')
    .normalize('NFKC');
}

export function normalizeJapaneseAddress(input: string): string {
  if (!input) return '';

  let output = toHalfWidth(input)
    .toLowerCase()
    .replace(/[\s\u3000]+/g, '');

  for (const [pattern, replacement] of JAPANESE_SUFFIX_REPLACEMENTS) {
    output = output.replace(pattern, replacement);
  }

  return output.replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function extractBuildingNumberScore(raw: string): number[] {
  const normalized = normalizeJapaneseAddress(raw);
  const numeric = normalized.match(/\d+/g) ?? [];
  return numeric.map((n) => Number(n));
}
