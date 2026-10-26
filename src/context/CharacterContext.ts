import { createContext } from 'react';

export interface CharacterPalette {
  primary: string;
  secondary: string;
}

export interface CharacterStat {
  name: string;
  score: number;
  modifier?: number;
}

export interface CharacterSkill {
  name: string;
  bonus: number;
}

export const BACKGROUND_THEMES = [
  'deep-space',
  'arcane-forest',
  'warm-parchment',
  'rune-twilight',
] as const;

export type BackgroundTheme = (typeof BACKGROUND_THEMES)[number];

export interface Character {
  id: string;
  name: string;
  imageUrl?: string;
  backgroundTheme: BackgroundTheme;
  palette: CharacterPalette;
  stats: CharacterStat[];
  skills: CharacterSkill[];
}

export const DEFAULT_CHARACTER: Character = {
  id: 'sample-adventurer',
  name: 'Adventurer',
  backgroundTheme: 'warm-parchment',
  palette: {
    primary: '#ffd700',
    secondary: '#02abd0',
  },
  stats: [
    { name: 'Strength', score: 16, modifier: 3 },
    { name: 'Dexterity', score: 14, modifier: 2 },
    { name: 'Constitution', score: 13 },
    { name: 'Intelligence', score: 12, modifier: 1 },
    { name: 'Wisdom', score: 10, modifier: 0 },
    { name: 'Charisma', score: 8, modifier: -1 },
  ],
  skills: [
    { name: 'Animal Handling', bonus: 4 },
    { name: 'Sleight of Hand', bonus: 5 },
    { name: 'Survival', bonus: 2 },
  ],
};

export interface CharacterContextValue {
  character: Character;
  fontPaletteName: string;
}

export const CharacterContext = createContext<CharacterContextValue>({
  character: DEFAULT_CHARACTER,
  fontPaletteName: '--rune-arcane',
});
