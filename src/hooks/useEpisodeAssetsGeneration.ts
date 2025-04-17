import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export function useEpisodeAssetsGeneration() {
  const [isGeneratingAssets, setIsGeneratingAssets] = useState(false);
  const [assetLinks, setAssetLinks] = useState<Record<string, string | null>>({});
  const { toast } = useToast();

  const generateEpisodeAssets = async (episodeId: string | null, episodeName: string | null) => {
    if (!episodeId || !episodeName) {
      toast({
        title: "Error",
        description: "Episode ID or name is missing",
        variant: "destructive",
      });
      return { success: false };
    }

    setIsGeneratingAssets(true);

    try {
      // Update the database to trigger episode assets generation
      const { error } = await supabase
        .from('autoworkflow')
        .update({ 
          podcast_status: 'Processing',
          // Add any other fields needed to trigger the generation
        })
        .eq('id', episodeId);

      if (error) {
        throw error;
      }

      toast({
        title: "Episode Assets Generation Started",
        description: `Assets for "${episodeName}" are being generated.`,
      });

      return { success: true };
    } catch (error) {
      console.error("Error generating episode assets:", error);
      toast({
        title: "Error",
        description: "Failed to start episode assets generation",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsGeneratingAssets(false);
    }
  };

  // Function to update asset links when they become available
  const updateAssetLinks = (links: Record<string, string | null>) => {
    setAssetLinks(links);
  };

  return {
    isGeneratingAssets,
    assetLinks,
    generateEpisodeAssets,
    updateAssetLinks
  };
}
