import { FileText } from "lucide-react";
import { isValidScriptLink } from "@/hooks/useScriptLinks";

interface ScriptType {
  id: number;
  name: string;
  responseKey: string;
  readOnly?: boolean;
}

interface ScriptLinksListProps {
  scriptLinks: Record<string, string | null>;
  isScriptGenerated: boolean;
}

export function ScriptLinksList({ scriptLinks, isScriptGenerated }: ScriptLinksListProps) {
  const scriptTypes: ScriptType[] = [
    { id: 1, name: "Script #1 - 3 Key Points", responseKey: "episode_interview_script_1" },
    { id: 2, name: "Script #2 - What it Means", responseKey: "episode_interview_script_2" },
    { id: 3, name: "Script #3 - Practical Application", responseKey: "episode_interview_script_3" },
    { id: 4, name: "Script #4 - Summary", responseKey: "episode_interview_script_4" },
    { id: 5, name: "Episode Interview Full Script", responseKey: "episode_interview_full_script", readOnly: true },
    { id: 6, name: "Episode Interview File", responseKey: "episode_interview_file", readOnly: true }
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
      <ul className="divide-y divide-gray-200 dark:divide-gray-600">
        {scriptTypes.map((script) => (
          <li key={script.id} className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className={`w-4 h-4 mr-2 ${
                  isScriptGenerated && isValidScriptLink(scriptLinks[script.responseKey])
                    ? "text-blue-600 dark:text-blue-400" 
                    : "text-gray-400 dark:text-gray-500"
                }`} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{script.name}</span>
              </div>
              {isScriptGenerated && isValidScriptLink(scriptLinks[script.responseKey]) ? (
                <a 
                  href={scriptLinks[script.responseKey] || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {script.readOnly ? "View (Read Only)" : "View or Update"}
                </a>
              ) : (
                <span className="text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed">
                  {script.readOnly ? "View (Read Only)" : "View or Update"}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
