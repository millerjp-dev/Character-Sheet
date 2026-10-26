import { useContext } from 'react';
import { CharacterContext } from './CharacterContext';

export function useCharacter() {
  return useContext(CharacterContext);
}
