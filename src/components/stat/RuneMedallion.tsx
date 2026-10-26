import styled from '@emotion/styled';
import { FitText } from '../typography/FitText';
import { useCharacter } from '../../context/useCharacter';

export interface RuneMedallionProps {
  name: string;
  score: number;
  modifier?: number;
}

const Medallion = styled.div<{ $secondary: string }>`
  position: relative;
  display: flex;
  width: 136px;
  aspect-ratio: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px solid ${({ $secondary }) => $secondary};
  border-radius: 50%;
  background:
    radial-gradient(circle at center, rgba(73, 57, 35, 0.94), rgba(27, 25, 24, 0.98) 72%),
    #211d19;
  box-shadow:
    inset 0 0 0 5px #28221b,
    inset 0 0 0 6px ${({ $secondary }) => `${$secondary}88`},
    0 5px 16px rgba(0, 0, 0, 0.35);
  color: #f5e7c7;

  &::before,
  &::after {
    position: absolute;
    width: 6px;
    height: 6px;
    border: 1px solid #d8bd86;
    content: '';
    transform: rotate(45deg);
  }

  &::before {
    top: 13px;
  }

  &::after {
    bottom: 13px;
  }
`;

const StatName = styled(FitText)<{ $primary: string }>`
  width: 88px;
  max-width: calc(100% - 32px);
  overflow: hidden;
  color: ${({ $primary }) => $primary};
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-align: center;
  text-transform: uppercase;
  white-space: nowrap;
`;

const Score = styled.span<{ $fontPaletteName: string }>`
  color: #fff7e8;
  font-family: 'Nabla Variable', Georgia, 'Times New Roman', serif;
  font-palette: ${({ $fontPaletteName }) => $fontPaletteName};
  font-size: 2.75rem;
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 0 12px rgba(230, 190, 116, 0.35);
`;

const Modifier = styled.span<{ $primary: string; $fontPaletteName: string }>`
  position: absolute;
  right: 50%;
  bottom: -12px;
  display: grid;
  min-width: 36px;
  height: 28px;
  padding: 0 6px;
  place-items: center;
  border: 1px solid ${({ $primary }) => $primary};
  border-radius: 999px;
  background: #28221b;
  color: #fff1cf;
  font-family: 'Nabla Variable', Georgia, 'Times New Roman', serif;
  font-palette: ${({ $fontPaletteName }) => $fontPaletteName};
  font-size: 0.95rem;
  font-weight: 700;
  transform: translateX(50%);
`;

export function RuneMedallion({ name, score, modifier }: RuneMedallionProps) {
  const { character, fontPaletteName } = useCharacter();

  return (
    <Medallion
      $secondary={character.palette.secondary}
      aria-label={`${name}: ${score}${modifier === undefined ? '' : `, modifier ${modifier >= 0 ? '+' : ''}${modifier}`}`}
      role="img"
    >
      <StatName $primary={character.palette.primary}>{name}</StatName>
      <Score $fontPaletteName={fontPaletteName}>{score}</Score>
      {modifier !== undefined && (
        <Modifier
          $fontPaletteName={fontPaletteName}
          $primary={character.palette.primary}
          aria-hidden="true"
        >
          {modifier >= 0 ? '+' : ''}
          {modifier}
        </Modifier>
      )}
    </Medallion>
  );
}
