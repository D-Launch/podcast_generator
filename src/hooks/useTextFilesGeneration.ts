import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export function useTextFilesGeneration() {
  const [isGeneratingTextFiles, setIsGeneratingTextFiles] = useState(false);
  const [textFileLinks, setTextFileLinks] = useState<Record<string, string | null>>({});
  const { toast } = useToast();

  const generateTextFiles = async (episodeId: string | null, episodeName: string | null) => {
    if (!episodeId || !episodeName) {
      toast({
        title: "Error",
        description: "Episode ID or name is missing",
        variant: "destructive",
      });
      return { success: false };
    }

    setIsGeneratingTextFiles(true);

    try {
      // Update the database to trigger text files generation
      const { error } = await supabase
        .from('autoworkflow')
        .update({ 
          episode_text_files_status: 'Processing',
          // Add any other fields needed to trigger the generation
        })
        .eq('id', episodeId);

      if (error) {
        throw error;
      }

      toast({
        title: "Text Files Generation Started",
        description: `Text files for "${episodeName}" are being generated.`,
      });

      return { success: true };
    } catch (error) {
      console.error("Error generating text files:", error);
      toast({
        title: "Error",
        description: "Failed to start text files generation",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsGeneratingTextFiles(false);
    }
  };

  // Function to update text file links when they become available
  const updateTextFileLinks = (links: Record<string, string | null>) => {
    setTextFileLinks(links);
  };

  return {
    isGeneratingTextFiles,
    textFileLinks,
    generateTextFiles,
    updateTextFileLinks
  };
}
