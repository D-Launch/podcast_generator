import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EpisodeNameInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
}

export function EpisodeNameInput({ 
  value, 
  onChange, 
  error, 
  disabled = false 
}: EpisodeNameInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="episodeName">Episode Interview File Name</Label>
      <Input
        id="episodeName"
        placeholder="Enter episode name"
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
