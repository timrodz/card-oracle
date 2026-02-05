"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScryfallCard } from "@/lib/types/scryfall-card";
import { ScryfallApiSearchCards } from "@/server/scryfall-card-search";
import { useConversation } from "@elevenlabs/react";
import Image from "next/image";
import { useState } from "react";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

import data from "../public/responses/scryfall-card-search.json";
const jsonData = data.data;

export function ScryfallCardSearchFeature() {
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("disconnected");
  const [agentStatus, setAgentStatus] = useState<
    "listening" | "speaking" | "idle"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const [cards, setCards] = useState<ScryfallCard[]>(jsonData);

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
      return `You searched for ${query} but found no results`;
    }

    setCards(response.data);
    return `I found ${resultCount} results. Please click on them to learn more! Talk soon.`;
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
      throw new Error("No agent ID configured");
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

        <div className="grid grid-cols-3 gap-4">
          {cards.map((card) => (
            <Card key={card.id}>
              <CardHeader>
                <CardTitle>{card.name}</CardTitle>
                <CardDescription>{card.type_line}</CardDescription>
              </CardHeader>
              <CardContent>
                <Image
                  className="rounded-md"
                  src={card.image_uris.normal}
                  alt={card.name}
                  width={488}
                  height={680}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
