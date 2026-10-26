import { BACKGROUND_THEMES, type Character } from '../context/CharacterContext';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isBackgroundTheme(value: unknown): value is Character['backgroundTheme'] {
  return BACKGROUND_THEMES.some((theme) => theme === value);
}

function isCharacter(value: unknown): value is Character {
  if (!isRecord(value) || !isRecord(value.palette)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    isBackgroundTheme(value.backgroundTheme) &&
    (value.imageUrl === undefined ||
      (typeof value.imageUrl === 'string' && isHttpUrl(value.imageUrl))) &&
    typeof value.palette.primary === 'string' &&
    typeof value.palette.secondary === 'string' &&
    Array.isArray(value.stats) &&
    value.stats.every(
      (stat) =>
        isRecord(stat) &&
        typeof stat.name === 'string' &&
        typeof stat.score === 'number' &&
        (stat.modifier === undefined || typeof stat.modifier === 'number'),
    ) &&
    Array.isArray(value.skills) &&
    value.skills.every(
      (skill) =>
        isRecord(skill) &&
        typeof skill.name === 'string' &&
        typeof skill.bonus === 'number',
    )
  );
}

export async function fetchCharacters(signal?: AbortSignal): Promise<Character[]> {
  const response = await fetch('/api/characters', { signal });
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const message =
      isRecord(payload) && typeof payload.error === 'string'
        ? payload.error
        : `Character API request failed with HTTP ${response.status}.`;
    throw new Error(message);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload) || !payload.every(isCharacter)) {
    throw new TypeError('Character API returned data in an unexpected format.');
  }
  if (payload.length === 0) {
    throw new Error('The spreadsheet contains no characters.');
  }

  return payload;
}
