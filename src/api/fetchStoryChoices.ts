export interface StoryChoice {
  id: string;
  title: string;
  characterName: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function fetchStoryChoices(signal?: AbortSignal): Promise<StoryChoice[]> {
  const response = await fetch('/api/stories', { signal });
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const message =
      isRecord(payload) && typeof payload.error === 'string'
        ? payload.error
        : `Story list request failed with HTTP ${response.status}.`;
    throw new Error(message);
  }

  const payload: unknown = await response.json();
  if (
    !Array.isArray(payload) ||
    !payload.every(
      (story) =>
        isRecord(story) &&
        typeof story.id === 'string' &&
        typeof story.title === 'string' &&
        typeof story.characterName === 'string',
    )
  ) {
    throw new TypeError('Story list API returned data in an unexpected format.');
  }

  return payload;
}
