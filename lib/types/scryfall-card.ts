/**
 * Source: https://scryfall.com/docs/api/cards
 */

export interface ScryfallCard {
  id: string;
  name: string;
  oracle_text: string;
  type_line: string;
  image_uris: {
    small: string;
    normal: string;
    large: string;
    png: string;
    art_crop: string;
    border_crop: string;
  };
}

export interface ScryfallCardApiResponse {
  object: "list";
  total_cards: number;
  has_more: boolean;
  next_page?: string;
  data: ScryfallCard[];
}
