import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent, PointerEvent } from 'react';
import styled from '@emotion/styled';

type Phase = 'idle' | 'waiting' | 'forming' | 'open';

interface BlackHoleLinkProps {
  href: string;
  label: string;
  appearanceDelay?: number;
  position: {
    top: CSSProperties['top'];
    left: CSSProperties['left'];
  };
  delay?: number;
}

const Portal = styled.a<{ $phase: Phase }>`
  position: absolute;
  z-index: 1;
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  color: #f5e7c7;
  cursor: ${({ $phase }) => ($phase === 'open' ? 'pointer' : 'default')};
  outline: none;
  text-decoration: none;
  touch-action: manipulation;

  &:focus-visible {
    outline: 2px solid #f5e7c7;
    outline-offset: 4px;
  }

  &::before,
  &::after {
    position: absolute;
    inset: 5px;
    border-radius: 50%;
    content: '';
    pointer-events: none;
  }

  &::before {
    background: radial-gradient(circle, #000 0 24%, #180322 42%, #8a42a2 58%, transparent 74%);
    box-shadow: ${({ $phase }) => ($phase === 'idle' || $phase === 'waiting' ? 'none' : '0 0 8px rgba(151, 70, 190, 0.7)')};
    opacity: ${({ $phase }) => {
      if ($phase === 'idle' || $phase === 'waiting') {
        return 0;
      }
      return $phase === 'forming' ? 0.1 : 1;
    }};
    transform: scale(${({ $phase }) => ($phase === 'idle' || $phase === 'waiting' ? 0 : 1)});
    transition: opacity 180ms ease, transform 180ms ease, box-shadow 180ms ease;
  }

  &::after {
    border: 1px solid rgba(203, 140, 255, 0.8);
    opacity: ${({ $phase }) => ($phase === 'forming' || $phase === 'open' ? 0.1 : 0)};
    transform: scale(0.55);
    animation: ${({ $phase }) => ($phase === 'forming' ? 'orbit 1.2s linear infinite' : 'none')};
  }

  ${({ $phase }) =>
    $phase === 'forming' &&
    `
      &::before {
        box-shadow: 0 0 18px rgba(178, 80, 255, 0.95), 0 0 30px rgba(74, 190, 255, 0.45);
        animation: pulse 900ms ease-in-out infinite alternate;
      }
    `}

  ${({ $phase }) =>
    $phase === 'open' &&
    `
      &::before {
        box-shadow: 0 0 22px 8px rgba(178, 80, 255, 0.85), 0 0 42px rgba(74, 190, 255, 0.6);
      }

      &::after {
        animation: burst 650ms ease-out both;
      }
    `}

  @keyframes orbit {
    to {
      transform: scale(1.05) rotate(360deg);
    }
  }

  @keyframes pulse {
    to {
      transform: scale(0.82);
      filter: brightness(1.5);
    }
  }

  @keyframes burst {
    to {
      opacity: 0;
      transform: scale(2.2);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &::before,
    &::after {
      animation: none !important;
      transition: none;
    }
  }
`;

const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export function BlackHoleLink({
  href,
  label,
  position,
  appearanceDelay = 1000,
  delay = 2000,
}: BlackHoleLinkProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const statusId = useId();
  const pointerInside = useRef(false);
  const focusInside = useRef(false);
  const hasOpened = useRef(false);

  useEffect(() => {
    if (phase !== 'waiting' && phase !== 'forming') {
      return;
    }

    const timer = window.setTimeout(
      () => {
        if (phase === 'waiting') {
          setPhase('forming');
        } else {
          hasOpened.current = true;
          setPhase('open');
        }
      },
      phase === 'waiting' ? appearanceDelay : delay,
    );
    return () => window.clearTimeout(timer);
  }, [appearanceDelay, delay, phase]);

  const beginWaiting = () => {
    setPhase((currentPhase) => {
      if (currentPhase !== 'idle') {
        return currentPhase;
      }
      return hasOpened.current ? 'open' : 'waiting';
    });
  };

  const resetBeforeOpen = () => {
    setPhase((currentPhase) =>
      currentPhase === 'waiting' || currentPhase === 'forming' ? 'idle' : currentPhase,
    );
  };

  const resetIfPointerLeaves = (event: PointerEvent<HTMLAnchorElement>) => {
    pointerInside.current = false;
    if (event.pointerType === 'touch') {
      return;
    }
    setPhase('idle');
  };

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (phase !== 'open') {
      event.preventDefault();
      beginWaiting();
    }
  };

  const status =
    phase === 'open'
      ? 'The portal is open. Activate to navigate.'
      : phase === 'forming'
        ? 'Black hole forming. Stay focused or hovered until it opens.'
      : phase === 'waiting'
        ? 'Portal activation started. The black hole will begin to appear after one second.'
      : 'Hover or focus to begin forming the portal.';

  return (
    <>
      <Portal
        $phase={phase}
        aria-describedby={statusId}
        aria-disabled={phase !== 'open'}
        aria-label={label}
        href={href}
        onBlur={() => {
          focusInside.current = false;
          if (!pointerInside.current) {
            setPhase('idle');
          }
        }}
        onClick={handleClick}
        onFocus={() => {
          focusInside.current = true;
          beginWaiting();
        }}
        onPointerCancel={resetBeforeOpen}
        onPointerEnter={() => {
          pointerInside.current = true;
          beginWaiting();
        }}
        onPointerLeave={resetIfPointerLeaves}
        style={{ top: position.top, left: position.left }}
      />
      <span aria-live="polite" id={statusId} style={visuallyHidden}>
        {status}
      </span>
    </>
  );
}
