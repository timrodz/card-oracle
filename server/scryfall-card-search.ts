"use server";

import { ScryfallCardApiResponse } from "@/lib/types/scryfall-card";

// Docs: https://scryfall.com/docs/api/cards/search
const API_ENDPOINT = "https://api.scryfall.com/cards/search";

async function fetchScryfallPage(
  url: string,
): Promise<ScryfallCardApiResponse> {
  const response = await fetch(url);
  console.debug("ScryfallApiSearchCards", response.status);
  if (!response.ok) {
    throw new Error(`Scryfall API error: ${response.status}`);
  }
  return (await response.json()) as ScryfallCardApiResponse;
}

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
    const firstPage = await fetchScryfallPage(
      `${API_ENDPOINT}?${queryParameters}`,
    );
    const allCards = [...firstPage.data];
    let nextPage =
      firstPage.has_more && firstPage.next_page
        ? firstPage.next_page
        : undefined;

    while (nextPage) {
      const page = await fetchScryfallPage(nextPage);
      allCards.push(...page.data);
      nextPage = page.has_more && page.next_page ? page.next_page : undefined;
    }

    // TODO: Parse with Zod
    return {
      ...firstPage,
      has_more: false,
      next_page: undefined,
      data: allCards,
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}
