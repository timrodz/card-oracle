"use client";

import { ScryfallCardApiResponse } from "@/lib/types/scryfall";
import { ElevenlabsConversation } from "./components/elevenlabs-conversation";
import { ScryfallCardFilters } from "./components/scryfall-card-filters";
import { ScryfallCards } from "./components/scryfall-card-list";
import { useScryfallCards } from "./viewModels/use-scryfall-cards";

import initialDataJson from "../../public/responses/scryfall/scryfall-card-search-paginated-response.json";
const initialData = initialDataJson as ScryfallCardApiResponse;

export function ScryfallCardSearchFeature() {
  const {
    data: {
      allCards,
      filteredCards,
      hasMoreCards,
      cmcOptions,
      colorOptions,
      setNameOptions,
      selectedCmc,
      selectedColors,
      selectedSetName,
      isLoadingMore,
    },
    operations: {
      loadMoreCards,
      onHandleScryfallCardSearch,
      onHandleScryfallCardFilterer,
      setSelectedCmc,
      setSelectedColors,
      setSelectedSetName,
    },
  } = useScryfallCards({
    initialData,
  });

  return (
    <div className="px-4 py-10 w-full h-full flex flex-col items-center gap-8">
      <header className="mx-auto">
        <h1>MTG Oracle</h1>
        <h2>
          Real-time voice translating tool to help you find MTG cards using
          Scryfall
        </h2>
      </header>
      <main className="z-10 flex-1 w-full max-w-6xl mx-auto flex flex-col items-center justify-center min-h-0 relative gap-8">
        <ElevenlabsConversation
          onScryfallCardSearch={onHandleScryfallCardSearch}
          onScryfallCardFilterer={onHandleScryfallCardFilterer}
        />

        {allCards.length > 0 && (
          <ScryfallCardFilters
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
        )}

        <ScryfallCards
          filteredCards={filteredCards}
          hasMoreCards={hasMoreCards}
          isLoadingMore={isLoadingMore}
          loadMoreCards={loadMoreCards}
        />
      </main>
    </div>
  );
}
