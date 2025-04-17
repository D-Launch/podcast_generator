import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface PublishData {
  coverArt: File | null;
  scheduledDate: string;
  unixTimestamp: number;
}

export function usePodbeanPublishing() {
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();

  const publishToPodbean = async (
    episodeId: string | null, 
    episodeName: string | null,
    publishData: PublishData
  ) => {
    if (!episodeId || !episodeName) {
      toast({
        title: "Error",
        description: "Episode ID or name is missing",
        variant: "destructive",
      });
      return { success: false };
    }

    if (!publishData.coverArt || !publishData.scheduledDate || publishData.unixTimestamp <= 0) {
      toast({
        title: "Error",
        description: "Missing required publishing information",
        variant: "destructive",
      });
      return { success: false };
    }

    setIsPublishing(true);

    try {
      // First, upload the cover art to Supabase storage
      const coverArtFile = publishData.coverArt;
      const fileExt = coverArtFile.name.split('.').pop();
      const fileName = `${episodeId}_cover_art.${fileExt}`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('podcast_assets')
        .upload(fileName, coverArtFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('podcast_assets')
        .getPublicUrl(fileName);
      
      const coverArtUrl = urlData.publicUrl;
      
      // Update the database with publishing information
      const { error } = await supabase
        .from('autoworkflow')
        .update({ 
          podcast_status: 'Publishing',
          podbean_cover_art_url: coverArtUrl,
          podbean_scheduled_date: publishData.scheduledDate,
          podbean_timestamp: publishData.unixTimestamp
        })
        .eq('id', episodeId);

      if (error) {
        throw error;
      }

      toast({
        title: "Publishing Started",
        description: `"${episodeName}" is being published to Podbean.`,
      });

      return { success: true };
    } catch (error) {
      console.error("Error publishing to Podbean:", error);
      toast({
        title: "Error",
        description: "Failed to publish to Podbean",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    isPublishing,
    publishToPodbean
  };
}
