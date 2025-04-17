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

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Text Files</h3>
        <Button 
          onClick={onGenerateTextFiles}
          disabled={!isScriptGenerated}
          size="sm"
        >
          Generate Text Files
        </Button>
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
