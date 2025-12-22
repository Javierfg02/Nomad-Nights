// Deterministic color generation based on string input (Country Code)
const PALETTE = [
  '#3B82F6', // Blue 500
  '#10B981', // Emerald 500
  '#F59E0B', // Amber 500
  '#EF4444', // Red 500
  '#8B5CF6', // Violet 500
  '#EC4899', // Pink 500
  '#06B6D4', // Cyan 500
  '#F97316', // Orange 500
  '#6366F1', // Indigo 500
  '#14B8A6', // Teal 500
];

export const getCountryColor = (countryCode) => {
  if (!countryCode) return '#94A3B8'; // Slate 400 for unknown

  let hash = 0;
  for (let i = 0; i < countryCode.length; i++) {
    hash = countryCode.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
};
