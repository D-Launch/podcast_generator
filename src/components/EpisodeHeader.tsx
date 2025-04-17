interface EpisodeHeaderProps {
  episodeName: string | null;
}

export function EpisodeHeader({ episodeName }: EpisodeHeaderProps) {
  // Only show the viewing scripts header when a valid episode is selected
  if (!episodeName || episodeName.trim() === '') return null;
  
  return (
    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300">
        Viewing Scripts for: {episodeName}
      </h3>
      <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
        You can view the scripts below or create a new episode using the form.
      </p>
    </div>
  );
}
