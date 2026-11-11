import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(4px) var(--position-transform);
  }
  to {
    opacity: 1;
    transform: translateY(0) var(--position-transform);
  }
`;

const Wrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const TooltipBox = styled.div<{ position: 'top' | 'bottom' | 'left' | 'right' }>`
  position: fixed;
  z-index: 1000;
  padding: 6px 10px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #fff;
  background: rgba(20, 20, 20, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  max-width: min(320px, calc(100vw - 32px));
  overflow-wrap: anywhere;
  white-space: normal;
  pointer-events: none;
  animation: ${fadeIn} 0.2s ease-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  ${({ position = 'top' }) => {
    const transform = position === 'top' || position === 'bottom'
      ? 'translateX(-50%)'
      : 'translateY(-50%)';
    return `--position-transform: ${transform}; transform: ${transform};`;
  }}
`;

interface TooltipProps {
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactNode;
}

interface TooltipCoordinates {
  left: number;
  top: number;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const VIEWPORT_GAP = 8;
const ANCHOR_GAP = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coordinates, setCoordinates] = useState<TooltipCoordinates | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  useLayoutEffect(() => {
    if (!isVisible) {
      return;
    }

    const updatePosition = () => {
      const wrapper = wrapperRef.current;
      const tooltip = tooltipRef.current;
      if (!wrapper || !tooltip) {
        return;
      }

      const anchor = wrapper.getBoundingClientRect();
      const bubble = tooltip.getBoundingClientRect();
      const width = window.innerWidth;
      const height = window.innerHeight;
      let resolvedPosition = position;

      if (position === 'top' && anchor.top - bubble.height - ANCHOR_GAP < VIEWPORT_GAP &&
          anchor.bottom + bubble.height + ANCHOR_GAP <= height - VIEWPORT_GAP) {
        resolvedPosition = 'bottom';
      } else if (position === 'bottom' &&
          anchor.bottom + bubble.height + ANCHOR_GAP > height - VIEWPORT_GAP &&
          anchor.top - bubble.height - ANCHOR_GAP >= VIEWPORT_GAP) {
        resolvedPosition = 'top';
      } else if (position === 'left' &&
          anchor.left - bubble.width - ANCHOR_GAP < VIEWPORT_GAP &&
          anchor.right + bubble.width + ANCHOR_GAP <= width - VIEWPORT_GAP) {
        resolvedPosition = 'right';
      } else if (position === 'right' &&
          anchor.right + bubble.width + ANCHOR_GAP > width - VIEWPORT_GAP &&
          anchor.left - bubble.width - ANCHOR_GAP >= VIEWPORT_GAP) {
        resolvedPosition = 'left';
      }

      let left: number;
      let top: number;
      if (resolvedPosition === 'top' || resolvedPosition === 'bottom') {
        left = clamp(
          anchor.left + anchor.width / 2,
          bubble.width / 2 + VIEWPORT_GAP,
          width - bubble.width / 2 - VIEWPORT_GAP,
        );
        top = resolvedPosition === 'top'
          ? anchor.top - bubble.height - ANCHOR_GAP
          : anchor.bottom + ANCHOR_GAP;
        top = clamp(top, VIEWPORT_GAP, height - bubble.height - VIEWPORT_GAP);
      } else {
        left = resolvedPosition === 'left'
          ? anchor.left - bubble.width - ANCHOR_GAP
          : anchor.right + ANCHOR_GAP;
        top = clamp(
          anchor.top + anchor.height / 2,
          bubble.height / 2 + VIEWPORT_GAP,
          height - bubble.height / 2 - VIEWPORT_GAP,
        );
        left = clamp(left, VIEWPORT_GAP, width - bubble.width - VIEWPORT_GAP);
      }

      setCoordinates({ left, position: resolvedPosition, top });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isVisible, position, content]);

  return (
    <Wrapper
      ref={wrapperRef}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsVisible(false);
        }
      }}
      onFocusCapture={() => setIsVisible(true)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && createPortal(
        <TooltipBox
          id={tooltipId}
          position={coordinates?.position ?? position}
          ref={tooltipRef}
          role="tooltip"
          style={{
            left: coordinates?.left ?? -10000,
            top: coordinates?.top ?? -10000,
            visibility: coordinates ? 'visible' : 'hidden',
          }}
        >
          {content}
        </TooltipBox>,
        wrapperRef.current?.closest('dialog') ?? document.body,
      )}
    </Wrapper>
  );
};