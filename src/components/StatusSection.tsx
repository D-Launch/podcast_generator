import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Loader2, Music, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface ScriptLinks {
  episode_interview_script_1: string | null;
  episode_interview_script_2: string | null;
  episode_interview_script_3: string | null;
  episode_interview_script_4: string | null;
  episode_interview_full_script: string | null;
  episode_interview_file: string | null;
  episode_interview_script_status?: string;
  episode_text_files_status?: string;
  podcast_status?: string;
}

interface StatusSectionProps {
  scriptLinks: ScriptLinks | null;
  episodeName: string | null;
}

export function StatusSection({ scriptLinks, episodeName }: StatusSectionProps) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scriptStatus, setScriptStatus] = useState<string>("Pending");
  const [textFilesStatus, setTextFilesStatus] = useState<string | null>(null);
  const [podcastStatus, setPodcastStatus] = useState<string | null>(null);

  // Update local state when scriptLinks changes
  useEffect(() => {
    if (scriptLinks) {
      // Update script status
      if (scriptLinks.episode_interview_script_status) {
        setScriptStatus(scriptLinks.episode_interview_script_status);
      } else {
        setScriptStatus("Pending");
      }
      
      // Update text files status
      setTextFilesStatus(scriptLinks.episode_text_files_status || null);
      
      // Update podcast status
      setPodcastStatus(scriptLinks.podcast_status || null);
    } else {
      // Reset to defaults when no script links
      setScriptStatus("Pending");
      setTextFilesStatus(null);
      setPodcastStatus(null);
    }
  }, [scriptLinks]);

  // Function to manually refresh status
  const refreshStatus = async () => {
    if (!episodeName) {
      toast({
        title: "No episode selected",
        description: "Please select an episode to refresh its status.",
        variant: "destructive",
      });
      return;
    }

    setIsRefreshing(true);

    try {
      const { data, error } = await supabase
        .from('autoworkflow')
        .select('episode_interview_script_status, episode_text_files_status, podcast_status')
        .eq('episode_interview_file_name', episodeName)
        .single();

      if (error) throw error;

      if (data) {
        // Update script status
        if (data.episode_interview_script_status) {
          setScriptStatus(data.episode_interview_script_status);
        }
        
        // Update text files status
        setTextFilesStatus(data.episode_text_files_status || null);
        
        // Update podcast status
        setPodcastStatus(data.podcast_status || null);
        
        toast({
          title: "Status refreshed",
          description: "The status information has been updated.",
        });
      }
    } catch (error) {
      console.error("Error refreshing status:", error);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh status information.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Determine script status badge color and icon
  const getScriptStatusBadge = () => {
    let bgColor = "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
    let icon = <AlertCircle className="w-4 h-4 mr-1" />;
    
    if (scriptStatus === "Approved") {
      bgColor = "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      icon = <CheckCircle className="w-4 h-4 mr-1" />;
    } else if (scriptStatus === "Audio Generated") {
      bgColor = "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100";
      icon = <Music className="w-4 h-4 mr-1" />;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {icon}
        {scriptStatus}
      </span>
    );
  };

  // Get badge for text files status
  const getTextFilesBadge = () => {
    if (!textFilesStatus) {
      return (
        <span className="text-sm text-gray-500 dark:text-gray-400">Not started</span>
      );
    }
    
    let bgColor = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    let icon = <AlertCircle className="w-4 h-4 mr-1" />;
    
    if (textFilesStatus === "Pending") {
      bgColor = "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
      icon = <AlertCircle className="w-4 h-4 mr-1" />;
    } else if (textFilesStatus === "Processing") {
      bgColor = "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
      icon = <Loader2 className="w-4 h-4 mr-1 animate-spin" />;
    } else if (textFilesStatus === "Completed") {
      bgColor = "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      icon = <CheckCircle className="w-4 h-4 mr-1" />;
    } else if (textFilesStatus === "Failed") {
      bgColor = "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
      icon = <AlertCircle className="w-4 h-4 mr-1" />;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {icon}
        {textFilesStatus}
      </span>
    );
  };

  // Get badge for podcast status
  const getPodcastBadge = () => {
    if (!podcastStatus) {
      return (
        <span className="text-sm text-gray-500 dark:text-gray-400">Not started</span>
      );
    }
    
    let bgColor = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    let icon = <AlertCircle className="w-4 h-4 mr-1" />;
    
    if (podcastStatus === "Pending") {
      bgColor = "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
      icon = <AlertCircle className="w-4 h-4 mr-1" />;
    } else if (podcastStatus === "Processing") {
      bgColor = "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
      icon = <Loader2 className="w-4 h-4 mr-1 animate-spin" />;
    } else if (podcastStatus === "Completed") {
      bgColor = "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      icon = <CheckCircle className="w-4 h-4 mr-1" />;
    } else if (podcastStatus === "Ready to Publish") {
      bgColor = "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100";
      icon = <Music className="w-4 h-4 mr-1" />;
    } else if (podcastStatus === "Failed") {
      bgColor = "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
      icon = <AlertCircle className="w-4 h-4 mr-1" />;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {icon}
        {podcastStatus}
      </span>
    );
  };

  // Show a message when no episode is selected
  if (!episodeName) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Select an episode to view its status
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Episode Name */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-1">
          Selected Episode
        </h3>
        <p className="text-blue-700 dark:text-blue-400 font-medium">
          {episodeName}
        </p>
      </div>
      
      {/* Status Cards */}
      <div className="space-y-4">
        {/* Script Status Card */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Script Status</h4>
            {getScriptStatusBadge()}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {scriptStatus === "Pending" && "Scripts have been generated but need approval."}
            {scriptStatus === "Approved" && "Scripts have been approved and are ready for audio generation."}
            {scriptStatus === "Audio Generated" && "Audio has been generated from the approved scripts."}
          </p>
        </div>
        
        {/* Text Files Status Card */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Text Files Status</h4>
            {getTextFilesBadge()}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {!textFilesStatus && "Text files generation has not been started."}
            {textFilesStatus === "Pending" && "Text files generation is queued."}
            {textFilesStatus === "Processing" && "Text files are being generated."}
            {textFilesStatus === "Completed" && "All text files have been generated successfully."}
            {textFilesStatus === "Failed" && "There was an error generating text files."}
          </p>
        </div>
        
        {/* Podcast Status Card */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Podcast Status</h4>
            {getPodcastBadge()}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {!podcastStatus && "Podcast assets generation has not been started."}
            {podcastStatus === "Pending" && "Podcast assets generation is queued."}
            {podcastStatus === "Processing" && "Podcast assets are being generated."}
            {podcastStatus === "Completed" && "All podcast assets have been generated."}
            {podcastStatus === "Ready to Publish" && "Podcast is ready to be published to Podbean."}
            {podcastStatus === "Failed" && "There was an error generating podcast assets."}
          </p>
        </div>
      </div>
      
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshStatus}
          disabled={isRefreshing}
          className="text-xs"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh Status
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
