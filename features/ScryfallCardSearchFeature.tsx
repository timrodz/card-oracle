"use client";

import { ScryfallCardOverview } from "@/components/scryfall-card/ScryfallCardOverview";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  ScryfallCardFiltererParams,
  ScryfallCardSearchParams,
} from "@/lib/types/elevenlabs";
import { ScryfallCard, ScryfallCardColor } from "@/lib/types/scryfall";
import {
  ScryfallApiSearchCards,
  ScryfallApiSearchCardsNextPage,
} from "@/server/scryfall-card-search";
import { useConversation } from "@elevenlabs/react";
import { useMemo, useState } from "react";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

import initialData from "../public/responses/scryfall/results.json";
import { mapColorIdentity } from "@/lib/elevenlabs";
const initialCards = initialData.data as ScryfallCard[];

export function ScryfallCardSearchFeature() {
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("disconnected");
  const [agentStatus, setAgentStatus] = useState<
    "listening" | "speaking" | "idle"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const [allCards, setAllCards] = useState<ScryfallCard[]>(initialCards);
  const [hasMoreCards, setHasMoreCards] = useState(initialData.has_more);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(
    initialData.next_page ?? null,
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filters
  const [selectedCmc, setSelectedCmc] = useState<number | null>(null);
  const [selectedColors, setSelectedColors] = useState<ScryfallCardColor[]>([]);
  const [selectedSetName, setSelectedSetName] = useState<string | null>(null);

  const cmcOptions = useMemo(() => {
    const unique = new Set<number>();
    allCards.forEach((card) => unique.add(card.cmc));
    return Array.from(unique).sort((a, b) => a - b);
  }, [allCards]);

  const colorOptions = useMemo(() => {
    const unique = new Set<string>();
    allCards.forEach((card) => {
      if (!card.color_identity.length) {
        unique.add("Colorless");
        return;
      }
      card.color_identity.forEach((color) => unique.add(color));
    });
    return Array.from(unique).sort();
  }, [allCards]);

  const setNameOptions = useMemo(() => {
    const unique = new Set<string>();
    allCards.forEach((card) => unique.add(card.set_name));
    return Array.from(unique).sort();
  }, [allCards]);

  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      if (selectedCmc && card.cmc !== Number(selectedCmc)) {
        return false;
      }
      if (selectedColors.length > 0) {
        if (selectedColors.includes("Colorless")) {
          return (
            selectedColors.length === 1 && card.color_identity.length === 0
          );
        }
        const matchesAllColors = selectedColors.every((color) =>
          card.color_identity.includes(color),
        );
        if (!matchesAllColors) {
          return false;
        }
      }
      if (selectedSetName && card.set_name !== selectedSetName) {
        return false;
      }
      return true;
    });
  }, [allCards, selectedCmc, selectedColors, selectedSetName]);

  const scryfallCardSearch = async (
    params: ScryfallCardSearchParams,
  ): Promise<string> => {
    const { query } = params;
    console.debug("scryfall card search", query);
    const response = await ScryfallApiSearchCards(query);
    console.log("scryfall card search response", {
      response: response,
    });
    const resultCount = response?.data.length ?? 0;
    if (!response || !resultCount) {
      console.warn("scryfall card search - No results");
      setAllCards([]);
      setHasMoreCards(false);
      setNextPageUrl(null);
      setSelectedCmc(null);
      setSelectedColors([]);
      setSelectedSetName(null);
      return `You searched for ${query} but found no results`;
    }

    setAllCards(response.data);
    setHasMoreCards(Boolean(response.has_more));
    setNextPageUrl(response.next_page ?? null);
    setSelectedCmc(null);
    setSelectedColors([]);
    setSelectedSetName(null);
    return `I found ${resultCount} results. Please click on them to learn more! Talk soon.`;
  };

  const scryfallCardFilterer = async (params: ScryfallCardFiltererParams) => {
    const {
      filters: { mana_cost, color_identity, set_name },
    } = params;
    console.debug("card filter", { mana_cost, color_identity, set_name });
    // For every field provided, modify the filters with the information.
    if (mana_cost) {
      setSelectedCmc(mana_cost);
    }
    if (color_identity) {
      setSelectedColors(mapColorIdentity(color_identity));
    }
    if (set_name) {
      setSelectedSetName(set_name);
    }
    // TODO: Fill out response
    return `My response has indicated ${allCards.length}`;
  };

  const loadMoreCards = async () => {
    if (!nextPageUrl || isLoadingMore) return;
    setIsLoadingMore(true);
    const response = await ScryfallApiSearchCardsNextPage(nextPageUrl);
    if (!response) {
      setIsLoadingMore(false);
      return;
    }

    setAllCards((prev) => [...prev, ...response.data]);
    setHasMoreCards(Boolean(response.has_more));
    setNextPageUrl(response.next_page ?? null);
    setIsLoadingMore(false);
  };

  const conversation = useConversation({
    agentId: AGENT_ID,
    onConnect: () => {
      setConnectionStatus("connected");
      setAgentStatus("listening");
      setError(null);
    },
    onDisconnect: () => {
      setConnectionStatus("disconnected");
      setAgentStatus("idle");
    },
    onError: (err) => {
      console.error(err);
      setError(typeof err === "string" ? err : "An error occurred");
      setConnectionStatus("disconnected");
      setAgentStatus("idle");
    },
    onMessage: (message) => {
      console.log("Agent Message:", message);
    },
    onDebug: (data) => {
      console.log("Agent Debug:", data);
    },
    onStatusChange: (status) => {
      console.log("Connection Status Change:", status);
      if (status.status === "connecting") {
        setConnectionStatus("connecting");
      }
    },
    onModeChange: (mode) => {
      console.log("Mode Change:", mode);
      setAgentStatus(mode.mode === "speaking" ? "speaking" : "listening");
    },
    clientTools: {
      scryfallCardSearch,
      scryfallCardFilterer,
    },
  });

  const startConversation = async () => {
    if (!AGENT_ID) {
      throw new Error(
        "No ElevenLabs agent configured - Please configure this in ElevenLabs.",
      );
    }
    try {
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "websocket",
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  const endConversation = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error("Failed to end conversation:", error);
    }
  };

  return (
    <div className="px-4 py-10 w-full h-full flex flex-col items-center">
      <header className="mx-auto">
        <h1>MTG Oracle</h1>
        <h2>
          Real-time voice translating tool to help you find MTG cards using
          Scryfall
        </h2>
      </header>
      {/* Main Content */}
      <main className="z-10 flex-1 w-full max-w-6xl mx-auto flex flex-col items-center justify-center min-h-0 relative gap-8">
        {/* Voice Control */}
        <div>
          <Button
            onClick={startConversation}
            disabled={
              connectionStatus === "connecting" ||
              connectionStatus === "connected"
            }
          >
            <p>Start Conversation</p>
          </Button>
          <Button
            onClick={endConversation}
            disabled={connectionStatus === "disconnected"}
          >
            <p>End Conversation</p>
          </Button>
          <p>
            {connectionStatus === "connected"
              ? agentStatus === "speaking"
                ? "Speaking..."
                : "Listening..."
              : "Tap to Speak"}
          </p>

          {error && (
            <div className="absolute -bottom-16 px-4 py-2 bg-red-50 text-red-500 rounded-lg text-xs whitespace-nowrap">
              {error}
            </div>
          )}
        </div>

        {allCards.length > 0 && (
          <div className="flex w-full flex-wrap items-center justify-center gap-4">
            <Combobox
              items={cmcOptions}
              value={selectedCmc}
              onValueChange={(value) => setSelectedCmc(value)}
            >
              <ComboboxInput
                placeholder="Filter by CMC"
                showClear
                aria-label="Filter by CMC"
              />
              <ComboboxContent>
                <ComboboxEmpty>No CMC values found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <div className="flex items-center gap-2">
              <Combobox
                multiple
                items={colorOptions}
                value={selectedColors}
                onValueChange={(value) => setSelectedColors(value ?? [])}
              >
                <ComboboxChips>
                  {selectedColors.map((color) => (
                    <ComboboxChip key={color}>{color}</ComboboxChip>
                  ))}
                  <ComboboxChipsInput
                    placeholder="Filter by Color"
                    aria-label="Filter by color"
                  />
                </ComboboxChips>
                <ComboboxContent>
                  <ComboboxEmpty>No color values found.</ComboboxEmpty>
                  <ComboboxList>
                    {(color) => (
                      <ComboboxItem key={color} value={color}>
                        {color}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
            <Combobox
              items={setNameOptions}
              value={selectedSetName}
              onValueChange={(value) => setSelectedSetName(value)}
            >
              <ComboboxInput
                placeholder="Filter by Set"
                showClear
                aria-label="Filter by set name"
              />
              <ComboboxContent>
                <ComboboxEmpty>No set values found.</ComboboxEmpty>
                <ComboboxList>
                  {(setName) => (
                    <ComboboxItem key={setName} value={setName}>
                      {setName}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredCards.map((card) => (
            <ScryfallCardOverview key={card.id} card={card} />
          ))}
        </div>
        {hasMoreCards && (
          <Button onClick={loadMoreCards} disabled={isLoadingMore}>
            {isLoadingMore ? "Loading..." : "Load More"}
          </Button>
        )}
      </main>
    </div>
  );
}
