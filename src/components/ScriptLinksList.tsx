import { FileText } from "lucide-react";

interface ScriptLinksListProps {
  scriptLinks: {
    episode_interview_script_1: string | null;
    episode_interview_script_2: string | null;
    episode_interview_script_3: string | null;
    episode_interview_script_4: string | null;
    episode_interview_full_script?: string | null;
    episode_interview_file?: string | null;
  };
  isScriptGenerated: boolean;
}

export function ScriptLinksList({ scriptLinks, isScriptGenerated }: ScriptLinksListProps) {
  // Helper function to check if a link is valid
  const isValidLink = (link: string | null): boolean => {
    return link !== null && link !== undefined && link.trim() !== '';
  };

  const scriptTypes = [
    { id: 1, name: "Script #1", key: "episode_interview_script_1" },
    { id: 2, name: "Script #2", key: "episode_interview_script_2" },
    { id: 3, name: "Script #3", key: "episode_interview_script_3" },
    { id: 4, name: "Script #4", key: "episode_interview_script_4" },
    { id: 5, name: "Full Script", key: "episode_interview_full_script" },
    { id: 6, name: "Interview File", key: "episode_interview_file" }
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <ul className="divide-y divide-gray-200 dark:divide-gray-600">
        {scriptTypes.map((script) => (
          <li key={script.id} className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className={`w-4 h-4 mr-2 ${
                  isValidLink(scriptLinks[script.key as keyof typeof scriptLinks])
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-gray-400 dark:text-gray-500"
                }`} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{script.name}</span>
              </div>
              {isValidLink(scriptLinks[script.key as keyof typeof scriptLinks]) ? (
                <a 
                  href={scriptLinks[script.key as keyof typeof scriptLinks] || '#'} 
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
  );
}
