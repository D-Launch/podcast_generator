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
  // Render status badges for text files and podcast
  const renderStatusBadge = (status: string | null, type: string) => {
    if (!status) return null;
    
    let bgColor = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    let icon = <AlertCircle className="w-3 h-3 mr-1" />;
    
    if (status === "Pending") {
      bgColor = "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
      icon = <AlertCircle className="w-3 h-3 mr-1" />;
    } else if (status === "Processing") {
      bgColor = "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
      icon = <Loader2 className="w-3 h-3 mr-1 animate-spin" />;
    } else if (status === "Completed") {
      bgColor = "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
      icon = <CheckCircle className="w-3 h-3 mr-1" />;
    } else if (status === "Failed") {
      bgColor = "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
      icon = <AlertCircle className="w-3 h-3 mr-1" />;
    }
    
    return (
      <div className="flex items-center mt-1">
        <span className="text-sm font-medium mr-2">{type}:</span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
          {icon}
          {status}
        </span>
      </div>
    );
  };

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

  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        <span className="text-sm font-medium mr-2">Script Status:</span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${scriptBadgeColor}`}>
          {scriptIcon}
          {scriptStatus}
        </span>
      </div>
      
      {/* Show text files status if available */}
      {textFilesStatus && renderStatusBadge(textFilesStatus, "Text Files")}
      
      {/* Show podcast status if available */}
      {podcastStatus && renderStatusBadge(podcastStatus, "Podcast")}
    </div>
  );
}
