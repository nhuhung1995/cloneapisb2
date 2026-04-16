import { buildNormalizationKey, normalizeAddressParts, normalizeJapaneseText } from './normalize.js';

function levenshtein(a = '', b = '') {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

function textSimilarity(a = '', b = '') {
  const x = normalizeJapaneseText(a);
  const y = normalizeJapaneseText(b);
  if (!x && !y) return 1;
  if (!x || !y) return 0;
  if (x === y) return 1;

  const dist = levenshtein(x, y);
  return Math.max(0, 1 - dist / Math.max(x.length, y.length));
}

const WEIGHTS = {
  zipCode: 0.1,
  city: 0.1,
  chome: 0.15,
  banchi: 0.3,
  go: 0.1,
  buildingName: 0.25
};

export function scoreAddress(inputAddress, candidate) {
  const input = normalizeAddressParts(inputAddress);
  const target = normalizeAddressParts(candidate);

  const componentScores = {
    zipCode: textSimilarity(input.zipCode, target.zipCode),
    city: textSimilarity(input.city, target.city),
    chome: textSimilarity(input.chome, target.chome),
    banchi: textSimilarity(input.banchi, target.banchi),
    go: textSimilarity(input.go, target.go),
    buildingName: textSimilarity(input.buildingName, target.buildingName)
  };

  const weightedSum = Object.entries(WEIGHTS).reduce(
    (acc, [key, weight]) => acc + componentScores[key] * weight,
    0
  );

  return {
    score: Number(weightedSum.toFixed(4)),
    normalization_key: buildNormalizationKey(inputAddress),
    componentScores
  };
}

export function bestMatch(inputAddress, candidates = []) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  let winner = null;
  for (const c of candidates) {
    const result = scoreAddress(inputAddress, c);
    if (!winner || result.score > winner.matching_score) {
      winner = {
        candidate: c,
        matching_score: result.score,
        component_scores: result.componentScores,
        normalization_key: result.normalization_key
      };
    }
  }
  return winner;
}
