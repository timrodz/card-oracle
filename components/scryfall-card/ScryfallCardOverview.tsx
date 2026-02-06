import { ScryfallCard } from "@/lib/types/scryfall-card";
import Image from "next/image";
import { useState } from "react";
import { Button } from "../ui/button";

interface ScryfallCardOverviewProps {
  card: ScryfallCard;
}

function SingleFaceCardImage({ card }: { card: ScryfallCard }) {
  if (!card.image_uris?.normal) {
    return <p>No image</p>;
  }

  return (
    <div>
      <Image
        className="rounded-md"
        src={card.image_uris.normal}
        alt={card.name}
        width={488}
        height={680}
      />
    </div>
  );
}

function DoubleFacedCardImages({ card }: { card: ScryfallCard }) {
  const [activeFaceIndex, setActiveFaceIndex] = useState(0);

  if (!card.card_faces?.length) {
    return <p>No image</p>;
  }

  const activeFace = card.card_faces[activeFaceIndex];
  const faceCount = card.card_faces.length;
  const nextFaceIndex = (activeFaceIndex + 1) % faceCount;

  return (
    <div className="relative flex flex-col items-center gap-3">
      {activeFace?.image_uris?.normal ? (
        <Image
          className="rounded-md"
          src={activeFace.image_uris.normal}
          alt={`${card.name} - ${activeFace.name}`}
          width={488}
          height={680}
        />
      ) : (
        <p>No image</p>
      )}
      <Button
        className="absolute -right-2 -top-2"
        type="button"
        onClick={() => setActiveFaceIndex(nextFaceIndex)}
      >
        Flip
      </Button>
    </div>
  );
}

export function ScryfallCardOverview({ card }: ScryfallCardOverviewProps) {
  const isDoubleFaced = !card.image_uris?.normal && !!card.card_faces?.length;

  return isDoubleFaced ? (
    <DoubleFacedCardImages card={card} />
  ) : (
    <SingleFaceCardImage card={card} />
  );
}
