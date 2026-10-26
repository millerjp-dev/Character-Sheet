import React, { useCallback, useEffect, useState } from 'react';
import { ImageCard } from '../image/ImageCard';
import { Button } from '../button/Button';
import { fetchRandomCard } from '../../api/fetchRandomCard';
import type { ScryfallCardData } from '../../api/fetchRandomCard';


export const RandomMtgCard: React.FC = () => {
  const [card, setCard] = useState<ScryfallCardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadRandomCard = useCallback(() => {
    setLoading(true);
    fetchRandomCard().subscribe({
      next: setCard,
      error: (error: unknown) => {
        console.error('Failed to fetch MTG card:', error);
        setLoading(false);
      },
      complete: () => setLoading(false),
    });
  }, []);

  // Fetch a random card when the component first mounts on refresh
  useEffect(() => {
    loadRandomCard();
  }, [loadRandomCard]);

  if (!card) {
    return (
      <div aria-busy={loading} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div
          aria-live="polite"
          role="status"
          style={{
            alignItems: 'center',
            background: '#1a1a1a',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            boxSizing: 'border-box',
            color: '#fff',
            display: 'flex',
            height: '402px',
            justifyContent: 'center',
            padding: '20px',
            textAlign: 'center',
            width: '282px',
          }}
        >
          Loading random card from the multiverse...
        </div>
      </div>
    );
  }

  // Fallback image handling if a card layout doesn't have standard normal image URIs
  const imageUrl = card.image_uris?.normal || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500';

  return (
    <div aria-busy={loading} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <ImageCard
        imageUrl={imageUrl}
      >
        <Button customTheme="cyberpunk" disabled={loading} onClick={loadRandomCard}>
          {loading ? 'Drawing...' : 'Draw Another Card'}
        </Button>
      </ImageCard>
    </div>
  );
};