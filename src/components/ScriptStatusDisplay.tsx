import { useScriptStatus } from "@/hooks/useScriptStatus";
import { useScriptLinks } from "@/hooks/useScriptLinks";
import { useAudioGeneration } from "@/hooks/useAudioGeneration";
import { AudioGenerationButton } from "@/components/AudioGenerationButton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { ScriptApprovalDialog } from "@/components/script-approval-dialog";
import { supabase } from "@/lib/supabase";

interface ScriptStatusDisplayProps {
  episodeId: string | null;
  episodeName: string | null;
  scriptStatus: string | null;
  scriptLinks: Record<string, string | null>;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function ScriptStatusDisplay({
  episodeId,
  episodeName,
  scriptStatus,
  scriptLinks,
  onRefresh,
  isRefreshing
}: ScriptStatusDisplayProps) {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [databaseId, setDatabaseId] = useState<string | null>(null);
  const { approveScripts } = useScriptStatus();
  const { isScriptGenerated, hasScript4 } = useScriptLinks({ ...scriptLinks });
  const { isGeneratingAudio, generateAudio } = useAudioGeneration();

  // Format the script status for display
  const formattedStatus = scriptStatus || "Pending";
  
  // Fetch the actual database ID when episodeName changes
  useEffect(() => {
    const fetchDatabaseId = async () => {
      if (!episodeName) return;
      
      try {
        console.log("Fetching database ID for episode name:", episodeName);
        
        const { data, error } = await supabase
          .from('autoworkflow')
          .select('id')
          .eq('episode_interview_file_name', episodeName)
          .single();
        
        if (error) {
          console.error("Error fetching database ID:", error);
          return;
        }
        
        if (data) {
          console.log("Found database ID:", data.id, "for episode name:", episodeName);
          setDatabaseId(data.id);
        } else {
          console.log("No database ID found for episode name:", episodeName);
        }
      } catch (err) {
        console.error("Error in fetchDatabaseId:", err);
      }
    };
    
    fetchDatabaseId();
  }, [episodeName]);
  
  // Handle the audio generation button click - now opens confirmation dialog
  const handleGenerateAudioClick = () => {
    console.log("Generate Audio button clicked, opening confirmation dialog");
    console.log("Props Episode ID:", episodeId);
    console.log("Database ID:", databaseId);
    console.log("Episode Name:", episodeName);
    setIsConfirmDialogOpen(true);
  };

  // Handle the actual audio generation after confirmation
  const handleConfirmAudioGeneration = async () => {
    // Use the database ID if available, otherwise fall back to episodeId
    const idToUse = databaseId || episodeId;
    
    console.log("Confirming audio generation with:");
    console.log("- Props Episode ID:", episodeId);
    console.log("- Database ID:", databaseId);
    console.log("- ID to use:", idToUse);
    console.log("- Episode Name:", episodeName);
    
    if (!idToUse || !episodeName) {
      console.error("Cannot generate audio: Missing episode ID or name", { 
        propsEpisodeId: episodeId,
        databaseId,
        idToUse,
        episodeName 
      });
      setIsConfirmDialogOpen(false);
      return;
    }
    
    try {
      // First approve the scripts in the database
      console.log("Approving scripts with episode ID:", idToUse);
      const approvalResult = await approveScripts(idToUse);
      
      if (!approvalResult.success) {
        console.error("Failed to approve scripts:", approvalResult.error);
        setIsConfirmDialogOpen(false);
        return;
      }
      
      console.log("Scripts approved successfully, now generating audio");
      
      // Then send the data to the webhook
      const result = await generateAudio({
        id: idToUse,
        episodeName: episodeName,
        scriptLinks: scriptLinks
      });
      
      console.log("Generate audio result:", result);
    } catch (error) {
      console.error("Error in audio generation process:", error);
    } finally {
      setIsConfirmDialogOpen(false);
    }
  };

  // Handle cancellation of the confirmation dialog
  const handleCancelAudioGeneration = () => {
    console.log("Audio generation cancelled");
    setIsConfirmDialogOpen(false);
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Script Status</h3>
        <Button 
          onClick={onRefresh} 
          variant="outline" 
          size="sm"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">Status:</span>
            <span className={`text-sm font-medium ${
              formattedStatus === "Approved" ? "text-green-600 dark:text-green-400" :
              formattedStatus === "Audio Generated" ? "text-blue-600 dark:text-blue-400" :
              "text-yellow-600 dark:text-yellow-400"
            }`}>
              {formattedStatus}
            </span>
          </div>
        </div>
        
        {/* Debug info - remove in production */}
        <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded">
          <div>Props Episode ID: {episodeId || 'null'}</div>
          <div>Database ID: {databaseId || 'null'}</div>
          <div>Episode Name: {episodeName || 'null'}</div>
        </div>
        
        <div className="flex space-x-2">
          <AudioGenerationButton 
            scriptStatus={formattedStatus as "Approved" | "Pending" | "Audio Generated"}
            isScriptGenerated={isScriptGenerated}
            hasScript4={hasScript4}
            onClick={handleGenerateAudioClick}
            isGeneratingAudio={isGeneratingAudio}
          />
        </div>
      </div>

      {/* Confirmation Dialog */}
      {isConfirmDialogOpen && (
        <ScriptApprovalDialog
          isOpen={true}
          onConfirm={handleConfirmAudioGeneration}
          onCancel={handleCancelAudioGeneration}
        />
      )}
    </div>
  );
}
