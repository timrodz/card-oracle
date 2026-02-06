import { Button } from "@/components/ui/button";
import {
  ElevenlabsToolScryfallCardFiltererParams,
  ElevenlabsToolScryfallCardSearchParams,
} from "@/lib/types/elevenlabs";
import {
  PhoneCallIcon,
  PhoneIcon,
  PhoneMissedIcon,
  PhoneOutgoingIcon,
} from "lucide-react";
import { useElevenlabsConversation } from "../viewModels/use-elevenlabs-conversation";

interface ElevenlabsConversationProps {
  onScryfallCardSearch: (
    params: ElevenlabsToolScryfallCardSearchParams,
  ) => void;
  onScryfallCardFilterer: (
    params: ElevenlabsToolScryfallCardFiltererParams,
  ) => void;
}
export function ElevenlabsConversation({
  onScryfallCardSearch,
  onScryfallCardFilterer,
}: ElevenlabsConversationProps) {
  const {
    data: { connectionStatus, agentStatus, error },
    operations: { startConversation, endConversation },
  } = useElevenlabsConversation({
    onScryfallCardSearch,
    onScryfallCardFilterer,
  });

  const callIcon = () => {
    switch (connectionStatus) {
      case "connecting":
        return <PhoneOutgoingIcon />;
      case "connected":
        return <PhoneCallIcon />;
      case "disconnected":
        return <PhoneIcon />;
    }
  };

  return (
    <div>
      <Button
        onClick={startConversation}
        disabled={
          connectionStatus === "connecting" || connectionStatus === "connected"
        }
      >
        {callIcon()}
        Start Conversation
      </Button>
      <Button
        onClick={endConversation}
        disabled={connectionStatus === "disconnected"}
      >
        <PhoneMissedIcon />
        End Conversation
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
  );
}
