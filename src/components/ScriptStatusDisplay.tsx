import { CheckCircle, AlertCircle, Loader2, Music } from "lucide-react";

interface ScriptStatusDisplayProps {
  scriptStatus: "Approved" | "Pending" | "Audio Generated";
  textFilesStatus: string | null;
  podcastStatus: string | null;
}

export function ScriptStatusDisplay({ 
  scriptStatus, 
  textFilesStatus, 
  podcastStatus 
}: ScriptStatusDisplayProps) {
  // Determine script status badge color and icon
  let scriptBadgeColor = "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
  let scriptIcon = <AlertCircle className="w-3 h-3 mr-1" />;
  
  if (scriptStatus === "Approved") {
    scriptBadgeColor = "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
    scriptIcon = <CheckCircle className="w-3 h-3 mr-1" />;
  } else if (scriptStatus === "Audio Generated") {
    scriptBadgeColor = "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100";
    scriptIcon = <Music className="w-3 h-3 mr-1" />;
  }

  // Get badge for text files status
  const getTextFilesBadge = () => {
    if (!textFilesStatus) return null;
    
    let bgColor = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    let icon = <AlertCircle className="w-3 h-3 mr-1" />;
    
    if (textFilesStatus === "Pending") {
      bgColor = "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
      icon = <AlertCircle className="w-3 h-3 mr-1" />;
    } else if (textFilesStatus === "Processing") {
      bgColor = "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
      icon = <Loader2 className="w-3 h-3 mr-1 animate-spin" />;
    } else if (textFilesStatus === "Completed") {
      bgColor = "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      icon = <CheckCircle className="w-3 h-3 mr-1" />;
    } else if (textFilesStatus === "Failed") {
      bgColor = "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
      icon = <AlertCircle className="w-3 h-3 mr-1" />;
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
    if (!podcastStatus) return null;
    
    let bgColor = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    let icon = <AlertCircle className="w-3 h-3 mr-1" />;
    
    if (podcastStatus === "Pending") {
      bgColor = "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
      icon = <AlertCircle className="w-3 h-3 mr-1" />;
    } else if (podcastStatus === "Processing") {
      bgColor = "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
      icon = <Loader2 className="w-3 h-3 mr-1 animate-spin" />;
    } else if (podcastStatus === "Completed") {
      bgColor = "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      icon = <CheckCircle className="w-3 h-3 mr-1" />;
    } else if (podcastStatus === "Ready to Publish") {
      bgColor = "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100";
      icon = <Music className="w-3 h-3 mr-1" />;
    } else if (podcastStatus === "Failed") {
      bgColor = "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
      icon = <AlertCircle className="w-3 h-3 mr-1" />;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {icon}
        {podcastStatus}
      </span>
    );
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center">
        <span className="text-sm font-medium mr-2 text-gray-900 dark:text-white">Script Status:</span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${scriptBadgeColor}`}>
          {scriptIcon}
          {scriptStatus}
        </span>
      </div>
      
      {/* Always show Text Files Status row, even if null */}
      <div className="flex items-center">
        <span className="text-sm font-medium mr-2 text-gray-900 dark:text-white">Text Files Status:</span>
        {getTextFilesBadge() || (
          <span className="text-sm text-gray-500 dark:text-gray-400">Not started</span>
        )}
      </div>
      
      {/* Always show Podcast Status row, even if null */}
      <div className="flex items-center">
        <span className="text-sm font-medium mr-2 text-gray-900 dark:text-white">Podcast Status:</span>
        {getPodcastBadge() || (
          <span className="text-sm text-gray-500 dark:text-gray-400">Not started</span>
        )}
      </div>
    </div>
  );
}
