import React, { useState, useRef } from 'react';
import type { ReactNode } from 'react';
import styled from '@emotion/styled';

const CardContainer = styled.div`
  perspective: 1000px;
  display: inline-block;
  cursor: pointer;
`;

const CardInner = styled.div<{ 
  rotateX: number; 
  rotateY: number; 
  mouseX: number; 
  mouseY: number;
  isHovered: boolean;
}>`
  position: relative;
  width: 280px;
  height: 400px;
  background: #1a1a1a;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  transform-style: preserve-3d;
  transition: transform 0.1s ease-out, box-shadow 0.3s ease;

  /* Apply dynamic 3D tilt */
  transform: ${({ isHovered, rotateX, rotateY }) =>
    isHovered
      ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
      : `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`};

  box-shadow: ${({ isHovered, mouseX, mouseY }) =>
    isHovered
      ? `${-mouseX * 20}px${mouseY * 20}px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 255, 255, 0.1)`
      : `0 10px 30px rgba(0, 0, 0, 0.5)`};

  /* Holographic Sheen Overlay */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at ${({ mouseX }) => `${(mouseX + 0.5) * 100}%`} 
                    ${({ mouseY }) => `${(mouseY + 0.5) * 100}%`},
      rgba(255, 255, 255, 0.25) 0%,
      rgba(255, 0, 128, 0.1) 40%,
      rgba(0, 240, 255, 0.1) 60%,
      transparent 90%
    );
    opacity: ${({ isHovered }) => (isHovered ? 1 : 0)};
    mix-blend-mode: overlay;
    transition: opacity 0.2s ease;
    pointer-events: none;
  }
`;

const CardContent = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  color: #fff;
  background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
`;

interface ImageCardProps {
  title?: string;
  subtitle?: string;
  imageUrl: string;
  children?: ReactNode;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  title,
  subtitle,
  imageUrl,
  children,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();

    // Calculate mouse position relative to the center of the card (-0.5 to 0.5)
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    setMouseX(x);
    setMouseY(y);

    // Invert angles for intuitive tilt (max 15 degrees tilt)
    setRotateX(-y * 30);
    setRotateY(x * 30);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setMouseX(0);
    setMouseY(0);
  };

  return (
    <CardContainer
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <CardInner
        rotateX={rotateX}
        rotateY={rotateY}
        mouseX={mouseX}
        mouseY={mouseY}
        isHovered={isHovered}
        style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {(title || subtitle || children) &&<CardContent>
          {title && <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem' }}>{title}</h3>}
          {subtitle && <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', opacity: 0.8 }}>{subtitle}</p>}
          {children}
        </CardContent>}
      </CardInner>
    </CardContainer>
  );
};