# Audio Generation Process

When you click the "Generate Audio" button in the application, the following process occurs:

1. The button triggers the `handleApproveScripts()` function in the PodcastForm component
2. This opens a confirmation dialog (`ScriptApprovalDialog`)
3. When confirmed, it calls the `approveScripts()` function from the `useScriptStatus` hook
4. The function updates the script status to "Approved" in the Supabase database
5. This status change triggers the audio generation process on the backend

## Technical Flow:

1. The `AudioGenerationButton` component is disabled until:
   - Scripts have been generated (`isScriptGenerated` is true)
   - Script #4 (Summary) is available (`hasScript4` is true)
   - The script status is not already "Approved"

2. When approved, the backend workflow is triggered to:
   - Process the approved scripts
   - Generate audio files using text-to-speech technology
   - Update the database with the audio file links

3. The UI shows "Audio Generation In Progress" while processing

The audio generation itself happens on the backend server after approval, not directly in the browser.
