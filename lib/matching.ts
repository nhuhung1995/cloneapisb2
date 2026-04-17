import { normalizeJapaneseAddress, extractBuildingNumberScore } from '@/lib/normalization';

type Candidate = {
  id: string;
  banchiNumber: string;
  goNumber: string | null;
  buildingName: string | null;
  normalizationKey: string;
};

export type MatchResult = {
  id: string;
  score: number;
  reason: string;
};

function scoreNumbers(input: number[], target: number[]): number {
  if (!input.length || !target.length) return 0;

  let score = 0;
  const maxLen = Math.max(input.length, target.length);

  for (let i = 0; i < Math.min(input.length, target.length); i += 1) {
    if (input[i] === target[i]) {
      score += i === 0 ? 0.75 : 0.5;
    } else {
      const diff = Math.abs(input[i] - target[i]);
      score += Math.max(0, 0.25 - diff * 0.02);
    }
  }

  return Math.min(1, score / maxLen);
}

function scoreText(input: string, target: string): number {
  if (!input || !target) return 0;
  if (input === target) return 1;
  if (target.includes(input) || input.includes(target)) return 0.75;

  const inputSet = new Set(input.split(''));
  const targetSet = new Set(target.split(''));

  const intersect = [...inputSet].filter((x) => targetSet.has(x)).length;
  const union = new Set([...inputSet, ...targetSet]).size;

  return union === 0 ? 0 : intersect / union;
}

export function matchBanchi(inputRaw: string, candidates: Candidate[]): MatchResult | null {
  if (!candidates.length) return null;

  const normalizedInput = normalizeJapaneseAddress(inputRaw);
  const inputNumbers = extractBuildingNumberScore(inputRaw);

  let best: MatchResult | null = null;

  for (const candidate of candidates) {
    const targetNumberText = [candidate.banchiNumber, candidate.goNumber].filter(Boolean).join('-');
    const targetNumbers = extractBuildingNumberScore(targetNumberText);

    const normalizedTarget = normalizeJapaneseAddress(
      [candidate.banchiNumber, candidate.goNumber, candidate.buildingName ?? ''].join('-')
    );

    const numberScore = scoreNumbers(inputNumbers, targetNumbers);
    const textScore = scoreText(normalizedInput, normalizedTarget);

    const finalScore = Number((numberScore * 0.75 + textScore * 0.25).toFixed(4));

    if (!best || finalScore > best.score) {
      best = {
        id: candidate.id,
        score: finalScore,
        reason: `number=${numberScore.toFixed(3)} text=${textScore.toFixed(3)}`
      };
    }
  }

  return best;
}
