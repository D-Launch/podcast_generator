# Podcast Form Refactoring Plan

## Current Issues
- The component is over 1300 lines long
- Multiple responsibilities mixed together
- Complex state management spread throughout the component
- Repeated logic in multiple useEffect hooks
- Callback functions defined inside the component that could be extracted

## Proposed Component Breakdown

### 1. Custom Hooks
- `useScriptStatus` - Manage script status, text files status, and podcast status
- `useEpisodeSubmission` - Handle form submission, webhook calls, and response processing
- `useScriptPolling` - Manage the polling mechanism for checking new rows
- `useScriptLinks` - Manage script links and their state

### 2. Component Breakdown
- `PodcastForm` (main container) - Orchestrates the other components
- `EpisodeNameInput` - Episode name input field and validation
- `PdfFileUpload` - File upload component with preview
- `ScriptStatusDisplay` - Display script, text files, and podcast statuses
- `ScriptLinksList` - Display the list of script links
- `ProcessingStatusBanner` - Show processing status messages
- `AudioGenerationButton` - Button to generate audio with approval dialog

### 3. Utility Functions
- `processWebhookResponse` - Process webhook responses
- `checkForNewRow` - Check for new rows in the database
- `isValidScriptLink` - Validate script links
- `clearPdfFile` - Clear the PDF file input

## Implementation Strategy
1. Extract custom hooks first
2. Create utility functions
3. Break down the component into smaller components
4. Update the main component to use the new components and hooks

## Benefits
- Improved code readability
- Better separation of concerns
- Easier maintenance and testing
- Reusable components and hooks
- Reduced cognitive load when working with the codebase
