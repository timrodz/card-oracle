"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon, SparklesIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/page-container";
import { ScryfallCardOverview } from "@/features/scryfall-card-search/components/scryfall-card";
import { ScryfallCard } from "@/lib/types/scryfall";
import { cleanCardId } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  cards?: ScryfallCard[];
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.trim() || "http://localhost:8000";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: isStreaming ? "auto" : "smooth",
      block: "end",
    });
  }, [isStreaming, messages]);

  const appendToAssistant = (text: string) => {
    if (!text) {
      return;
    }
    setMessages((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role !== "assistant") {
        return prev;
      }
      next[next.length - 1] = {
        ...last,
        content: `${last.content}${text}`,
      };
      return next;
    });
  };

  const appendAssistantNotice = (text: string) => {
    setMessages((prev) => {
      if (!text || prev.length === 0) {
        return prev;
      }
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role !== "assistant") {
        return prev;
      }
      const separator = last.content.length > 0 ? "\n" : "";
      next[next.length - 1] = {
        ...last,
        content: `${last.content}${separator}${text}\n`,
      };
      return next;
    });
  };

  const appendCardToAssistant = (card: ScryfallCard) => {
    setMessages((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role !== "assistant") {
        return prev;
      }
      const existingCards = last.cards ?? [];
      if (existingCards.some((existingCard) => existingCard.id === card.id)) {
        return prev;
      }
      next[next.length - 1] = {
        ...last,
        cards: [...existingCards, card],
      };
      return next;
    });
  };

  const fetchCardById = async (id: string) => {
    const response = await fetch(
      `${API_BASE}/cards/${encodeURIComponent(id)}`,
      {
        method: "GET",
      },
    );
    if (!response.ok) {
      throw new Error(`Card lookup failed with ${response.status}`);
    }
    return (await response.json()) as ScryfallCard;
  };

  const parseSseEvents = (chunkBuffer: string) => {
    const rawEvents = chunkBuffer.split(/\r?\n\r?\n/);
    const remainder = rawEvents.pop() ?? "";
    const parsedEvents = rawEvents
      .map((rawEvent) =>
        rawEvent
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean),
      )
      .filter((lines) => lines.length > 0)
      .map((lines) =>
        lines
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.replace(/^data:\s?/, ""))
          .join("\n"),
      )
      .filter(Boolean);

    return {
      remainder,
      parsedEvents,
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = input.trim();
    if (!query || isStreaming) {
      return;
    }

    setInput("");
    setError(null);
    setIsStreaming(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: query },
      { role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch(
        `${API_BASE}/stream/search?query=${encodeURIComponent(query)}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }
      if (!response.body) {
        throw new Error("Response body is empty");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let doneEventSeen = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });

        const { remainder, parsedEvents } = parseSseEvents(buffer);
        buffer = remainder;

        for (const payload of parsedEvents) {
          if (!payload || payload === "[DONE]") {
            continue;
          }

          try {
            const parsed = JSON.parse(payload) as {
              type?: "meta" | "chunk" | "done" | "seeking_card" | "found_card";
              content?: string;
              id?: string;
            };

            if (parsed.type === "chunk" && typeof parsed.content === "string") {
              appendToAssistant(parsed.content);
              continue;
            }

            if (parsed.type === "seeking_card") {
              appendAssistantNotice(
                parsed.content?.trim()
                  ? `Searching card: ${parsed.content}`
                  : "Searching for card...",
              );
              continue;
            }

            if (parsed.type === "found_card" && parsed.id) {
              // appendAssistantNotice("Card found.");
              try {
                const normalizedId = cleanCardId(parsed.id);
                if (!normalizedId) {
                  // appendAssistantNotice("Card lookup skipped: invalid card id.");
                  continue;
                }
                const card = await fetchCardById(normalizedId);
                appendCardToAssistant(card);
              } catch (cardError) {
                const cardMessage =
                  cardError instanceof Error
                    ? cardError.message
                    : "Failed to load card details";
                appendAssistantNotice(cardMessage);
              }
              continue;
            }

            if (parsed.type === "done") {
              doneEventSeen = true;
              break;
            }
          } catch {
            appendToAssistant(payload);
          }
        }

        if (doneEventSeen) {
          break;
        }
      }

      if (!doneEventSeen && buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer.trim()) as {
            type?: "chunk" | "done";
            content?: string;
          };
          if (parsed.type === "chunk" && parsed.content) {
            appendToAssistant(parsed.content);
          }
        } catch {
          appendToAssistant(buffer);
        }
      }

      if (!doneEventSeen) {
        setError("Stream ended before a done event was received.");
      }
    } catch (streamError) {
      const message =
        streamError instanceof Error ? streamError.message : "Unknown error";
      setError(message);
      setIsStreaming(false);
      return;
    }

    setIsStreaming(false);
  };

  return (
    <PageContainer>
      <div className="min-h-screen w-full">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold">Chat with the Oracle</h1>
            <p className="text-muted-foreground">
              Ask a question and stream the response from your FastAPI backend.
            </p>
          </header>

          <Card className="p-4 min-h-50">
            {messages.length === 0 ? (
              <div className="text-muted-foreground">
                Start the conversation with a card question or deck idea.
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
                {messages.map((message, index) => (
                  <Card
                    key={`${message.role}-${index}`}
                    className={`w-full rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      message.role === "user"
                        ? "ml-auto max-w-[80%] bg-primary text-primary-foreground"
                        : "mr-auto max-w-[85%] bg-muted text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">
                      {message.content ||
                        (message.role === "assistant" && isStreaming
                          ? "Thinking..."
                          : "")}
                    </p>
                    {message.cards && message.cards.length > 0 ? (
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {message.cards.map((card) => (
                          <ScryfallCardOverview key={card.id} card={card} />
                        ))}
                      </div>
                    ) : null}
                  </Card>
                ))}
                <div ref={endRef} />
              </div>
            )}
          </Card>

          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (
                  (event.metaKey || event.ctrlKey) &&
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  const form = event.currentTarget.form;
                  if (form) {
                    form.requestSubmit();
                  }
                }
              }}
              placeholder="Ask the oracle about cards, archetypes, or combos..."
              rows={3}
              disabled={isStreaming}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                Streaming from {API_BASE}
              </span>
              <Button type="submit" disabled={isStreaming || !input.trim()}>
                {isStreaming ? (
                  <>
                    <SparklesIcon /> Streaming...
                  </>
                ) : (
                  <>
                    <SendIcon /> Send
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}
