import { ScryfallCardColor } from "./types/scryfall";

export function mapColorIdentity(colors: string[]): ScryfallCardColor[] {
  const mapped: ScryfallCardColor[] = [];
  colors.forEach((color) => {
    switch (color) {
      case "white":
        mapped.push("W");
        break;
      case "blue":
        mapped.push("U");
        break;
      case "black":
        mapped.push("B");
        break;
      case "red":
        mapped.push("R");
        break;
      case "green":
        mapped.push("G");
        break;
      case "colorless":
        mapped.push("Colorless");
        break;
      default:
        break;
    }
  });
  return mapped;
}
