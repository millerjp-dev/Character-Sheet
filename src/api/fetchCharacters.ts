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
    ) &&
    Array.isArray(value.stories) &&
    value.stories.every(
      (story) =>
        isRecord(story) &&
        typeof story.id === 'string' &&
        typeof story.title === 'string' &&
        typeof story.body === 'string' &&
        Array.isArray(story.connectedStories) &&
        story.connectedStories.every((id) => typeof id === 'string'),
    )
  );
}

export async function fetchCharacters(
  signal?: AbortSignal,
  options: { includeStories?: boolean } = {},
): Promise<Character[]> {
  const url = new URL('/api/characters', window.location.origin);
  if (options.includeStories === false) {
    url.searchParams.set('includeStories', 'false');
  }
  const response = await fetch(url, { signal });
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
