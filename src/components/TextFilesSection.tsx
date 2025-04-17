import { FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TextFilesProps {
  textFilesStatus: string | null;
  isScriptGenerated: boolean;
  onGenerateTextFiles: () => void;
  textFileLinks: Record<string, string | null>;
}

export function TextFilesSection({ 
  textFilesStatus, 
  isScriptGenerated,
  onGenerateTextFiles,
  textFileLinks = {}
}: TextFilesProps) {
  const textFileTypes = [
    { id: 1, name: "Episode Titles", key: "episode_titles" },
    { id: 2, name: "Episode Description", key: "episode_description" },
    { id: 3, name: "Episode Intro Transcript", key: "episode_intro_transcript" },
    { id: 4, name: "LinkedIn Post Copy", key: "linkedin_post" },
    { id: 5, name: "X Post Copy", key: "x_post" },
    { id: 6, name: "Podcast Excerpt", key: "podcast_excerpt" }
  ];

  // Helper function to check if a link is valid
  const isValidLink = (link: string | null): boolean => {
    return link !== null && link !== undefined && link.trim() !== '';
  };

  // Determine status badge color and text
  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    let bgColor = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100";
    let icon = null;
    
    if (status === "Pending") {
      bgColor = "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
    } else if (status === "Processing") {
      bgColor = "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
      icon = <RefreshCw className="w-3 h-3 mr-1 animate-spin" />;
    } else if (status === "Completed") {
      bgColor = "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
    } else if (status === "Failed") {
      bgColor = "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {icon}
        {status}
      </span>
    );
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Text Files</h3>
        <div className="flex items-center gap-4">
          {textFilesStatus && (
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2 text-gray-900 dark:text-white">Status:</span>
              {getStatusBadge(textFilesStatus)}
            </div>
          )}
          <Button 
            onClick={onGenerateTextFiles}
            disabled={!isScriptGenerated}
            size="sm"
          >
            Generate Text Files
          </Button>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <ul className="divide-y divide-gray-200 dark:divide-gray-600">
          {textFileTypes.map((file) => (
            <li key={file.id} className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className={`w-4 h-4 mr-2 ${
                    isValidLink(textFileLinks[file.key])
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-gray-400 dark:text-gray-500"
                  }`} />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</span>
                </div>
                {isValidLink(textFileLinks[file.key]) ? (
                  <a 
                    href={textFileLinks[file.key] || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    View or Update
                  </a>
                ) : (
                  <span className="text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed">
                    View or Update
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
