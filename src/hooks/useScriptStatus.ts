import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type ScriptStatus = "Pending" | "Approved";
export type ProcessStatus = "Pending" | "Processing" | "Completed" | "Failed" | null;

interface ScriptStatusProps {
  initialScriptStatus?: string;
  initialTextFilesStatus?: string | null;
  initialPodcastStatus?: string | null;
}

export function useScriptStatus({
  initialScriptStatus,
  initialTextFilesStatus,
  initialPodcastStatus
}: ScriptStatusProps = {}) {
  const [scriptStatus, setScriptStatus] = useState<ScriptStatus>(
    initialScriptStatus === "Approved" ? "Approved" : "Pending"
  );
  const [textFilesStatus, setTextFilesStatus] = useState<ProcessStatus>(
    initialTextFilesStatus as ProcessStatus || null
  );
  const [podcastStatus, setPodcastStatus] = useState<ProcessStatus>(
    initialPodcastStatus as ProcessStatus || null
  );
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  // Update status when props change
  useEffect(() => {
    if (initialScriptStatus) {
      setScriptStatus(initialScriptStatus === "Approved" ? "Approved" : "Pending");
    }
    
    if (initialTextFilesStatus) {
      setTextFilesStatus(initialTextFilesStatus as ProcessStatus);
    }
    
    if (initialPodcastStatus) {
      setPodcastStatus(initialPodcastStatus as ProcessStatus);
    }
  }, [initialScriptStatus, initialTextFilesStatus, initialPodcastStatus]);

  // Function to approve scripts
  const approveScripts = async (episodeId: string | null) => {
    if (!episodeId) return { success: false, error: "No episode ID provided" };
    
    try {
      const { error } = await supabase
        .from('autoworkflow')
        .update({ 
          episode_interview_script_status: "Approved",
          episode_text_files_status: "Pending", // Set initial status for text files
          podcast_status: "Pending" // Set initial status for podcast
        })
        .eq('id', episodeId);
      
      if (error) {
        console.error('Error updating script status:', error);
        return { success: false, error };
      }
      
      // Update local state
      setScriptStatus("Approved");
      setTextFilesStatus("Pending");
      setPodcastStatus("Pending");
      
      return { success: true };
    } catch (err) {
      console.error('Error approving scripts:', err);
      return { success: false, error: err };
    }
  };

  // Function to update processing status based on script availability
  const updateProcessingStatus = (hasScript1: boolean, hasScript4: boolean, isSubmitting: boolean) => {
    if (isSubmitting || hasScript1) {
      if (hasScript1 && !hasScript4) {
        setProcessingStatus("Script #1 has been generated, kindly wait for the other scripts to load");
      } else if (hasScript4) {
        setProcessingStatus(null); // Clear the status when all scripts are loaded
      }
    } else {
      setProcessingStatus(null);
    }
  };

  return {
    scriptStatus,
    setScriptStatus,
    textFilesStatus,
    setTextFilesStatus,
    podcastStatus,
    setPodcastStatus,
    processingStatus,
    setProcessingStatus,
    approveScripts,
    updateProcessingStatus
  };
}
