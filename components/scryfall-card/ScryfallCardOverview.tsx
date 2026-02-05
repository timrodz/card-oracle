import { ScryfallCard } from "@/lib/types/scryfall-card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import Image from "next/image";

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
  if (!card.card_faces?.length) {
    return <p>No image</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {card.card_faces.map((face, index) =>
        face.image_uris?.normal ? (
          <Image
            key={`${card.id}-${index}`}
            className="rounded-md"
            src={face.image_uris.normal}
            alt={`${card.name} - ${face.name}`}
            width={488}
            height={680}
          />
        ) : (
          <p key={`${card.id}-${index}`}>No image</p>
        ),
      )}
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
