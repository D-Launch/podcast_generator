import { useState, useEffect } from "react";
import { Calendar, Clock, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PodbeanPublishingProps {
  podcastStatus: string | null;
  onPublishToPodbean: (data: PublishData) => void;
}

interface PublishData {
  coverArt: File | null;
  scheduledDate: string;
  unixTimestamp: number;
}

export function PodbeanPublishingSection({ 
  podcastStatus,
  onPublishToPodbean
}: PodbeanPublishingProps) {
  const [coverArt, setCoverArt] = useState<File | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [unixTimestamp, setUnixTimestamp] = useState<number>(0);
  const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);

  // Check if publishing is allowed
  const canPublish = 
    podcastStatus === "Ready to Publish" && 
    coverArt !== null && 
    scheduledDate !== "" && 
    unixTimestamp > 0;

  // Update Unix timestamp when scheduled date changes
  useEffect(() => {
    if (scheduledDate) {
      // Parse the date and set time to 10:00 AM MST
      const date = new Date(scheduledDate);
      
      // MST is UTC-7, so we set 17:00 UTC (10:00 AM MST)
      date.setUTCHours(17, 0, 0, 0);
      
      // Convert to Unix timestamp (seconds)
      const timestamp = Math.floor(date.getTime() / 1000);
      setUnixTimestamp(timestamp);
    } else {
      setUnixTimestamp(0);
    }
  }, [scheduledDate]);

  // Handle cover art upload
  const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverArt(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverArtPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle publish button click
  const handlePublish = () => {
    if (canPublish) {
      onPublishToPodbean({
        coverArt,
        scheduledDate,
        unixTimestamp
      });
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Podbean Publishing</h3>
        {podcastStatus && (
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2 text-gray-900 dark:text-white">Status:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              podcastStatus === "Ready to Publish" 
                ? "bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
            }`}>
              {podcastStatus}
            </span>
          </div>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cover Art Upload */}
          <div className="space-y-2">
            <Label htmlFor="coverArt" className="flex items-center text-gray-900 dark:text-white">
              <Image className="w-4 h-4 mr-2 text-gray-900 dark:text-white" />
              Episode Cover Art
            </Label>
            <div className="flex items-start space-x-4">
              <div className="flex-1">
                <Input 
                  id="coverArt" 
                  type="file" 
                  accept="image/*"
                  onChange={handleCoverArtChange}
                  className="w-full text-gray-900 dark:text-white cursor-pointer file:text-gray-900 dark:file:text-white file:cursor-pointer"
                />
                <style jsx global>{`
                  .dark input[type="file"]::file-selector-button {
                    color: white;
                  }
                `}</style>
              </div>
              {coverArtPreview && (
                <div className="w-20 h-20 rounded overflow-hidden border border-gray-200 dark:border-gray-600">
                  <img 
                    src={coverArtPreview} 
                    alt="Cover Art Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label htmlFor="scheduledDate" className="flex items-center text-gray-900 dark:text-white">
              <Calendar className="w-4 h-4 mr-2 text-gray-900 dark:text-white" />
              Scheduled Date
            </Label>
            <Input 
              id="scheduledDate" 
              type="date" 
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full text-gray-900 dark:text-white"
            />
            <style jsx global>{`
              .dark input[type="date"]::-webkit-calendar-picker-indicator {
                filter: invert(1);
              }
            `}</style>
          </div>

          {/* Unix Timestamp (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="unixTimestamp" className="flex items-center text-gray-900 dark:text-white">
              <Clock className="w-4 h-4 mr-2 text-gray-900 dark:text-white" />
              Unix Timestamp (10:00 AM MST)
            </Label>
            <Input 
              id="unixTimestamp" 
              type="text" 
              value={unixTimestamp > 0 ? unixTimestamp.toString() : ""}
              readOnly
              className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Publish Button */}
          <div className="flex items-end">
            <Button 
              onClick={handlePublish}
              disabled={!canPublish}
              className="w-full"
            >
              Publish to Podbean
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
