import { Music, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EpisodeAssetsProps {
  podcastStatus: string | null;
  isScriptGenerated: boolean;
  onGenerateAssets: () => void;
  assetLinks: Record<string, string | null>;
}

export function EpisodeAssetsSection({ 
  podcastStatus, 
  isScriptGenerated,
  onGenerateAssets,
  assetLinks = {}
}: EpisodeAssetsProps) {
  const assetTypes = [
    { id: 1, name: "Show Notes", key: "show_notes", icon: FileText },
    { id: 2, name: "Episode Intro Audio File", key: "intro_audio", icon: Music },
    { id: 3, name: "Master Audio File", key: "master_audio", icon: Music }
  ];

  // Helper function to check if a link is valid
  const isValidLink = (link: string | null): boolean => {
    return link !== null && link !== undefined && link.trim() !== '';
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Episode Assets</h3>
        <Button 
          onClick={onGenerateAssets}
          disabled={!isScriptGenerated}
          size="sm"
        >
          Generate Episode Assets
        </Button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <ul className="divide-y divide-gray-200 dark:divide-gray-600">
          {assetTypes.map((asset) => {
            const Icon = asset.icon;
            return (
              <li key={asset.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Icon className={`w-4 h-4 mr-2 ${
                      isValidLink(assetLinks[asset.key])
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-gray-400 dark:text-gray-500"
                    }`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{asset.name}</span>
                  </div>
                  {isValidLink(assetLinks[asset.key]) ? (
                    <a 
                      href={assetLinks[asset.key] || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {asset.key.includes('audio') ? 'View Only' : 'View or Update'}
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-gray-400 dark:text-gray-500 cursor-not-allowed">
                      {asset.key.includes('audio') ? 'View Only' : 'View or Update'}
                    </span>
                  )}
                </div>
              </li>
            )}
          )}
        </ul>
      </div>
    </div>
  );
}
