"use client";

import { ScryfallCardOverview } from "@/components/scryfall-card/ScryfallCardOverview";
import { Button } from "@/components/ui/button";
import { mapColorIdentity } from "@/lib/elevenlabs";
import {
  ElevenlabsToolScryfallCardFiltererParams,
  ElevenlabsToolScryfallCardSearchParams,
} from "@/lib/types/elevenlabs";
import {
  ScryfallCard,
  ScryfallCardApiResponse,
  ScryfallCardColor,
} from "@/lib/types/scryfall";
import {
  ScryfallApiSearchCards,
  ScryfallApiSearchCardsNextPage,
} from "@/server/scryfall-card-search";
import { useConversation } from "@elevenlabs/react";
import { useMemo, useState } from "react";
import { Filters } from "./components/filters";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

import initialDataJson from "../../public/responses/scryfall/results.json";
const initialData = initialDataJson as ScryfallCardApiResponse;

export function ScryfallCardSearchFeature() {
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("disconnected");
  const [agentStatus, setAgentStatus] = useState<
    "listening" | "speaking" | "idle"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const [allCards, setAllCards] = useState<ScryfallCard[]>(initialData.data);
  const [hasMoreCards, setHasMoreCards] = useState<boolean>(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filters
  const [selectedCmc, setSelectedCmc] = useState<number | null>(null);
  const [selectedColors, setSelectedColors] = useState<ScryfallCardColor[]>([]);
  const [selectedSetName, setSelectedSetName] = useState<string | null>(null);

  const cmcOptions = useMemo(() => {
    const unique = new Set<number>(allCards.map((c) => c.cmc));
    return Array.from(unique).sort((a, b) => a - b);
  }, [allCards]);

  const colorOptions = useMemo(() => {
    const unique = new Set<ScryfallCardColor>();
    allCards
      .map((c) => c.color_identity)
      .forEach((card) => {
        if (!card.length) {
          unique.add(null);
          return;
        }
        card.forEach((color) => unique.add(color));
      });
    return Array.from(unique).sort();
  }, [allCards]);

  const setNameOptions = useMemo(() => {
    const unique = new Set<string>(allCards.map((c) => c.set_name));
    return Array.from(unique).sort();
  }, [allCards]);

  const filteredCards = useMemo(
    () =>
      allCards.filter((card) => {
        if (selectedCmc && card.cmc !== Number(selectedCmc)) {
          return false;
        }
        if (selectedColors.length > 0) {
          if (selectedColors.includes(null)) {
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
      }),
    [allCards, selectedCmc, selectedColors, selectedSetName],
  );

  const clearFilters = () => {
    setSelectedCmc(null);
    setSelectedColors([]);
    setSelectedSetName(null);
  };

  const scryfallCardSearch = async (
    params: ElevenlabsToolScryfallCardSearchParams,
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
      clearFilters();
      return `You searched for ${query} but found no results`;
    }

    setAllCards(response.data);
    setHasMoreCards(Boolean(response.has_more));
    setNextPageUrl(response.next_page ?? null);
    clearFilters();
    return `I found ${resultCount} results. Please click on them to learn more! Talk soon.`;
  };

  const scryfallCardFilterer = async (
    params: ElevenlabsToolScryfallCardFiltererParams,
  ) => {
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

        <Filters
          cmcOptions={cmcOptions}
          selectedCmc={selectedCmc}
          onCmcChange={setSelectedCmc}
          colorOptions={colorOptions}
          selectedColors={selectedColors}
          onColorsChange={setSelectedColors}
          setNameOptions={setNameOptions}
          selectedSetName={selectedSetName}
          onSetNameChange={setSelectedSetName}
        />

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
