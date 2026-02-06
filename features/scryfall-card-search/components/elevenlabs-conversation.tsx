import { Button } from "@/components/ui/button";
import {
  ElevenlabsToolScryfallCardFiltererParams,
  ElevenlabsToolScryfallCardSearchParams,
} from "@/lib/types/elevenlabs";
import {
  AlertCircleIcon,
  SparklesIcon,
  StarOffIcon,
  WandIcon,
  WandSparklesIcon,
} from "lucide-react";
import { useElevenlabsConversation } from "../viewModels/use-elevenlabs-conversation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
    data: { connectionStatus, error },
    operations: { startConversation, endConversation },
  } = useElevenlabsConversation({
    onScryfallCardSearch,
    onScryfallCardFilterer,
  });

  const callIcon = () => {
    switch (connectionStatus) {
      case "connecting":
        return <WandSparklesIcon />;
      case "connected":
        return <SparklesIcon />;
      case "disconnected":
        return <WandIcon />;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-4">
        <Button
          onClick={startConversation}
          disabled={
            connectionStatus === "connecting" ||
            connectionStatus === "connected"
          }
        >
          {callIcon()}
          Speak with the oracle
        </Button>
        {connectionStatus === "connected" && (
          <Button onClick={endConversation}>
            <StarOffIcon />
            End Conversation
          </Button>
        )}
      </div>

      {error && (
        <Alert>
          <AlertCircleIcon />
          <AlertTitle>{`Seems like my magic has worn off...`}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
