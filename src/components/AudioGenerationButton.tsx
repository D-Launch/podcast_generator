import { Button } from "@/components/ui/button";

interface AudioGenerationButtonProps {
  scriptStatus: "Approved" | "Pending";
  isScriptGenerated: boolean;
  hasScript4: boolean;
  onClick: () => void;
}

export function AudioGenerationButton({ 
  scriptStatus, 
  isScriptGenerated, 
  hasScript4, 
  onClick 
}: AudioGenerationButtonProps) {
  return (
    <Button 
      onClick={onClick}
      className="flex-1"
      variant={scriptStatus === "Approved" ? "outline" : "default"}
      disabled={scriptStatus === "Approved" || !isScriptGenerated || !hasScript4}
      title={!hasScript4 ? "Script #4 - Summary is required for approval" : ""}
    >
      {scriptStatus === "Approved" 
        ? "Audio Generation In Progress" 
        : !hasScript4 && isScriptGenerated
          ? "Script #4 Required"
          : "Generate Audio"}
    </Button>
  );
}
