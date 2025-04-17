interface ProcessingStatusBannerProps {
  status: string | null;
}

export function ProcessingStatusBanner({ status }: ProcessingStatusBannerProps) {
  if (!status) return null;
  
  return (
    <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
        {status}
      </p>
    </div>
  );
}
