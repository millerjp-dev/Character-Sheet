import type { PropsWithChildren } from 'react';
import {
  CharacterContext,
  type Character,
  type CharacterPalette,
} from './CharacterContext';

function normalizeHexColor(color: string, field: string): string {
  if (!/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color)) {
    throw new TypeError(`Character palette ${field} must be a 3- or 6-digit hex color.`);
  }

  const hex = color.slice(1);
  const expandedHex =
    hex.length === 3
      ? [...hex].map((digit) => `${digit}${digit}`).join('')
      : hex;

  return `#${expandedHex.toLowerCase()}`;
}

function createFontPaletteName(palette: CharacterPalette): string {
  const primary = normalizeHexColor(palette.primary, 'primary').slice(1);
  const secondary = normalizeHexColor(palette.secondary, 'secondary').slice(1);

  return `--rune-${primary}-${secondary}`;
}

function createFontPaletteRule(
  fontPaletteName: string,
  palette: CharacterPalette,
): string {
  const primary = normalizeHexColor(palette.primary, 'primary');
  const secondary = normalizeHexColor(palette.secondary, 'secondary');

  return `@font-palette-values ${fontPaletteName} {
  font-family: 'Nabla Variable';
  override-colors: 0 ${primary}, 1 ${secondary}, 2 ${secondary}, 3 ${secondary}, 4 ${secondary}, 5 ${secondary}, 6 ${primary}, 7 ${primary}, 8 ${secondary}, 9 ${secondary};
}`;
}

export function CharacterProvider({
  character,
  children,
}: PropsWithChildren<{ character: Character }>) {
  const palette = {
    primary: normalizeHexColor(character.palette.primary, 'primary'),
    secondary: normalizeHexColor(character.palette.secondary, 'secondary'),
  };
  const fontPaletteName = createFontPaletteName(palette);
  const currentCharacter = { ...character, palette };

  return (
    <CharacterContext.Provider value={{ character: currentCharacter, fontPaletteName }}>
      <style>{createFontPaletteRule(fontPaletteName, palette)}</style>
      {children}
    </CharacterContext.Provider>
  );
}
