import { Subject } from 'rxjs';
export interface ScryfallCardData {
  name: string;
  type_line: string;
  image_uris?: {
    normal: string;
    art_crop?: string;
  };
}

export const fetchRandomCard = (): Subject<ScryfallCardData> => {
  const cardSubject = new Subject<ScryfallCardData>();
  void (async () => {
    try {
      const response = await fetch('https://api.scryfall.com/cards/random');
      const data = await response.json();
      cardSubject.next(data);
      cardSubject.complete();
    } catch (error) {
      cardSubject.error(error);
    }
  })();

  return cardSubject;
};