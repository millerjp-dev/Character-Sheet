import { useEffect, useState } from 'react';
import { Button } from './components/button/Button';
import { Tooltip } from './components/tooltip/Tooltip';
import { ImageCard } from './components/image/ImageCard';
import { RandomMtgCard } from './components/random-mtg-card/RandomMtgCard';
import { RuneMedallion } from './components/stat/RuneMedallion';
import { RuneSkill } from './components/stat/RuneSkill';
import { BlackHoleLink } from './components/black-hole/BlackHoleLink';
import { DebugPage } from './components/debug/DebugPage';
import { SheetEditorPage } from './components/sheet-editor/SheetEditorPage';
import { CharacterProvider } from './context/CharacterProvider';
import { BACKGROUND_THEMES, DEFAULT_CHARACTER } from './context/CharacterContext';
import type { BackgroundTheme, Character } from './context/CharacterContext';
import { useCharacter } from './context/useCharacter';
import { fetchCharacters } from './api/fetchCharacters';

function App() {
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const currentPage =
    currentPath === '/cards'
      ? 'cards'
      : currentPath === '/debug'
        ? 'debug'
        : currentPath === '/sheet-editor'
          ? 'sheet-editor'
          : 'sheet';
  const [characters, setCharacters] = useState<Character[] | null>(null);
  const [selectedId, setSelectedId] = useState(
    () => new URLSearchParams(window.location.search).get('characterId') ?? '',
  );
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const selectedCharacter = characters?.find((character) => character.id === selectedId)
    ?? characters?.[0];
  const backgroundTheme =
    currentPage === 'sheet'
      ? selectedCharacter?.backgroundTheme ?? DEFAULT_CHARACTER.backgroundTheme
      : readBackgroundThemeFromUrl() ?? DEFAULT_CHARACTER.backgroundTheme;

  useEffect(() => {
    document.documentElement.dataset.backgroundTheme = backgroundTheme;
  }, [backgroundTheme]);

  useEffect(() => {
    if (currentPage !== 'sheet') {
      return;
    }

    const controller = new AbortController();

    setCharacters(null);
    setError(null);
    fetchCharacters(controller.signal)
      .then((loadedCharacters) => {
        setCharacters(loadedCharacters);
        const requestedId = new URLSearchParams(window.location.search).get('characterId');
        const character = loadedCharacters.find((item) => item.id === requestedId)
          ?? loadedCharacters[0];
        if (character) {
          setSelectedId(character.id);
          updateCharacterQuery(character);
        }
      })
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'An unexpected error occurred while loading characters.',
          );
        }
      });

    return () => controller.abort();
  }, [currentPage, retry]);

  if (currentPage === 'cards') {
    return (
      <>
        <PageNavigation currentPage="cards" />
        <CardsPage />
      </>
    );
  }

  if (currentPage === 'debug') {
    return (
      <>
        <PageNavigation />
        <DebugPage />
      </>
    );
  }

  if (currentPage === 'sheet-editor') {
    return (
      <>
        <PageNavigation />
        <SheetEditorPage />
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageNavigation currentPage="sheet" />
        <main role="alert" style={{ margin: '48px auto', maxWidth: '720px', padding: '0 24px', color: '#f5e7c7', textAlign: 'center' }}>
          <p>Could not load characters: {error}</p>
          <button onClick={() => setRetry((attempt) => attempt + 1)} type="button">
            Try again
          </button>
        </main>
      </>
    );
  }

  if (!characters) {
    return (
      <>
        <PageNavigation currentPage="sheet" />
        <main aria-live="polite" style={{ margin: '48px auto', color: '#f5e7c7', textAlign: 'center' }}>
          Loading characters…
        </main>
      </>
    );
  }

  if (!selectedCharacter) {
    return <main role="alert">The spreadsheet contains no characters.</main>;
  }

  return (
    <>
      <PageNavigation currentPage="sheet" />
      <CharacterProvider character={selectedCharacter}>
        <CharacterSheet
          characters={characters}
          onCharacterChange={(id) => {
            const character = characters.find((item) => item.id === id);
            if (character) {
              setSelectedId(id);
              updateCharacterQuery(character);
            }
          }}
          selectedId={selectedCharacter.id}
          debugHref={createCharacterHref('/debug', selectedCharacter)}
        />
      </CharacterProvider>
    </>
  );
}

function readBackgroundThemeFromUrl(): BackgroundTheme | undefined {
  const theme = new URLSearchParams(window.location.search).get('backgroundTheme');
  return BACKGROUND_THEMES.find((candidate) => candidate === theme);
}

function updateCharacterQuery(character: Character) {
  const url = new URL(window.location.href);
  url.searchParams.set('characterId', character.id);
  url.searchParams.set('backgroundTheme', character.backgroundTheme);
  window.history.replaceState(null, '', url);
}

function createCharacterHref(path: string, character: Character): string {
  const url = new URL(path, window.location.origin);
  url.searchParams.set('characterId', character.id);
  url.searchParams.set('backgroundTheme', character.backgroundTheme);
  return `${url.pathname}${url.search}`;
}

