import { Button } from "@/components/ui/button";

interface AudioGenerationButtonProps {
  scriptStatus: "Approved" | "Pending" | "Audio Generated";
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
  // Determine button state and text
  const isDisabled = scriptStatus === "Approved" || 
                    scriptStatus === "Audio Generated" || 
                    !isScriptGenerated || 
                    !hasScript4;
                    
  const buttonTitle = !hasScript4 ? "Script #4 - Summary is required for approval" : 
                     scriptStatus === "Approved" ? "Audio generation is in progress" : 
                     scriptStatus === "Audio Generated" ? "Audio has been generated" :
                     "Generate audio for this episode";
  
  let buttonText = "Generate Audio";
  if (scriptStatus === "Approved") {
    buttonText = "Audio Generation In Progress";
  } else if (scriptStatus === "Audio Generated") {
    buttonText = "Audio Generated";
  } else if (!hasScript4 && isScriptGenerated) {
    buttonText = "Script #4 Required";
  }

  // Create a wrapper function to handle the click event
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    // Only proceed if the button is not disabled
    if (!isDisabled) {
      console.log("Audio generation button clicked");
      onClick();
    } else {
      console.log("Button is disabled, ignoring click");
    }
  };

  return (
    <Button 
      onClick={handleClick}
      className="flex-1"
      variant={scriptStatus === "Approved" || scriptStatus === "Audio Generated" ? "outline" : "default"}
      disabled={isDisabled}
      title={buttonTitle}
    >
      {buttonText}
    </Button>
  );
}
