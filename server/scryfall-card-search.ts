"use server";

import { ScryfallCardApiResponse } from "@/lib/types/scryfall-card";

// Docs: https://scryfall.com/docs/api/cards/search
const API_ENDPOINT = "https://api.scryfall.com/cards/search";

/**
 *
 * @param query Card to search for
 * @returns
 */
export async function ScryfallApiSearchCards(
  query: string,
): Promise<ScryfallCardApiResponse | null> {
  // Produces "q=<query>"
  const queryParameters = new URLSearchParams({
    order: "cmc",
    q: query,
  }).toString();
  try {
    const response = await fetch(`${API_ENDPOINT}?${queryParameters}`);
    const responseJson = await response.json();
    console.debug("ScryfallApiSearchCards", response.status);
    // TODO: Parse with Zod
    return responseJson as ScryfallCardApiResponse;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// TODO: Implement search for next_page attribute found in the search response
// Example next_page: "https://api.scryfall.com/cards/search?format=json&include_extras=false&include_multilingual=false&include_variations=false&order=cmc&page=2&q=c%3Ared+pow%3D3&unique=cards"
