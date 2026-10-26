import { useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { AltArtGallery } from '../image/imageGallary';
import type { AltArtItem } from '../image/imageGallary';
import { ImageCard } from '../image/ImageCard';
import { RandomMtgCard } from '../random-mtg-card/RandomMtgCard';
import { RuneMedallion } from '../stat/RuneMedallion';
import { RuneSkill } from '../stat/RuneSkill';
import { Button } from '../button/Button';
import { Tooltip } from '../tooltip/Tooltip';
import { FitText } from '../typography/FitText';
import { BlackHoleLink } from '../black-hole/BlackHoleLink';
import { CharacterProvider } from '../../context/CharacterProvider';
import type {
  BackgroundTheme,
  Character,
  CharacterSkill,
  CharacterStat,
} from '../../context/CharacterContext';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
type ButtonTheme = 'default' | 'nature' | 'cyberpunk';
type ButtonType = 'button' | 'submit' | 'reset';

const initialCharacter: Character = {
  id: 'debug-preview',
  name: 'Debug Adventurer',
  backgroundTheme: 'warm-parchment',
  palette: { primary: '#ffd700', secondary: '#02abd0' },
  stats: [{ name: 'Strength', score: 16, modifier: 3 }],
  skills: [{ name: 'Animal Handling', bonus: 4 }],
};

const initialArt: AltArtItem = {
  id: 'sample-art',
  setName: 'Sample Set',
  artist: 'Sample Artist',
  imageUrl: 'https://i.redd.it/rw82p1twm1p91.png',
  fullCardUrl: 'https://scryfall.com/',
};

const fieldStyle = {
  background: '#171512',
  border: '1px solid rgba(245, 231, 199, 0.3)',
  borderRadius: '6px',
  boxSizing: 'border-box' as const,
  color: '#f5e7c7',
  font: 'inherit',
  minWidth: 0,
  padding: '8px 10px',
  width: '100%',
};

function TextField({
  label,
  onChange,
  type = 'text',
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number' | 'url' | 'color';
  value: string | number;
}) {
  return (
    <label style={{ color: '#d8cbb1', display: 'grid', gap: '6px', minWidth: 0 }}>
      <span>{label}</span>
      <input
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        style={fieldStyle}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: readonly T[];
  value: T;
}) {
  return (
    <label style={{ color: '#d8cbb1', display: 'grid', gap: '6px', minWidth: 0 }}>
      <span>{label}</span>
      <select
        onChange={(event) => onChange(event.target.value as T)}
        style={fieldStyle}
        value={value}
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label style={{ color: '#d8cbb1', display: 'grid', gap: '6px' }}>
      <span>{label}</span>
      <textarea
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        style={{ ...fieldStyle, resize: 'vertical' }}
        value={value}
      />
    </label>
  );
}

function isCharacterStatList(value: unknown): value is CharacterStat[] {
  return Array.isArray(value) && value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      'name' in item &&
      typeof item.name === 'string' &&
      'score' in item &&
      typeof item.score === 'number' &&
      (!('modifier' in item) || typeof item.modifier === 'number'),
  );
}

function isCharacterSkillList(value: unknown): value is CharacterSkill[] {
  return Array.isArray(value) && value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      'name' in item &&
      typeof item.name === 'string' &&
      'bonus' in item &&
      typeof item.bonus === 'number',
  );
}

