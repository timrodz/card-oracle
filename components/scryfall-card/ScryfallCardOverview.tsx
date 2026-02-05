import { ScryfallCard } from "@/lib/types/scryfall-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import Image from "next/image";
import { useState } from "react";

interface ScryfallCardOverviewProps {
  card: ScryfallCard;
}

function SingleFaceCardImage({ card }: { card: ScryfallCard }) {
  if (!card.image_uris?.normal) {
    return <p>No image</p>;
  }

  return (
    <Image
      className="rounded-md"
      src={card.image_uris.normal}
      alt={card.name}
      width={488}
      height={680}
    />
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
    <div className="flex flex-col items-center gap-3">
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
      <button
        className="rounded-md border px-3 py-1 text-sm"
        type="button"
        onClick={() => setActiveFaceIndex(nextFaceIndex)}
      >
        Flip
      </button>
    </div>
  );
}

export function ScryfallCardOverview({ card }: ScryfallCardOverviewProps) {
  const isDoubleFaced = !card.image_uris?.normal && !!card.card_faces?.length;

  return (
    <Card key={card.id}>
      <CardHeader>
        <CardTitle>{card.name}</CardTitle>
        <CardDescription>{card.type_line}</CardDescription>
      </CardHeader>
      <CardContent>
        {isDoubleFaced ? (
          <DoubleFacedCardImages card={card} />
        ) : (
          <SingleFaceCardImage card={card} />
        )}
      </CardContent>
    </Card>
  );
}
