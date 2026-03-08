export interface AvatarPreset {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export const AVATARS: AvatarPreset[] = [
  { id: 'fire', label: 'Fire', emoji: '\uD83D\uDD25', color: '#e74c3c' },
  { id: 'water', label: 'Water', emoji: '\uD83D\uDCA7', color: '#3498db' },
  { id: 'grass', label: 'Grass', emoji: '\uD83C\uDF3F', color: '#2ecc71' },
  { id: 'electric', label: 'Electric', emoji: '\u26A1', color: '#f1c40f' },
  { id: 'psychic', label: 'Psychic', emoji: '\uD83D\uDD2E', color: '#e84393' },
  { id: 'dark', label: 'Dark', emoji: '\uD83C\uDF11', color: '#636e72' },
  { id: 'dragon', label: 'Dragon', emoji: '\uD83D\uDC09', color: '#6c5ce7' },
  { id: 'fairy', label: 'Fairy', emoji: '\u2728', color: '#fd79a8' },
  { id: 'fighting', label: 'Fighting', emoji: '\uD83E\uDD4A', color: '#d63031' },
  { id: 'ghost', label: 'Ghost', emoji: '\uD83D\uDC7B', color: '#a29bfe' },
  { id: 'steel', label: 'Steel', emoji: '\uD83D\uDEE1\uFE0F', color: '#b2bec3' },
  { id: 'ice', label: 'Ice', emoji: '\u2744\uFE0F', color: '#74b9ff' },
  { id: 'poison', label: 'Poison', emoji: '\u2620\uFE0F', color: '#6c5ce7' },
  { id: 'ground', label: 'Ground', emoji: '\uD83C\uDFDC\uFE0F', color: '#e17055' },
  { id: 'flying', label: 'Flying', emoji: '\uD83E\uDD85', color: '#81ecec' },
  { id: 'bug', label: 'Bug', emoji: '\uD83D\uDC1B', color: '#00b894' },
];

export function getAvatarById(id: string | null | undefined): AvatarPreset | undefined {
  if (!id) return undefined;
  return AVATARS.find((a) => a.id === id);
}