function PreviewSection({
  children,
  controls,
  title,
}: {
  children: ReactNode;
  controls: ReactNode;
  title: string;
}) {
  return (
    <section
      style={{
        background: 'rgba(24, 21, 17, 0.94)',
        border: '1px solid rgba(245, 231, 199, 0.18)',
        borderRadius: '12px',
        display: 'grid',
        gap: '20px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
        padding: '20px',
      }}
    >
      <div>
        <h2 style={{ color: '#f5e7c7', fontFamily: 'Georgia, "Times New Roman", serif', marginTop: 0 }}>
          {title}
        </h2>
        <div style={{ display: 'grid', gap: '12px' }}>{controls}</div>
      </div>
      <div
        style={{
          alignItems: 'center',
          border: '1px dashed rgba(245, 231, 199, 0.2)',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          minHeight: '150px',
          minWidth: 0,
          overflow: 'auto',
          padding: '16px',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </section>
  );
}

export function DebugPage() {
  const [buttonText, setButtonText] = useState('Preview button');
  const [buttonTheme, setButtonTheme] = useState<ButtonTheme>('cyberpunk');
  const [buttonIcon, setButtonIcon] = useState('✦');
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [buttonTitle, setButtonTitle] = useState('Button title');
  const [buttonType, setButtonType] = useState<ButtonType>('button');
  const [buttonName, setButtonName] = useState('preview-button');
  const [buttonValue, setButtonValue] = useState('preview-value');
  const [buttonAriaLabel, setButtonAriaLabel] = useState('');
  const [tooltipText, setTooltipText] = useState('Editable tooltip content');
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>('top');
  const [tooltipTrigger, setTooltipTrigger] = useState('Hover or focus me');
  const [imageTitle, setImageTitle] = useState('Image card');
  const [imageSubtitle, setImageSubtitle] = useState('Editable subtitle');
  const [imageUrl, setImageUrl] = useState(initialArt.imageUrl);
  const [imageOverlay, setImageOverlay] = useState('');
  const [fitText, setFitText] = useState('Fit this text in its preview area');
  const [fitClassName, setFitClassName] = useState('');
  const [minFontSize, setMinFontSize] = useState('6');
  const [statName, setStatName] = useState('Strength');
  const [statScore, setStatScore] = useState('16');
  const [statModifier, setStatModifier] = useState('3');
  const [showModifier, setShowModifier] = useState(true);
  const [skillName, setSkillName] = useState('Animal Handling');
  const [skillBonus, setSkillBonus] = useState('4');
  const [character, setCharacter] = useState(initialCharacter);
  const [characterStatsJson, setCharacterStatsJson] = useState(
    JSON.stringify(initialCharacter.stats, null, 2),
  );
  const [characterSkillsJson, setCharacterSkillsJson] = useState(
    JSON.stringify(initialCharacter.skills, null, 2),
  );
  const [characterDataError, setCharacterDataError] = useState<string | null>(null);
  const [artItem, setArtItem] = useState(initialArt);
  const [selectedArtId, setSelectedArtId] = useState(initialArt.id ?? '');
  const [portalLabel, setPortalLabel] = useState('Open the Debug page');
  const [portalHref, setPortalHref] = useState('/debug');
  const [portalTop, setPortalTop] = useState('50');
  const [portalLeft, setPortalLeft] = useState('50');
  const [portalAppearanceDelay, setPortalAppearanceDelay] = useState('1000');
  const [portalDelay, setPortalDelay] = useState('2000');
  const [selectedVariant, setSelectedVariant] = useState<AltArtItem | null>(null);

  const updateArt = (field: keyof AltArtItem, value: string) => {
    setArtItem((item) => ({ ...item, [field]: value }));
  };

  return (
    <main
      style={{
        color: '#f5e7c7',
        display: 'grid',
        gap: '24px',
        margin: '0 auto 56px',
        maxWidth: '1200px',
        padding: '0 24px',
      }}
    >
      <header style={{ textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>Component Debugger</h1>
        <p>Edit each component&apos;s props and see the preview update live.</p>
      </header>

      <PreviewSection
        title="Button"
        controls={
          <>
            <TextField label="children (button text)" onChange={setButtonText} value={buttonText} />
            <SelectField<ButtonTheme>
              label="customTheme"
              onChange={setButtonTheme}
              options={['default', 'nature', 'cyberpunk']}
              value={buttonTheme}
            />
            <TextField label="icon" onChange={setButtonIcon} value={buttonIcon} />
            <TextField label="title" onChange={setButtonTitle} value={buttonTitle} />
            <SelectField<ButtonType>
              label="type"
              onChange={setButtonType}
              options={['button', 'submit', 'reset']}
              value={buttonType}
            />
            <TextField label="name" onChange={setButtonName} value={buttonName} />
            <TextField label="value" onChange={setButtonValue} value={buttonValue} />
            <TextField label="aria-label" onChange={setButtonAriaLabel} value={buttonAriaLabel} />
            <label style={{ alignItems: 'center', color: '#d8cbb1', display: 'flex', gap: '8px' }}>
              <input checked={buttonDisabled} onChange={(event) => setButtonDisabled(event.target.checked)} type="checkbox" />
              disabled
            </label>
          </>
        }
      >
        <Button
          customTheme={buttonTheme === 'default' ? undefined : buttonTheme}
          disabled={buttonDisabled}
          icon={buttonIcon || undefined}
          name={buttonName || undefined}
          title={buttonTitle || undefined}
          type={buttonType}
          value={buttonValue}
          aria-label={buttonAriaLabel || undefined}
        >
          {buttonText}
        </Button>
      </PreviewSection>

      <PreviewSection
        title="Tooltip"
        controls={
          <>
            <TextField label="content" onChange={setTooltipText} value={tooltipText} />
            <SelectField<TooltipPosition>
              label="position"
              onChange={setTooltipPosition}
              options={['top', 'bottom', 'left', 'right']}
              value={tooltipPosition}
            />
            <TextField label="children (trigger text)" onChange={setTooltipTrigger} value={tooltipTrigger} />
          </>
        }
      >
        <Tooltip content={tooltipText} position={tooltipPosition}>
          <Button>{tooltipTrigger}</Button>
        </Tooltip>
      </PreviewSection>

      <PreviewSection
        title="ImageCard"
        controls={
          <>
            <TextField label="title" onChange={setImageTitle} value={imageTitle} />
            <TextField label="subtitle" onChange={setImageSubtitle} value={imageSubtitle} />
            <TextField label="imageUrl" onChange={setImageUrl} type="url" value={imageUrl} />
            <TextField label="children (overlay text)" onChange={setImageOverlay} value={imageOverlay} />
          </>
        }
      >
        <ImageCard
          imageUrl={imageUrl}
          subtitle={imageSubtitle || undefined}
          title={imageTitle || undefined}
        >
          {imageOverlay}
        </ImageCard>
      </PreviewSection>

      <PreviewSection
        title="FitText"
        controls={
          <>
            <TextField label="children" onChange={setFitText} value={fitText} />
            <TextField label="className" onChange={setFitClassName} value={fitClassName} />
            <TextField label="minFontSize" onChange={setMinFontSize} type="number" value={minFontSize} />
          </>
        }
      >
        <div style={{ color: '#f5e7c7', width: '100%' }}>
          <FitText className={fitClassName || undefined} minFontSize={Math.max(1, Number(minFontSize) || 6)}>
            {fitText}
          </FitText>
        </div>
      </PreviewSection>

      <PreviewSection
        title="RuneMedallion"
        controls={
          <>
            <TextField label="name" onChange={setStatName} value={statName} />
            <TextField label="score" onChange={setStatScore} type="number" value={statScore} />
            <TextField label="modifier" onChange={setStatModifier} type="number" value={statModifier} />
            <label style={{ alignItems: 'center', color: '#d8cbb1', display: 'flex', gap: '8px' }}>
              <input checked={showModifier} onChange={(event) => setShowModifier(event.target.checked)} type="checkbox" />
              Show modifier
            </label>
          </>
        }
      >
        <RuneMedallion
          modifier={showModifier ? Number(statModifier) || 0 : undefined}
          name={statName}
          score={Number(statScore) || 0}
        />
      </PreviewSection>

      <PreviewSection
        title="RuneSkill"
        controls={
          <>
            <TextField label="name" onChange={setSkillName} value={skillName} />
            <TextField label="bonus" onChange={setSkillBonus} type="number" value={skillBonus} />
          </>
        }
      >
        <RuneSkill bonus={Number(skillBonus) || 0} name={skillName} />
      </PreviewSection>

      <PreviewSection
        title="CharacterProvider"
        controls={
          <>
            <TextField
              label="character.id"
              onChange={(id) => setCharacter((current) => ({ ...current, id }))}
              value={character.id}
            />
            <TextField
              label="character.name"
              onChange={(name) => setCharacter((current) => ({ ...current, name }))}
              value={character.name}
            />
            <TextField
              label="character.imageUrl"
              onChange={(imageUrl) => setCharacter((current) => ({
                ...current,
                imageUrl: imageUrl || undefined,
              }))}
              type="url"
              value={character.imageUrl ?? ''}
            />
            <SelectField<BackgroundTheme>
              label="character.backgroundTheme"
              onChange={(backgroundTheme) => setCharacter((current) => ({ ...current, backgroundTheme }))}
              options={['deep-space', 'arcane-forest', 'warm-parchment', 'rune-twilight']}
              value={character.backgroundTheme}
            />
            <TextField
              label="character.palette.primary"
              onChange={(primary) => setCharacter((current) => ({
                ...current,
                palette: { ...current.palette, primary },
              }))}
              type="color"
              value={character.palette.primary}
            />
            <TextField
              label="character.palette.secondary"
              onChange={(secondary) => setCharacter((current) => ({
                ...current,
                palette: { ...current.palette, secondary },
              }))}
              type="color"
              value={character.palette.secondary}
            />
            <TextAreaField
              label="character.stats (JSON)"
              onChange={(value) => {
                setCharacterStatsJson(value);
                try {
                  const parsed: unknown = JSON.parse(value);
                  if (!isCharacterStatList(parsed)) {
                    throw new TypeError('Expected an array of stats with name and numeric score fields.');
                  }
                  setCharacter((current) => ({ ...current, stats: parsed }));
                  setCharacterDataError(null);
                } catch (error) {
                  setCharacterDataError(
                    error instanceof Error ? error.message : 'Invalid character stats JSON.',
                  );
                }
              }}
              value={characterStatsJson}
            />
            <TextAreaField
              label="character.skills (JSON)"
              onChange={(value) => {
                setCharacterSkillsJson(value);
                try {
                  const parsed: unknown = JSON.parse(value);
                  if (!isCharacterSkillList(parsed)) {
                    throw new TypeError('Expected an array of skills with name and numeric bonus fields.');
                  }
                  setCharacter((current) => ({ ...current, skills: parsed }));
                  setCharacterDataError(null);
                } catch (error) {
                  setCharacterDataError(
                    error instanceof Error ? error.message : 'Invalid character skills JSON.',
                  );
                }
              }}
              value={characterSkillsJson}
            />
            {characterDataError && (
              <p role="alert" style={{ color: '#ff9b9b', margin: 0 }}>{characterDataError}</p>
            )}
          </>
        }
      >
        <CharacterProvider character={character}>
          <div style={{ display: 'grid', gap: '20px', justifyItems: 'center', padding: '16px' }}>
            <div style={{
              background: {
                'deep-space': 'linear-gradient(135deg, #0b1020, #090b14)',
                'arcane-forest': 'linear-gradient(135deg, #10231d, #0a1613)',
                'warm-parchment': 'linear-gradient(135deg, #241b14, #15110f)',
                'rune-twilight': 'linear-gradient(135deg, #1d1028, #100c1b)',
              }[character.backgroundTheme],
              border: '1px solid rgba(245, 231, 199, 0.3)',
              borderRadius: '8px',
              color: '#f5e7c7',
              padding: '16px',
              textAlign: 'center',
              width: '100%',
            }}>
              {character.backgroundTheme}: {character.name}
            </div>
            {character.imageUrl && (
              <img alt={`${character.name} preview`} src={character.imageUrl} style={{ maxHeight: '140px', maxWidth: '100%', objectFit: 'cover' }} />
            )}
            {character.stats.map((stat, index) => (
              <RuneMedallion key={`${stat.name}-${index}`} {...stat} />
            ))}
            {character.skills.map((skill, index) => (
              <RuneSkill key={`${skill.name}-${index}`} {...skill} />
            ))}
          </div>
        </CharacterProvider>
      </PreviewSection>

      <PreviewSection
        title="AltArtGallery"
        controls={
          <>
            <TextField label="artVariants[0].id" onChange={(value) => updateArt('id', value)} value={artItem.id ?? ''} />
            <TextField label="artVariants[0].setName" onChange={(value) => updateArt('setName', value)} value={artItem.setName ?? ''} />
            <TextField label="artVariants[0].artist" onChange={(value) => updateArt('artist', value)} value={artItem.artist ?? ''} />
            <TextField label="artVariants[0].imageUrl" onChange={(value) => updateArt('imageUrl', value)} type="url" value={artItem.imageUrl} />
            <TextField label="artVariants[0].fullCardUrl" onChange={(value) => updateArt('fullCardUrl', value)} type="url" value={artItem.fullCardUrl ?? ''} />
            <TextField label="selectedId" onChange={setSelectedArtId} value={selectedArtId} />
          </>
        }
      >
        <AltArtGallery
          artVariants={[artItem]}
          onSelectVariant={(variant) => {
            setSelectedArtId(variant.id ?? '');
            setSelectedVariant(variant);
          }}
          selectedId={selectedArtId}
        />
        {selectedVariant && (
          <div style={{ color: '#d8cbb1', fontSize: '0.85rem', marginLeft: '12px' }}>
            Selected: {selectedVariant.setName || selectedVariant.id}
            {selectedVariant.fullCardUrl && (
              <> · <a href={selectedVariant.fullCardUrl} rel="noreferrer" target="_blank">Full card</a></>
            )}
          </div>
        )}
      </PreviewSection>

      <PreviewSection
        title="RandomMtgCard"
        controls={<p style={{ color: '#d8cbb1', margin: 0 }}>This component has no props. Use its button to draw another random card.</p>}
      >
        <RandomMtgCard />
      </PreviewSection>

      <PreviewSection
        title="BlackHoleLink"
        controls={
          <>
            <TextField label="href" onChange={setPortalHref} value={portalHref} />
            <TextField label="label" onChange={setPortalLabel} value={portalLabel} />
            <TextField label="position.top (%)" onChange={setPortalTop} type="number" value={portalTop} />
            <TextField label="position.left (%)" onChange={setPortalLeft} type="number" value={portalLeft} />
            <TextField label="appearanceDelay (ms)" onChange={setPortalAppearanceDelay} type="number" value={portalAppearanceDelay} />
            <TextField label="delay (ms)" onChange={setPortalDelay} type="number" value={portalDelay} />
          </>
        }
      >
        <div
          style={{
            border: '1px solid rgba(245, 231, 199, 0.25)',
            borderRadius: '8px',
            height: '180px',
            maxWidth: '100%',
            position: 'relative',
            width: '100%',
          }}
        >
          <BlackHoleLink
            appearanceDelay={Math.max(0, Number(portalAppearanceDelay) || 0)}
            delay={Math.max(0, Number(portalDelay) || 0)}
            href={portalHref}
            label={portalLabel}
            position={{
              top: `${Math.min(100, Math.max(0, Number(portalTop) || 0))}%`,
              left: `${Math.min(100, Math.max(0, Number(portalLeft) || 0))}%`,
            }}
          />
        </div>
      </PreviewSection>
    </main>
  );
}
