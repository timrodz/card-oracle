"use client";

import { Button } from "@/components/ui/button";
import { ScryfallApiSearchCards } from "@/server/scryfall-card-search";
import { useConversation } from "@elevenlabs/react";
import { useState, useCallback, useEffect, useRef } from "react";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

export function VoiceAssistantFeature() {
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("disconnected");
  const [agentStatus, setAgentStatus] = useState<
    "listening" | "speaking" | "idle"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const scryfallCardSearch = async (parameters: {
    query: string;
  }): Promise<string> => {
    console.debug("scryfall card search", parameters);
    return await ScryfallApiSearchCards(parameters.query);
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
    <div className="w-full h-full">
      <header>
        <h1>MTG Oracle</h1>
        <h2>
          Real-time voice translating tool to help you find MTG cards using
          Scryfall
        </h2>
      </header>
      {/* Main Content */}
      <main className="z-10 flex-1 w-full max-w-6xl flex flex-col items-center justify-center min-h-0 relative">
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
      </main>
    </div>
  );
}
