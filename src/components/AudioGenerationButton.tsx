import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface AudioGenerationButtonProps {
  scriptStatus: "Approved" | "Pending" | "Audio Generated";
  isScriptGenerated: boolean;
  hasScript4: boolean;
  onClick: () => void;
  isGeneratingAudio?: boolean;
  episodeName?: string | null; // Add episodeName prop
}

export function AudioGenerationButton({ 
  scriptStatus, 
  isScriptGenerated, 
  hasScript4, 
  onClick,
  isGeneratingAudio = false,
  episodeName = null // Default to null
}: AudioGenerationButtonProps) {
  const { toast } = useToast();
  const [episodeId, setEpisodeId] = useState<string | null>(null);
  
  // Fetch the episode ID when the component mounts or episodeName changes
  useEffect(() => {
    const fetchEpisodeId = async () => {
      if (!episodeName) return;
      
      try {
        console.log("AudioGenerationButton: Fetching episode ID for name:", episodeName);
        
        const { data, error } = await supabase
          .from('autoworkflow')
          .select('id')
          .eq('episode_interview_file_name', episodeName)
          .single();
        
        if (error) {
          console.error("AudioGenerationButton: Error fetching episode ID:", error);
          return;
        }
        
        if (data) {
          console.log("AudioGenerationButton: Found episode ID:", data.id);
          setEpisodeId(data.id);
        } else {
          console.log("AudioGenerationButton: No episode found with name:", episodeName);
        }
      } catch (err) {
        console.error("AudioGenerationButton: Exception in fetchEpisodeId:", err);
      }
    };
    
    fetchEpisodeId();
  }, [episodeName]);
  
  // Determine button state and text
  const isDisabled = scriptStatus === "Approved" || 
                    scriptStatus === "Audio Generated" || 
                    !isScriptGenerated || 
                    !hasScript4 ||
                    isGeneratingAudio;
                    
  const buttonTitle = !hasScript4 ? "Script #4 - Summary is required for approval" : 
                     scriptStatus === "Approved" ? "Audio generation is in progress" : 
                     scriptStatus === "Audio Generated" ? "Audio has been generated" :
                     isGeneratingAudio ? "Sending request to generate audio..." :
                     "Generate audio for this episode";
  
  let buttonText = "Generate Audio";
  if (scriptStatus === "Approved") {
    buttonText = "Audio Generation In Progress";
  } else if (scriptStatus === "Audio Generated") {
    buttonText = "Audio Generated";
  } else if (!hasScript4 && isScriptGenerated) {
    buttonText = "Script #4 Required";
  } else if (isGeneratingAudio) {
    buttonText = "Sending Request...";
  }

  // Create a wrapper function to handle the click event
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    // Only proceed if the button is not disabled
    if (!isDisabled) {
      console.log("Audio generation button clicked");
      console.log("Episode ID:", episodeId);
      console.log("Episode Name:", episodeName);
      
      // Check if we have the episode ID
      if (!episodeId && episodeName) {
        console.log("No episode ID available, but have episode name. Will try to fetch ID in the handler.");
      } else if (!episodeId && !episodeName) {
        console.error("Cannot generate audio: No episode ID or name available");
        toast({
          title: "Error",
          description: "Cannot generate audio: Missing episode information",
          variant: "destructive",
        });
        return;
      }
      
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
      data-episode-id={episodeId} // Add data attribute for debugging
      data-episode-name={episodeName} // Add data attribute for debugging
    >
      {buttonText}
    </Button>
  );
}
