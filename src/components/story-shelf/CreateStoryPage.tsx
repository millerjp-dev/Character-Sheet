import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { addSheetRow, SHEET_EDITOR_PASSWORD_KEY } from '../../api/sheetEditor';
import { fetchStoryChoices } from '../../api/fetchStoryChoices';
import type { StoryChoice } from '../../api/fetchStoryChoices';
import type { Character } from '../../context/CharacterContext';

const StoryTextEditor = lazy(() =>
  import('./StoryTextEditor').then(({ StoryTextEditor: Editor }) => ({ default: Editor })),
);

const panelStyle = {
  background: 'rgba(24, 21, 17, 0.94)',
  border: '1px solid rgba(245, 231, 199, 0.2)',
  borderRadius: '12px',
  padding: '20px',
};

const inputStyle = {
  background: '#171512',
  border: '1px solid rgba(245, 231, 199, 0.3)',
  borderRadius: '6px',
  boxSizing: 'border-box' as const,
  color: '#f5e7c7',
  font: 'inherit',
  minWidth: 0,
  padding: '10px',
  width: '100%',
};

export function CreateStoryPage({
  character,
  characters,
  onCharacterChange,
}: {
  character: Character;
  characters: Character[];
  onCharacterChange: (id: string) => void;
}) {
  const passwordRequired =
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [editorResetKey, setEditorResetKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [connectedStoryIds, setConnectedStoryIds] = useState<string[]>([]);
  const [storyChoices, setStoryChoices] = useState<StoryChoice[] | null>(null);
  const [storySearch, setStorySearch] = useState('');
  const [storyPickerOpen, setStoryPickerOpen] = useState(false);
  const [storyChoicesLoading, setStoryChoicesLoading] = useState(false);
  const [storyChoicesError, setStoryChoicesError] = useState<string | null>(null);
  const storyPickerRef = useRef<HTMLDialogElement>(null);
  const [editorPassword, setEditorPassword] = useState(
    () => window.sessionStorage.getItem(SHEET_EDITOR_PASSWORD_KEY) ?? '',
  );
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    if (storyPickerOpen) {
      storyPickerRef.current?.showModal();
    } else {
      storyPickerRef.current?.close();
    }
  }, [storyPickerOpen]);

  async function loadStoryChoices() {
    if (storyChoices !== null || storyChoicesLoading) {
      return;
    }
    setStoryChoicesLoading(true);
    setStoryChoicesError(null);
    try {
      setStoryChoices(await fetchStoryChoices());
    } catch (loadError: unknown) {
      setStoryChoicesError(
        loadError instanceof Error ? loadError.message : 'Unable to load existing stories.',
      );
    } finally {
      setStoryChoicesLoading(false);
    }
  }

  function openStoryPicker() {
    setStoryPickerOpen(true);
    void loadStoryChoices();
  }

  function toggleConnectedStory(storyId: string) {
    setConnectedStoryIds((ids) =>
      ids.includes(storyId) ? ids.filter((id) => id !== storyId) : [...ids, storyId],
    );
  }

  function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.sessionStorage.setItem(SHEET_EDITOR_PASSWORD_KEY, passwordInput);
    setEditorPassword(passwordInput);
    setPasswordInput('');
    setError(null);
  }

  async function createStory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) {
      setError('Story text cannot be empty.');
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      await addSheetRow('Stories', {
        id: `story-${crypto.randomUUID()}`,
        characterId: character.id,
        title: title.trim(),
        connectedStories: connectedStoryIds.join(','),
        body,
      });
      setStatus(`“${title.trim()}” was added to ${character.name}'s bookshelf.`);
      setTitle('');
      setBody('');
      setEditorResetKey((key) => key + 1);
      setConnectedStoryIds([]);
    } catch (saveError: unknown) {
      const message = saveError instanceof Error
        ? saveError.message
        : 'Unable to save this story.';
      if (passwordRequired && message === 'Enter the sheet editor password to continue.') {
        setEditorPassword('');
      }
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  const normalizedSearch = storySearch.trim().toLocaleLowerCase();
  const filteredStoryChoices = (storyChoices ?? []).filter((story) =>
    story.title.toLocaleLowerCase().includes(normalizedSearch),
  );
  const selectedStoryChoices = (storyChoices ?? []).filter((story) =>
    connectedStoryIds.includes(story.id),
  );

  return (
    <main
      style={{
        color: '#f5e7c7',
        display: 'grid',
        gap: '20px',
        margin: '0 auto 48px',
        maxWidth: '760px',
        padding: '0 24px',
      }}
    >
      <header style={{ ...panelStyle, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', marginTop: 0 }}>
          Write a Story
        </h1>
        <p style={{ marginBottom: 0 }}>
          Add a new tale to a character&apos;s bookshelf. Format your story with the editor.
        </p>
      </header>

      {error && (
        <p role="alert" style={{ ...panelStyle, borderColor: '#bd5d4c', margin: 0 }}>
          {error}
        </p>
      )}
      {status && <p role="status" style={{ ...panelStyle, margin: 0 }}>{status}</p>}

      {passwordRequired && !editorPassword ? (
        <section aria-labelledby="story-password-heading" style={panelStyle}>
          <h2
            id="story-password-heading"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', marginTop: 0 }}
          >
            Editor password required
          </h2>
          <p>Enter the sheet editor password to publish a story.</p>
          <form onSubmit={submitPassword}>
            <label style={{ display: 'grid', gap: '6px', maxWidth: '480px' }}>
              Password
              <input
                autoComplete="current-password"
                onChange={(event) => setPasswordInput(event.target.value)}
                required
                style={inputStyle}
                type="password"
                value={passwordInput}
              />
            </label>
            <button disabled={!passwordInput} style={{ marginTop: '14px' }} type="submit">
              Unlock story writing
            </button>
          </form>
        </section>
      ) : (
        <section aria-labelledby="story-form-heading" style={panelStyle}>
          <h2
            id="story-form-heading"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', marginTop: 0 }}
          >
            New story
          </h2>
          <form onSubmit={(event) => void createStory(event)}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <label style={{ display: 'grid', gap: '6px' }}>
                Character
                <select
                  disabled={busy}
                  onChange={(event) => onCharacterChange(event.target.value)}
                  style={inputStyle}
                  value={character.id}
                >
                  {characters.map((option) => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'grid', gap: '6px' }}>
                Story title
                <input
                  autoComplete="off"
                  disabled={busy}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  style={inputStyle}
                  value={title}
                />
              </label>
              <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                <legend style={{ marginBottom: '8px' }}>Connected stories</legend>
                <button onClick={openStoryPicker} type="button">
                  Choose connected stories{connectedStoryIds.length > 0
                    ? ` (${connectedStoryIds.length} selected)`
                    : ''}
                </button>
                {selectedStoryChoices.length > 0 && (
                  <ul aria-label="Selected connected stories" style={{ lineHeight: 1.6 }}>
                    {selectedStoryChoices.map((story) => (
                      <li key={story.id}>{story.characterName} — {story.title}</li>
                    ))}
                  </ul>
                )}
              </fieldset>
              <div aria-labelledby="story-body-label" style={{ display: 'grid', gap: '6px' }}>
                <span id="story-body-label">Story</span>
                <Suspense fallback={<p aria-live="polite">Loading text editor…</p>}>
                  <StoryTextEditor
                    key={editorResetKey}
                    onChange={setBody}
                  />
                </Suspense>
                <span style={{ color: '#d8cbb1', fontSize: '0.9rem' }}>
                  Formatting is saved as Markdown.
                </span>
              </div>
            </div>
            <button disabled={busy} style={{ marginTop: '16px' }} type="submit">
              {busy ? 'Saving story…' : 'Add to bookshelf'}
            </button>
          </form>
        </section>
      )}
      <dialog
        aria-labelledby="connected-stories-heading"
        onClose={() => setStoryPickerOpen(false)}
        ref={storyPickerRef}
        style={{
          background: '#181511',
          border: '1px solid rgba(245, 231, 199, 0.3)',
          borderRadius: '12px',
          boxSizing: 'border-box',
          color: '#f5e7c7',
          maxHeight: 'min(80vh, 720px)',
          maxWidth: 'min(640px, calc(100vw - 32px))',
          padding: '24px',
          width: '100%',
        }}
      >
        <header style={{ alignItems: 'start', display: 'flex', gap: '16px', justifyContent: 'space-between' }}>
          <div>
            <h2
              id="connected-stories-heading"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif', marginTop: 0 }}
            >
              Connect existing stories
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Search by title, then check each story to link it.
            </p>
          </div>
          <button autoFocus onClick={() => setStoryPickerOpen(false)} type="button">
            Done
          </button>
        </header>
        <label style={{ display: 'grid', gap: '6px' }}>
          Search by title
          <input
            autoComplete="off"
            onChange={(event) => setStorySearch(event.target.value)}
            placeholder="Type a story title"
            style={inputStyle}
            type="search"
            value={storySearch}
          />
        </label>
        {storyChoicesLoading && <p aria-live="polite">Loading stories…</p>}
        {storyChoicesError && (
          <div role="alert">
            <p>{storyChoicesError}</p>
            <button onClick={() => void loadStoryChoices()} type="button">Try again</button>
          </div>
        )}
        {storyChoices !== null && !storyChoicesLoading && !storyChoicesError && (
          <div style={{ marginTop: '16px', maxHeight: 'min(45vh, 400px)', overflowY: 'auto' }}>
            {filteredStoryChoices.length > 0 ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {filteredStoryChoices.map((story) => (
                  <li key={story.id} style={{ borderBottom: '1px solid rgba(245, 231, 199, 0.16)' }}>
                    <label
                      style={{
                        alignItems: 'center',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '12px',
                        padding: '12px 4px',
                      }}
                    >
                      <input
                        checked={connectedStoryIds.includes(story.id)}
                        onChange={() => toggleConnectedStory(story.id)}
                        type="checkbox"
                      />
                      <span>
                        <strong style={{ display: 'block' }}>{story.title}</strong>
                        <span style={{ color: '#d8cbb1', fontSize: '0.9rem' }}>
                          {story.characterName}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p>{storyChoices.length === 0 ? 'There are no existing stories to connect.' : 'No stories match that title.'}</p>
            )}
          </div>
        )}
        <p aria-live="polite" style={{ marginBottom: 0 }}>
          {connectedStoryIds.length} {connectedStoryIds.length === 1 ? 'story' : 'stories'} selected
        </p>
      </dialog>
    </main>
  );
}
