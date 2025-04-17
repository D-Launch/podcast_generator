import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Interface for script links
export interface ScriptLinks {
  episode_interview_script_1: string | null;
  episode_interview_script_2: string | null;
  episode_interview_script_3: string | null;
  episode_interview_script_4: string | null;
  episode_interview_full_script: string | null;
  episode_interview_file: string | null;
}

// Helper function to check if a script link is valid
export const isValidScriptLink = (link: string | null): boolean => {
  return link !== null && link !== undefined && link.trim() !== '';
};

export function useScriptLinks(selectedScriptLinks?: Partial<ScriptLinks> | null, selectedEpisodeName?: string | null) {
  // Initialize with null values instead of empty strings to properly indicate absence of links
  const [scriptLinks, setScriptLinks] = useState<ScriptLinks>({
    episode_interview_script_1: null,
    episode_interview_script_2: null,
    episode_interview_script_3: null,
    episode_interview_script_4: null,
    episode_interview_full_script: null,
    episode_interview_file: null
  });
  
  const [isScriptGenerated, setIsScriptGenerated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Update script links when selectedScriptLinks changes
  useEffect(() => {
    if (selectedScriptLinks) {
      // Update script links
      setScriptLinks({
        episode_interview_script_1: selectedScriptLinks.episode_interview_script_1 || null,
        episode_interview_script_2: selectedScriptLinks.episode_interview_script_2 || null,
        episode_interview_script_3: selectedScriptLinks.episode_interview_script_3 || null,
        episode_interview_script_4: selectedScriptLinks.episode_interview_script_4 || null,
        episode_interview_full_script: selectedScriptLinks.episode_interview_full_script || null,
        episode_interview_file: selectedScriptLinks.episode_interview_file || null
      });
      
      // Set isScriptGenerated to true if any script link exists
      const hasAnyScript = Object.values(selectedScriptLinks).some(link => 
        link !== null && link !== undefined && link !== ''
      );
      setIsScriptGenerated(hasAnyScript);
    } else {
      // Reset script links
      setScriptLinks({
        episode_interview_script_1: null,
        episode_interview_script_2: null,
        episode_interview_script_3: null,
        episode_interview_script_4: null,
        episode_interview_full_script: null,
        episode_interview_file: null
      });
      
      setIsScriptGenerated(false);
    }
  }, [selectedScriptLinks]);

  // Check if Script #4 has a valid link
  const hasScript4 = isValidScriptLink(scriptLinks.episode_interview_script_4);

  // Check if Script #1 has a valid link
  const hasScript1 = isValidScriptLink(scriptLinks.episode_interview_script_1);

  // Function to refresh script links
  const refreshScriptLinks = async (episodeName: string | null) => {
    if (!episodeName) return;
    
    setIsRefreshing(true);
    
    try {
      const { data, error } = await supabase
        .from('autoworkflow')
        .select('id, episode_interview_script_1, episode_interview_script_2, episode_interview_script_3, episode_interview_script_4, episode_interview_full_script, episode_interview_file, episode_interview_script_status, episode_text_files_status, podcast_status')
        .eq('episode_interview_file_name', episodeName);
      
      if (error) {
        console.error('Error refreshing script links:', error);
        return { success: false, error };
      }
      
      if (data && data.length > 0) {
        // Sort by created_at to get the most recent record (if multiple exist)
        const mostRecentRecord = data[0];
        
        // Update script links
        const newScriptLinks = {
          episode_interview_script_1: mostRecentRecord.episode_interview_script_1 || null,
          episode_interview_script_2: mostRecentRecord.episode_interview_script_2 || null,
          episode_interview_script_3: mostRecentRecord.episode_interview_script_3 || null,
          episode_interview_script_4: mostRecentRecord.episode_interview_script_4 || null,
          episode_interview_full_script: mostRecentRecord.episode_interview_full_script || null,
          episode_interview_file: mostRecentRecord.episode_interview_file || null
        };
        
        setScriptLinks(newScriptLinks);
        
        // Set script generated flag if any script exists
        const hasAnyScript = mostRecentRecord.episode_interview_script_1 || 
                            mostRecentRecord.episode_interview_script_2 || 
                            mostRecentRecord.episode_interview_script_3 || 
                            mostRecentRecord.episode_interview_script_4;
        
        setIsScriptGenerated(!!hasAnyScript);
        
        return { 
          success: true, 
          data: mostRecentRecord,
          scriptLinks: newScriptLinks,
          hasAnyScript: !!hasAnyScript
        };
      }
      
      return { success: true, data: null };
    } catch (err) {
      console.error('Error in refreshScriptLinks:', err);
      return { success: false, error: err };
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    scriptLinks,
    setScriptLinks,
    isScriptGenerated,
    setIsScriptGenerated,
    hasScript1,
    hasScript4,
    isRefreshing,
    refreshScriptLinks
  };
}
