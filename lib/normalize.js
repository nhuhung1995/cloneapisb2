export function normalizeJapaneseText(input = '') {
  return String(input)
    .normalize('NFKC')
    .replace(/[\s\u3000]+/g, '')
    .replace(/[丁目]/g, '-')
    .replace(/[番地]/g, '-')
    .replace(/[号]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function normalizeAddressParts(address = {}) {
  const zipCode = String(address.zipCode || '').replace(/\D/g, '').slice(0, 7);
  return {
    zipCode,
    prefecture: normalizeJapaneseText(address.prefecture || ''),
    city: normalizeJapaneseText(address.city || ''),
    chome: normalizeJapaneseText(address.chome || ''),
    banchi: normalizeJapaneseText(address.banchi || ''),
    go: normalizeJapaneseText(address.go || ''),
    buildingName: normalizeJapaneseText(address.buildingName || ''),
    room: normalizeJapaneseText(address.room || '')
  };
}

export function buildNormalizationKey(address = {}) {
  const n = normalizeAddressParts(address);
  return [n.zipCode, n.prefecture, n.city, n.chome, n.banchi, n.go, n.buildingName, n.room]
    .filter(Boolean)
    .join('|');
}
