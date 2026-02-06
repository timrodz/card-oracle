import { CardFilters } from "./types/filters";
import { ScryfallCard } from "./types/scryfall";

export function filterCards(
  allCards: ScryfallCard[],
  filters: CardFilters,
): ScryfallCard[] {
  const { cmc, colors, setName } = filters;
  return allCards.filter((card) => {
    if (cmc && card.cmc !== Number(cmc)) {
      return false;
    }
    if (colors && colors.length > 0) {
      if (colors.includes("Colorless")) {
        return colors.length === 1 && card.color_identity.length === 0;
      }
      const matchesAllColors = colors.every((color) =>
        card.color_identity.includes(color),
      );
      if (!matchesAllColors) {
        return false;
      }
    }
    if (setName && card.set_name !== setName) {
      return false;
    }
    return true;
  });
}
