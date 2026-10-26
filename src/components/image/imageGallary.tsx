import React from 'react';
import styled from '@emotion/styled';
import { Tooltip } from './../tooltip/Tooltip';

export interface AltArtItem {
  id?: string;
  setName?: string;
  artist?: string;
  imageUrl: string; // Can be art_crop, normal, or borderless image
  fullCardUrl?: string;
}

const GalleryGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 0;
`;

const ThumbnailContainer = styled.div<{ isActive: boolean }>`
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  user-select: none;

  /* Border styling based on selection state */
  border: 2px solid ${({ isActive }) => (isActive ? '#00f0ff' : 'rgba(255, 255, 255, 0.2)')};
  box-shadow: ${({ isActive }) =>
    isActive
      ? '0 0 12px rgba(0, 240, 255, 0.6), 0 4px 8px rgba(0, 0, 0, 0.5)'
      : '0 4px 8px rgba(0, 0, 0, 0.3)'};

  /* 3D hover transition */
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px) scale(1.05);
    border-color: ${({ isActive }) => (isActive ? '#00f0ff' : 'rgba(255, 255, 255, 0.6)')};
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6), 0 0 8px rgba(255, 255, 255, 0.3);
  }

  &:active {
    transform: translateY(-1px) scale(0.98);
  }
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const ActiveIndicator = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #00f0ff;
  box-shadow: 0 0 6px #00f0ff;
`;

interface AltArtGalleryProps {
  artVariants: AltArtItem[];
  selectedId: string;
  onSelectVariant: (variant: AltArtItem) => void;
}

export const AltArtGallery: React.FC<AltArtGalleryProps> = ({
  artVariants,
  selectedId,
  onSelectVariant,
}) => {
  return (
    <GalleryGrid>
      {artVariants.map((item) => {
        const isActive = item.id === selectedId;

        return (
          <Tooltip
            key={item.id}
            position="top"
            content={
              <div style={{ textAlign: 'left', lineHeight: '1.3' }}>
                <div style={{ fontWeight: 700, color: '#00f0ff' }}>{item.setName}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Art by: {item.artist}</div>
              </div>
            }
          >
            <ThumbnailContainer
              isActive={isActive}
              onClick={() => onSelectVariant(item)}
            >
              <ThumbnailImage src={item.imageUrl} alt={`${item.setName} art`} />
              {isActive && <ActiveIndicator />}
            </ThumbnailContainer>
          </Tooltip>
        );
      })}
    </GalleryGrid>
  );
};