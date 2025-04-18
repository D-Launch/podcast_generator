import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

// Webhook URL for audio generation
const AUDIO_GENERATION_WEBHOOK_URL = "https://d-launch.app.n8n.cloud/webhook/c00dee64-b11f-4fdc-9111-786b414229d5";

export function useAudioGeneration() {
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const { toast } = useToast();

  const generateAudio = async (episodeData: {
    id: string;
    episodeName: string;
    scriptLinks: Record<string, string | null>;
    [key: string]: any;
  }) => {
    console.log("generateAudio called with data:", JSON.stringify(episodeData, null, 2));
    
    // If we don't have an ID but have an episode name, try to fetch the ID
    if ((!episodeData.id || episodeData.id === "null") && episodeData.episodeName) {
      console.log("No ID provided but have episode name, attempting to fetch ID from database");
      try {
        const { data, error } = await supabase
          .from('autoworkflow')
          .select('id')
          .eq('episode_interview_file_name', episodeData.episodeName)
          .single();
        
        if (error) {
          console.error("Error fetching episode ID from name:", error);
        } else if (data) {
          console.log("Successfully fetched ID from database:", data.id);
          episodeData.id = data.id;
        }
      } catch (err) {
        console.error("Exception while fetching ID from database:", err);
      }
    }
    
    if (!episodeData.id || episodeData.id === "null" || !episodeData.episodeName) {
      console.error("Missing required data for audio generation:", { 
        hasId: !!episodeData.id && episodeData.id !== "null", 
        hasName: !!episodeData.episodeName 
      });
      toast({
        title: "Error",
        description: "Episode ID or name is missing",
        variant: "destructive",
      });
      return { success: false };
    }

    setIsGeneratingAudio(true);
    console.log("Starting audio generation for episode:", episodeData.id);
    console.log("Episode data being sent:", JSON.stringify(episodeData, null, 2));

    try {
      // Prepare the payload for the webhook
      const payload = {
        episodeId: episodeData.id,
        episodeName: episodeData.episodeName,
        scriptLinks: episodeData.scriptLinks,
        timestamp: new Date().toISOString(),
        action: "generate_audio"
      };
      
      console.log("Sending webhook request to:", AUDIO_GENERATION_WEBHOOK_URL);
      console.log("Webhook payload:", JSON.stringify(payload, null, 2));

      // Send the data to the webhook
      const response = await fetch(AUDIO_GENERATION_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(payload),
      });

      console.log("Webhook response status:", response.status);
      
      // Try to get the response body for debugging
      let responseBody;
      try {
        responseBody = await response.text();
        console.log("Webhook response body:", responseBody);
      } catch (e) {
        console.log("Could not read response body:", e);
      }

      if (!response.ok) {
        throw new Error(`Webhook request failed with status ${response.status}`);
      }

      toast({
        title: "Audio Generation Started",
        description: `Audio for "${episodeData.episodeName}" is being generated.`,
      });

      return { success: true };
    } catch (error) {
      console.error("Error generating audio:", error);
      toast({
        title: "Error",
        description: "Failed to start audio generation. Check console for details.",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsGeneratingAudio(false);
      console.log("Audio generation request completed");
    }
  };

  return {
    isGeneratingAudio,
    generateAudio
  };
}