function PageNavigation({ currentPage }: { currentPage?: 'sheet' | 'cards' }) {
  const linkStyle = {
    borderRadius: '6px',
    color: '#f5e7c7',
    fontWeight: 700,
    padding: '10px 14px',
    textDecoration: 'none',
  };

  return (
    <nav
      aria-label="Main navigation"
      style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '24px auto' }}
    >
      <a
        aria-current={currentPage === 'sheet' ? 'page' : undefined}
        href={createPageHref('/')}
        style={{
          ...linkStyle,
          background: currentPage === 'sheet' ? 'rgba(245, 231, 199, 0.16)' : 'transparent',
        }}
      >
        Character Sheet
      </a>
      <a
        aria-current={currentPage === 'cards' ? 'page' : undefined}
        href={createPageHref('/cards')}
        style={{
          ...linkStyle,
          background: currentPage === 'cards' ? 'rgba(245, 231, 199, 0.16)' : 'transparent',
        }}
      >
        Cards
      </a>
    </nav>
  );
}

function createPageHref(path: string): string {
  const url = new URL(path, window.location.origin);
  const query = new URLSearchParams(window.location.search);
  const characterId = query.get('characterId');
  const backgroundTheme = readBackgroundThemeFromUrl();
  if (characterId) {
    url.searchParams.set('characterId', characterId);
  }
  if (backgroundTheme) {
    url.searchParams.set('backgroundTheme', backgroundTheme);
  }
  return `${url.pathname}${url.search}`;
}

function CardsPage() {
  return (
    <main style={{ color: '#f5e7c7', margin: '0 auto 48px', maxWidth: '1200px', padding: '0 24px' }}>
      <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', textAlign: 'center' }}>
        Cards
      </h1>
      <div
        style={{
          display: 'grid',
          gap: '32px 24px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 282px), 1fr))',
          justifyItems: 'center',
          padding: '16px 0',
        }}
      >
        <RandomMtgCard />
        <ImageCard imageUrl="https://i.redd.it/rw82p1twm1p91.png" />
        <ImageCard title="Test" imageUrl="https://tcgplayer-cdn.tcgplayer.com/product/91093_in_1000x1000.jpg" />
        <ImageCard
          title="Test"
          subtitle="real test"
          imageUrl="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSd7Omu9KclrXu5KuEm0pPu5eL6UGgNkiy_tK-jMKw3uKCtAbFNycwH94EB&s=10"
        />
      </div>
    </main>
  );
}

function CharacterSheet({
  characters,
  onCharacterChange,
  selectedId,
  debugHref,
}: {
  characters: Character[];
  onCharacterChange: (id: string) => void;
  selectedId: string;
  debugHref: string;
}) {
  const { character } = useCharacter();

  return (
    <>
    <section aria-labelledby="ability-scores-title" style={{ margin: '48px auto', maxWidth: '720px', padding: '0 24px' }}>
      <label htmlFor="character-select" style={{ color: '#f5e7c7' }}>Character</label>
      <select
        id="character-select"
        onChange={(event) => onCharacterChange(event.target.value)}
        value={selectedId}
      >
        {characters.map((option) => (
          <option key={option.id} value={option.id}>{option.name}</option>
        ))}
      </select>
      {character.imageUrl && (
        <CharacterPortrait
          key={character.imageUrl}
          imageUrl={character.imageUrl}
          name={character.name}
        />
      )}
      <h1 id="ability-scores-title" style={{ color: '#f5e7c7', fontFamily: 'Georgia, "Times New Roman", serif', textAlign: 'center' }}>
        {character.name}&apos;s Ability Scores
      </h1>
      <div style={{ display: 'grid', gap: '32px 24px', gridTemplateColumns: 'repeat(auto-fit, minmax(136px, 1fr))', justifyItems: 'center', padding: '16px 0' }}>
        {character.stats.map((stat) => (
          <RuneMedallion key={stat.name} {...stat} />
        ))}
      </div>
    </section>
    <section aria-labelledby="skills-title" style={{ margin: '48px auto', maxWidth: '720px', padding: '0 24px' }}>
      <h2 id="skills-title" style={{ color: '#f5e7c7', fontFamily: 'Georgia, "Times New Roman", serif', textAlign: 'center' }}>
        Skills
      </h2>
      <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', justifyItems: 'center', padding: '16px 0' }}>
        {character.skills.map((skill) => (
          <RuneSkill key={skill.name} {...skill} />
        ))}
      </div>
    </section>
    <div style={{'margin': '100px',
      'alignItems': 'center', 'justifyContent' : "space-between", 'width' : '500px', 'maxWidth': 'calc(100vw - 48px)', 'display': 'flex', 'position': 'relative'}}>
      <Tooltip position='bottom' content='Test2'>
        <Button>Test</Button>
      </Tooltip>
      <Tooltip position='top' content='Test2'>
        <Button>Test</Button>
      </Tooltip>
      <Tooltip position='left' content='Test2'>
        <Button>Test</Button>
      </Tooltip>
      <Tooltip position='right' content='Test2'>
        <Button>Test</Button>
      </Tooltip>
      <BlackHoleLink
        href={debugHref}
        label="Open Debug page through the black hole"
        position={{ top: '50%', left: '50%' }}
      />
    </div>
    </>
  );
}

function CharacterPortrait({ imageUrl, name }: { imageUrl: string; name: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return null;
  }

  return (
    <img
      alt={`${name} portrait`}
      onError={() => setFailed(true)}
      src={imageUrl}
      style={{
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        display: 'block',
        height: '240px',
        margin: '20px auto',
        objectFit: 'cover',
        width: '180px',
      }}
    />
  );
}

export default App;
