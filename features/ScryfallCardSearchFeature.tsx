"use client";

import { ScryfallCardOverview } from "@/components/scryfall-card/ScryfallCardOverview";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { ScryfallCard } from "@/lib/types/scryfall-card";
import {
  ScryfallApiSearchCards,
  ScryfallApiSearchCardsNextPage,
} from "@/server/scryfall-card-search";
import { useConversation } from "@elevenlabs/react";
import { useMemo, useState } from "react";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

import initialData from "../public/responses/scryfall-card-search-paginated-response.json";
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
  const [selectedCmc, setSelectedCmc] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSetName, setSelectedSetName] = useState("");

  const cmcOptions = useMemo(() => {
    const unique = new Set<number>();
    allCards.forEach((card) => unique.add(card.cmc));
    return Array.from(unique).sort((a, b) => a - b);
  }, [allCards]);

  const colorOptions = useMemo(() => {
    const unique = new Set<string>();
    allCards.forEach((card) => {
      if (!card.colors.length) {
        unique.add("Colorless");
        return;
      }
      card.colors.forEach((color) => unique.add(color));
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
      if (selectedColor) {
        if (selectedColor === "Colorless") {
          if (card.colors.length !== 0) {
            return false;
          }
        } else if (!card.colors.includes(selectedColor)) {
          return false;
        }
      }
      if (selectedSetName && card.set_name !== selectedSetName) {
        return false;
      }
      return true;
    });
  }, [allCards, selectedCmc, selectedColor, selectedSetName]);

  const scryfallCardSearch = async ({
    query,
  }: {
    query: string;
  }): Promise<string> => {
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
      setSelectedCmc("");
      setSelectedColor("");
      setSelectedSetName("");
      return `You searched for ${query} but found no results`;
    }

    setAllCards(response.data);
    setHasMoreCards(Boolean(response.has_more));
    setNextPageUrl(response.next_page ?? null);
    setSelectedCmc("");
    setSelectedColor("");
    setSelectedSetName("");
    return `I found ${resultCount} results. Please click on them to learn more! Talk soon.`;
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
    <div className="w-full h-full flex flex-col items-center">
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
              value={selectedCmc}
              onValueChange={(value) => setSelectedCmc(value ?? "")}
            >
              <ComboboxInput
                placeholder="Filter by CMC"
                showClear
                aria-label="Filter by CMC"
              />
              <ComboboxContent>
                <ComboboxList>
                  <ComboboxEmpty>No CMC values found.</ComboboxEmpty>
                  {cmcOptions.map((cmc) => (
                    <ComboboxItem key={cmc} value={String(cmc)}>
                      {cmc}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <Combobox
              value={selectedColor}
              onValueChange={(value) => setSelectedColor(value ?? "")}
            >
              <ComboboxInput
                placeholder="Filter by Color"
                showClear
                aria-label="Filter by color"
              />
              <ComboboxContent>
                <ComboboxList>
                  <ComboboxEmpty>No color values found.</ComboboxEmpty>
                  {colorOptions.map((color) => (
                    <ComboboxItem key={color} value={color}>
                      {color}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <Combobox
              value={selectedSetName}
              onValueChange={(value) => setSelectedSetName(value ?? "")}
            >
              <ComboboxInput
                placeholder="Filter by Set"
                showClear
                aria-label="Filter by set name"
              />
              <ComboboxContent>
                <ComboboxList>
                  <ComboboxEmpty>No set values found.</ComboboxEmpty>
                  {setNameOptions.map((setName) => (
                    <ComboboxItem key={setName} value={setName}>
                      {setName}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
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
