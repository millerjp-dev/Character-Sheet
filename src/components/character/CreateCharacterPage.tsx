import { useState } from 'react';
import type { FormEvent } from 'react';
import { addSheetRow, SHEET_EDITOR_PASSWORD_KEY } from '../../api/sheetEditor';

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

function colorValue(value: string): string {
  return /^#[\da-f]{6}$/i.test(value) ? value : '#000000';
}

export function CreateCharacterPage() {
  const passwordRequired =
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#ffd700');
  const [secondaryColor, setSecondaryColor] = useState('#02abd0');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCharacter, setCreatedCharacter] = useState<{
    name: string;
    href: string;
  } | null>(null);
  const [editorPassword, setEditorPassword] = useState(
    () => window.sessionStorage.getItem(SHEET_EDITOR_PASSWORD_KEY) ?? '',
  );
  const [passwordInput, setPasswordInput] = useState('');

  function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.sessionStorage.setItem(SHEET_EDITOR_PASSWORD_KEY, passwordInput);
    setEditorPassword(passwordInput);
    setPasswordInput('');
    setError(null);
  }

  async function createCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setCreatedCharacter(null);
    const characterId = `character-${crypto.randomUUID()}`;
    const characterName = name.trim();
    try {
      await addSheetRow('Characters', {
        id: characterId,
        name: characterName,
        primaryColor,
        secondaryColor,
        imageUrl: imageUrl.trim(),
      });
      const url = new URL('/', window.location.origin);
      url.searchParams.set('characterId', characterId);
      url.searchParams.set('backgroundTheme', 'warm-parchment');
      setCreatedCharacter({
        name: characterName,
        href: `${url.pathname}${url.search}`,
      });
      setName('');
      setImageUrl('');
      setPrimaryColor('#ffd700');
      setSecondaryColor('#02abd0');
    } catch (saveError: unknown) {
      const message = saveError instanceof Error
        ? saveError.message
        : 'Unable to create this character.';
      if (passwordRequired && message === 'Enter the sheet editor password to continue.') {
        setEditorPassword('');
      }
      setError(message);
    } finally {
      setBusy(false);
    }
  }

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
          Create a Character
        </h1>
        <p style={{ marginBottom: 0 }}>
          Add a new character to the sheet. You can add their stats, skills, and stories afterward.
        </p>
      </header>

      {error && (
        <p role="alert" style={{ ...panelStyle, borderColor: '#bd5d4c', margin: 0 }}>
          {error}
        </p>
      )}
      {createdCharacter && (
        <p role="status" style={{ ...panelStyle, margin: 0 }}>
          {createdCharacter.name} was created.{' '}
          <a href={createdCharacter.href} style={{ color: '#f1cf88' }}>
            Open character sheet
          </a>
        </p>
      )}

      {passwordRequired && !editorPassword ? (
        <section aria-labelledby="character-password-heading" style={panelStyle}>
          <h2
            id="character-password-heading"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', marginTop: 0 }}
          >
            Editor password required
          </h2>
          <p>Enter the sheet editor password to create a character.</p>
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
              Unlock character creation
            </button>
          </form>
        </section>
      ) : (
        <section aria-labelledby="character-form-heading" style={panelStyle}>
          <h2
            id="character-form-heading"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', marginTop: 0 }}
          >
            New character
          </h2>
          <form onSubmit={(event) => void createCharacter(event)}>
            <div style={{ display: 'grid', gap: '16px' }}>
              <label style={{ display: 'grid', gap: '6px' }}>
                Character name
                <input
                  autoComplete="off"
                  disabled={busy}
                  onChange={(event) => setName(event.target.value)}
                  required
                  style={inputStyle}
                  value={name}
                />
              </label>
              <label style={{ display: 'grid', gap: '6px' }}>
                Portrait image URL (optional)
                <input
                  autoComplete="url"
                  disabled={busy}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://example.com/portrait.png"
                  style={inputStyle}
                  type="url"
                  value={imageUrl}
                />
              </label>
              <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))' }}>
                <label style={{ display: 'grid', gap: '6px' }}>
                  Primary color
                  <input
                    aria-label="Primary color"
                    disabled={busy}
                    onChange={(event) => setPrimaryColor(event.target.value)}
                    required
                    style={{ ...inputStyle, minHeight: '44px', padding: '4px' }}
                    type="color"
                    value={colorValue(primaryColor)}
                  />
                </label>
                <label style={{ display: 'grid', gap: '6px' }}>
                  Secondary color
                  <input
                    aria-label="Secondary color"
                    disabled={busy}
                    onChange={(event) => setSecondaryColor(event.target.value)}
                    required
                    style={{ ...inputStyle, minHeight: '44px', padding: '4px' }}
                    type="color"
                    value={colorValue(secondaryColor)}
                  />
                </label>
              </div>
            </div>
            <button disabled={busy} style={{ marginTop: '16px' }} type="submit">
              {busy ? 'Creating character…' : 'Create character'}
            </button>
          </form>
        </section>
      )}
    </main>
  );
}
