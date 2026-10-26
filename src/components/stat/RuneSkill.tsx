import styled from '@emotion/styled';
import { FitText } from '../typography/FitText';
import { useCharacter } from '../../context/useCharacter';

export interface RuneSkillProps {
  name: string;
  bonus: number;
}

const SkillRow = styled.div<{ $secondary: string }>`
  display: flex;
  width: 320px;
  max-width: 100%;
  min-height: 60px;
  align-items: center;
  gap: 14px;
  padding: 7px 18px 7px 7px;
  border: 1px solid ${({ $secondary }) => `${$secondary}bf`};
  border-radius: 999px;
  background: linear-gradient(110deg, #30271d, #1b1918 72%);
  box-shadow:
    inset 0 0 0 4px rgba(40, 34, 27, 0.9),
    0 4px 12px rgba(0, 0, 0, 0.3);
  color: #f5e7c7;
`;

const BonusBubble = styled.span<{ $primary: string; $secondary: string; $fontPaletteName: string }>`
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  border: 1px solid ${({ $secondary }) => $secondary};
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #59462e, #28221b 75%);
  box-shadow:
    inset 0 0 0 3px #28221b,
    inset 0 0 0 4px ${({ $secondary }) => `${$secondary}73`};
  color: #fff1cf;
  font-family: 'Nabla Variable', Georgia, 'Times New Roman', serif;
  font-palette: ${({ $fontPaletteName }) => $fontPaletteName};
  font-size: 1.1rem;
  font-weight: 700;
`;

const SkillName = styled(FitText)<{ $primary: string }>`
  min-width: 0;
  flex: 1;
  color: ${({ $primary }) => $primary};
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
`;

export function RuneSkill({ name, bonus }: RuneSkillProps) {
  const { character, fontPaletteName } = useCharacter();
  const formattedBonus = `${bonus >= 0 ? '+' : ''}${bonus}`;

  return (
    <SkillRow
      $secondary={character.palette.secondary}
      aria-label={`${name}: ${formattedBonus}`}
      role="img"
    >
      <BonusBubble
        $fontPaletteName={fontPaletteName}
        $primary={character.palette.primary}
        $secondary={character.palette.secondary}
        aria-hidden="true"
      >
        {formattedBonus}
      </BonusBubble>
      <SkillName $primary={character.palette.primary}>{name}</SkillName>
    </SkillRow>
  );
}
