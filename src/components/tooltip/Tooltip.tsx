import React, { useState } from 'react';
import type { ReactNode } from 'react';
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

const TooltipBox = styled.div<{ position?: 'top' | 'bottom' | 'left' | 'right' }>`
  position: absolute;
  z-index: 1000;
  padding: 6px 10px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #fff;
  background: rgba(20, 20, 20, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  white-space: nowrap;
  pointer-events: none;
  animation: ${fadeIn} 0.2s ease-out;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  /* Dynamic positioning logic */
  ${({ position = 'top' }) => {
    switch (position) {
      case 'bottom':
        return `
          top: calc(100% + 8px);
          left: 50%;
          --position-transform: translateX(-50%);
          transform: translateX(-50%);
        `;
      case 'left':
        return `
          top: 50%;
          right: calc(100% + 8px);
          --position-transform: translateY(-50%);
          transform: translateY(-50%);
        `;
      case 'right':
        return `
          top: 50%;
          left: calc(100% + 8px);
          --position-transform: translateY(-50%);
          transform: translateY(-50%);
        `;
      case 'top':
      default:
        return `
          bottom: calc(100% + 8px);
          left: 50%;
          --position-transform: translateX(-50%);
          transform: translateX(-50%);
        `;
    }
  }}
`;

interface TooltipProps {
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Wrapper
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && <TooltipBox position={position}>{content}</TooltipBox>}
    </Wrapper>
  );
};