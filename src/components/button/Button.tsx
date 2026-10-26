import React, { useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';

// Ripple animation keyframes
const rippleAnimation = keyframes`
  0% {
    transform: scale(0);
    opacity: 0.5;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
`;

// Helper functions for dynamic theme edge/shadow colors
const getBorderColor = (theme?: 'nature' | 'cyberpunk') => {
  switch (theme) {
    case 'nature':
      return '#1b5e20'; // Darker forest green edge
    case 'cyberpunk':
      return '#a20055'; // Darker magenta/pink edge
    default:
      return '#111111'; // Dark grey edge
  }
};

const getShadowColor = (theme?: 'nature' | 'cyberpunk') => {
  switch (theme) {
    case 'nature':
      return '#0d3b11';
    case 'cyberpunk':
      return '#6b0038';
    default:
      return '#000000';
  }
};

// 3D Styled button component using Emotion
const StyledButton = styled.button<{ customTheme?: 'nature' | 'cyberpunk' }>`
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  outline: none;
  user-select: none;

  /* 1. Theme Backgrounds */
  background: ${({ customTheme }) =>
    customTheme === 'nature'
      ? 'linear-gradient(135deg, #2e7d32, #81c784)'
      : customTheme === 'cyberpunk'
      ? 'linear-gradient(135deg, #ff007f, #00f0ff)'
      : '#333'};
  color: #fff;

  /* 2. 3D Edge & Depth Shadows */
  border-bottom: 5px solid ${({ customTheme }) => getBorderColor(customTheme)};
  box-shadow: 0 5px 0 ${({ customTheme }) => getShadowColor(customTheme)},
              0 8px 15px rgba(0, 0, 0, 0.4);

  /* Transition properties adjusted so 3D transforms feel snappy */
  transition: transform 0.1s ease, border-bottom-width 0.1s ease, box-shadow 0.1s ease, filter 0.2s ease;

  /* Hover Lift */
  &:hover {
    filter: brightness(1.1);
    transform: translateY(-2px);
    box-shadow: 0 7px 0 ${({ customTheme }) => getShadowColor(customTheme)},
                0 10px 20px rgba(0, 0, 0, 0.5);
  }

  /* 3. Physical Press Down Effect */
  &:active {
    transform: translateY(3px);
    border-bottom-width: 2px;
    box-shadow: 0 2px 0 ${({ customTheme }) => getShadowColor(customTheme)},
                0 4px 8px rgba(0, 0, 0, 0.3);
  }

  /* Ripple span */
  .ripple {
    position: absolute;
    border-radius: 50%;
    transform: scale(0);
    animation: ${rippleAnimation} 0.6s linear;
    background-color: rgba(255, 255, 255, 0.7);
    pointer-events: none;
  }
`;

interface RipplePosition {
  x: number;
  y: number;
  id: number;
}

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  customTheme?: 'nature' | 'cyberpunk';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<CustomButtonProps> = ({
  customTheme,
  icon,
  children,
  onClick,
  ...props
}) => {
  const [ripples, setRipples] = useState<RipplePosition[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple: RipplePosition = {
      x,
      y,
      id: Date.now(),
    };

    setRipples((prevRipples) => [...prevRipples, newRipple]);

    if (onClick) {
      onClick(e);
    }
  };

  const handleAnimationEnd = (id: number) => {
    setRipples((prevRipples) => prevRipples.filter((ripple) => ripple.id !== id));
  };

  return (
    <StyledButton customTheme={customTheme} onClick={handleClick} {...props}>
      {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
      <span style={{ zIndex: 1 }}>{children}</span>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '50px',
            height: '50px',
            marginLeft: '-25px',
            marginTop: '-25px',
          }}
          onAnimationEnd={() => handleAnimationEnd(ripple.id)}
        />
      ))}
    </StyledButton>
  );
};