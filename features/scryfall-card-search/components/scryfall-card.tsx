import { ScryfallCardFace, type ScryfallCard } from "@/lib/types/scryfall";
import Image from "next/image";
import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { Button } from "../../../components/ui/button";
import { RefreshCcwIcon } from "lucide-react";

function getCardImageUrl(
  card: ScryfallCard | ScryfallCardFace,
): string | undefined {
  return card.image_uris?.normal;
}

interface ScryfallCardOverviewProps {
  card: ScryfallCard;
}

function SingleFaceCardImage({ card }: { card: ScryfallCard }) {
  const imageUrl = getCardImageUrl(card);
  if (!imageUrl) {
    return <p>No image</p>;
  }

  return (
    <div>
      <Image src={imageUrl} alt={card.name} width={488} height={680} />
    </div>
  );
}

function DoubleFacedCardImages({ card }: { card: ScryfallCard }) {
  const [activeFaceIndex, setActiveFaceIndex] = useState(0);

  if (!card.card_faces?.length) {
    return <p>No image</p>;
  }

  const activeFace = card.card_faces[activeFaceIndex];
  const activeFaceImageUrl = getCardImageUrl(activeFace);
  const faceCount = card.card_faces.length;
  const nextFaceIndex = (activeFaceIndex + 1) % faceCount;

  return (
    <div className="relative flex flex-col items-center gap-3">
      {activeFaceImageUrl ? (
        <Image
          src={activeFaceImageUrl}
          alt={`${card.name} - ${activeFace.name}`}
          width={488}
          height={680}
        />
      ) : (
        <p>No image</p>
      )}
      <Button
        className="absolute -right-[5%] top-[35%] -translate-y-1/2"
        type="button"
        onClick={() => setActiveFaceIndex(nextFaceIndex)}
      >
        <RefreshCcwIcon />
      </Button>
    </div>
  );
}

export function ScryfallCardOverview({ card }: ScryfallCardOverviewProps) {
  const isDoubleFaced = !card.image_uris?.normal && !!card.card_faces?.length;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(containerRef, { amount: 0.15 });

  return (
    <motion.div
      ref={containerRef}
      initial="out"
      animate={isInView ? "in" : "out"}
      variants={{
        in: { opacity: 1, scale: 1 },
        out: { opacity: 0, scale: 0.96 },
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {isDoubleFaced ? (
        <DoubleFacedCardImages card={card} />
      ) : (
        <SingleFaceCardImage card={card} />
      )}
    </motion.div>
  );
}
