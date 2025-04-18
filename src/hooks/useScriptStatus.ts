import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type ScriptStatus = "Pending" | "Approved" | "Audio Generated";
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
    getScriptStatusFromString(initialScriptStatus)
  );
  const [textFilesStatus, setTextFilesStatus] = useState<ProcessStatus>(
    initialTextFilesStatus as ProcessStatus || null
  );
  const [podcastStatus, setPodcastStatus] = useState<ProcessStatus>(
    initialPodcastStatus as ProcessStatus || null
  );
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  // Helper function to convert string to ScriptStatus type
  function getScriptStatusFromString(status?: string): ScriptStatus {
    if (status === "Approved") return "Approved";
    if (status === "Audio Generated") return "Audio Generated";
    return "Pending";
  }

  // Update status when props change
  useEffect(() => {
    if (initialScriptStatus) {
      console.log("Updating script status from props:", initialScriptStatus);
      setScriptStatus(getScriptStatusFromString(initialScriptStatus));
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
    if (!episodeId) {
      console.error("Cannot approve scripts: No episode ID provided");
      return { success: false, error: "No episode ID provided" };
    }
    
    try {
      console.log("Approving scripts for episode ID:", episodeId);
      
      // First, check if the episode exists
      const { data: episodeData, error: episodeError } = await supabase
        .from('autoworkflow')
        .select('id, episode_interview_script_status')
        .eq('id', episodeId)
        .single();
      
      if (episodeError) {
        console.error('Error fetching episode:', episodeError);
        return { success: false, error: episodeError };
      }
      
      if (!episodeData) {
        console.error('Episode not found with ID:', episodeId);
        
        // Try to find by episode name if ID lookup fails
        console.log("Attempting to find episode by name...");
        const { data: nameData, error: nameError } = await supabase
          .from('autoworkflow')
          .select('id')
          .eq('episode_interview_file_name', episodeId)
          .single();
          
        if (nameError || !nameData) {
          console.error('Episode not found by name either:', episodeId);
          return { success: false, error: "Episode not found" };
        }
        
        console.log("Found episode by name with ID:", nameData.id);
        
        // Now update using the found ID
        const { error } = await supabase
          .from('autoworkflow')
          .update({ 
            episode_interview_script_status: "Approved",
            episode_text_files_status: "Pending",
            podcast_status: "Pending"
          })
          .eq('id', nameData.id);
        
        if (error) {
          console.error('Error updating script status:', error);
          return { success: false, error };
        }
        
        console.log("Successfully updated script status to Approved using name lookup");
        
        // Update local state
        setScriptStatus("Approved");
        setTextFilesStatus("Pending");
        setPodcastStatus("Pending");
        
        // Dispatch an event to notify components to refresh
        window.dispatchEvent(new CustomEvent('script-status-updated', { 
          detail: { 
            episodeId: nameData.id,
            scriptStatus: "Approved",
            textFilesStatus: "Pending",
            podcastStatus: "Pending"
          } 
        }));
        
        return { success: true };
      }
      
      console.log("Found episode:", episodeData);
      
      // Now update the status
      const { error } = await supabase
        .from('autoworkflow')
        .update({ 
          episode_interview_script_status: "Approved",
          episode_text_files_status: "Pending",
          podcast_status: "Pending"
        })
        .eq('id', episodeId);
      
      if (error) {
        console.error('Error updating script status:', error);
        return { success: false, error };
      }
      
      console.log("Successfully updated script status to Approved");
      
      // Update local state
      setScriptStatus("Approved");
      setTextFilesStatus("Pending");
      setPodcastStatus("Pending");
      
      // Dispatch an event to notify components to refresh
      window.dispatchEvent(new CustomEvent('script-status-updated', { 
        detail: { 
          episodeId,
          scriptStatus: "Approved",
          textFilesStatus: "Pending",
          podcastStatus: "Pending"
        } 
      }));
      
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
