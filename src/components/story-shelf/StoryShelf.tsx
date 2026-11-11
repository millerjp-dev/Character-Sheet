import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { ComponentProps } from 'react';
import type { Character } from '../../context/CharacterContext';
import { Tooltip } from '../tooltip/Tooltip';
import './StoryShelf.css';

function StoryFootnote({
  children,
  href,
}: ComponentProps<'a'>) {
  const match = href?.match(/^#footnote-(\d+)-(.+)$/);
  if (!match) {
    return <>{children}</>;
  }
  let note: string;
  try {
    note = decodeURIComponent(match[2]);
  } catch {
    return <>{children}</>;
  }

  return (
    <sup className="story-footnote">
      <Tooltip content={note} position="top">
        <span
          aria-label={`Footnote ${match[1]}: ${note}`}
          className="story-footnote-trigger"
          tabIndex={0}
        >
          {match[1]}
        </span>
      </Tooltip>
    </sup>
  );
}

interface StoryShelfProps {
  character: Character;
  characters: Character[];
}

export function StoryShelf({ character, characters }: StoryShelfProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pageTurnTimerRef = useRef<number | null>(null);
  const storyBodyRef = useRef<HTMLDivElement>(null);
  const [openStoryId, setOpenStoryId] = useState(
    () => character.stories.find((story) => story.id === readStoryIdFromHash())?.id ?? null,
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false);
  const [pageTurn, setPageTurn] = useState<'next' | 'previous' | null>(null);
  const activeStory = character.stories.find((story) => story.id === openStoryId);
  const pages = activeStory ? paginateStory(activeStory.body) : [];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!activeStory) {
      if (dialog?.open) {
        dialog.close();
      }
      return;
    }

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    setCurrentPage(0);
    setPageTurn(null);
    setIsContentReady(false);
    setIsOpening(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, [activeStory]);

  useEffect(() => {
    if (!activeStory || !isOpening) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      if (storyBodyRef.current?.isConnected) {
        setIsContentReady(true);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setIsOpening(false);
        }
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeStory, isOpening]);

  useEffect(() => {
    const handlePopState = () => {
      setOpenStoryId(
        character.stories.find((story) => story.id === readStoryIdFromHash())?.id ?? null,
      );
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [character.stories]);

  useEffect(() => () => {
    if (pageTurnTimerRef.current !== null) {
      window.clearTimeout(pageTurnTimerRef.current);
    }
  }, []);

  function openStory(storyId: string) {
    const url = new URL(window.location.href);
    url.hash = `story-${encodeURIComponent(storyId)}`;
    window.history.pushState(null, '', url);
    setCurrentPage(0);
    setOpenStoryId(storyId);
  }

  function closeStory() {
    dialogRef.current?.close();
  }

  function turnPage(direction: 'next' | 'previous') {
    if (pageTurn || isOpening) {
      return;
    }
    setPageTurn(direction);
    pageTurnTimerRef.current = window.setTimeout(() => {
      setCurrentPage((page) => page + (direction === 'next' ? 1 : -1));
      setPageTurn(null);
      pageTurnTimerRef.current = null;
    }, 340);
  }

  function handleDialogClose() {
    setOpenStoryId(null);
    setIsOpening(false);
    setPageTurn(null);
    if (pageTurnTimerRef.current !== null) {
      window.clearTimeout(pageTurnTimerRef.current);
      pageTurnTimerRef.current = null;
    }
    const url = new URL(window.location.href);
    if (url.hash.startsWith('#story-')) {
      url.hash = '';
      window.history.replaceState(null, '', url);
    }
  }

  return (
    <>
      {character.stories.length > 0 && (
        <section aria-labelledby="stories-title" className="story-shelf-section">
          <p className="story-shelf-eyebrow">The adventurer&apos;s collection</p>
          <h2 className="story-shelf-heading" id="stories-title">Stories</h2>
          <nav aria-label="Choose a story" className="story-shelf">
            <div className="story-shelf-books">
              {character.stories.map((story, index) => (
                <button
                  aria-label={`Open ${story.title}`}
                  className="story-book"
                  key={story.id}
                  onClick={() => openStory(story.id)}
                  type="button"
                >
                  <span className="story-book-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="story-book-title">{story.title}</span>
                </button>
              ))}
            </div>
            <div aria-hidden="true" className="story-shelf-ledge" />
          </nav>
        </section>
      )}
      <dialog
        aria-label={activeStory ? `Reading ${activeStory.title}` : 'Story reader'}
        className={`story-book-dialog${isOpening ? ' is-opening' : ''}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeStory();
          }
        }}
        onClose={handleDialogClose}
        ref={dialogRef}
      >
        {activeStory && (
          <div className="story-reader">
            <div className="story-reader-pages">
              <div aria-hidden="true" className="story-reader-page-stack">
                <span />
                <span />
                <span />
              </div>
              <section
                aria-label={`Page ${currentPage + 1} of ${pages.length}`}
                className="story-reader-page"
              >
                <button
                  aria-label="Close book"
                  className="story-reader-close"
                  onClick={closeStory}
                  type="button"
                >
                  ×
                </button>
                <div
                  className={`story-reader-content${isOpening ? ' is-hidden-during-opening' : ''}`}
                  key={`${activeStory.id}-${currentPage}`}
                >
                  <p className="story-reader-kicker">Now reading</p>
                  <h2 className="story-reader-title">{activeStory.title}</h2>
                  <div className="story-reader-body" ref={storyBodyRef}>
                    <ReactMarkdown
                      components={{
                        a: ({ children, href, title }) =>
                          href?.startsWith('#footnote-') ? (
                            <StoryFootnote href={href}>{children}</StoryFootnote>
                          ) : (
                            <a href={href} title={title}>{children}</a>
                          ),
                        img: () => null,
                      }}
                    >
                      {pages[currentPage] ?? ''}
                    </ReactMarkdown>
                  </div>
                  {currentPage === pages.length - 1 && activeStory.connectedStories.length > 0 && (
                    <nav
                      aria-label={`Stories connected to ${activeStory.title}`}
                      className="story-connections"
                    >
                      <strong>Connected stories: </strong>
                      {activeStory.connectedStories.map((connectedId, index) => {
                        const targetCharacter = characters.find((candidate) =>
                          candidate.stories.some((candidateStory) => candidateStory.id === connectedId),
                        );
                        const targetStory = targetCharacter?.stories.find(
                          (candidateStory) => candidateStory.id === connectedId,
                        );
                        if (!targetCharacter || !targetStory) {
                          return null;
                        }
                        return (
                          <span key={connectedId}>
                            {index > 0 ? ', ' : ''}
                            <a
                              href={createStoryHref(targetCharacter, connectedId)}
                              style={{ color: '#76521f' }}
                            >
                              {targetStory.title}
                            </a>
                          </span>
                        );
                      })}
                    </nav>
                  )}
                </div>
                {pageTurn && (
                  <div
                    aria-hidden="true"
                    className={`story-page-turn story-page-turn-${pageTurn}`}
                    key={`${pageTurn}-${currentPage}`}
                  />
                )}
                <footer className="story-reader-controls">
                  <button
                    disabled={currentPage === 0 || isOpening || pageTurn !== null}
                    onClick={() => turnPage('previous')}
                    type="button"
                  >
                    Previous
                  </button>
                  <span aria-live="polite">
                    Page {currentPage + 1} of {pages.length}
                  </span>
                  <button
                    disabled={currentPage >= pages.length - 1 || isOpening || pageTurn !== null}
                    onClick={() => turnPage('next')}
                    type="button"
                  >
                    Next
                  </button>
                </footer>
              </section>
            </div>
            {isOpening && (
              <div aria-hidden="true" className="story-opening-pages">
                <span className="story-opening-page story-opening-page-one" />
                <span
                  className="story-opening-page story-opening-page-two"
                  onAnimationIteration={() => {
                    if (isContentReady) {
                      setIsOpening(false);
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}

function createStoryHref(character: Character, storyId: string): string {
  const url = new URL('/', window.location.origin);
  url.searchParams.set('characterId', character.id);
  url.searchParams.set('backgroundTheme', character.backgroundTheme);
  url.hash = `story-${encodeURIComponent(storyId)}`;
  return `${url.pathname}${url.search}${url.hash}`;
}

function readStoryIdFromHash(): string | undefined {
  if (!window.location.hash.startsWith('#story-')) {
    return undefined;
  }

  try {
    return decodeURIComponent(window.location.hash.slice('#story-'.length));
  } catch {
    return undefined;
  }
}

function paginateStory(body: string): string[] {
  const paragraphs = body.trim().split(/\n\s*\n/).filter(Boolean);
  if (paragraphs.length === 0) {
    return [''];
  }

  const blocks = paragraphs.flatMap((paragraph) => {
    if (paragraph.length <= 850) {
      return [paragraph];
    }

    const chunks: string[] = [];
    let chunk = '';
    for (const word of paragraph.split(/\s+/)) {
      const nextChunk = chunk ? `${chunk} ${word}` : word;
      if (chunk && nextChunk.length > 850) {
        chunks.push(chunk);
        chunk = word;
      } else {
        chunk = nextChunk;
      }
    }
    if (chunk) {
      chunks.push(chunk);
    }
    return chunks;
  });

  const pages: string[] = [];
  let page = '';
  for (const block of blocks) {
    const nextPage = page ? `${page}\n\n${block}` : block;
    if (page && nextPage.length > 850) {
      pages.push(page);
      page = block;
    } else {
      page = nextPage;
    }
  }
  if (page) {
    pages.push(page);
  }
  return pages;
}
