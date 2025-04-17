import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ScriptLinks } from './useScriptLinks';

// Maximum time to wait for a response (in milliseconds) - 2 minutes
const MAX_WAIT_TIME = 2 * 60 * 1000;

export interface FormValues {
  episodeName: string;
  pdfFile: File;
}

export function useEpisodeSubmission() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  
  // Store form data for retrying
  const lastSubmittedData = useRef<FormValues | null>(null);
  
  // Store the timestamp when the form was submitted
  const submissionTimestamp = useRef<number | null>(null);
  
  // Store the current episode name for notifications
  const currentEpisodeName = useRef<string | null>(null);
  
  // Store the current episode ID for checking script4 value
  const currentEpisodeId = useRef<string | null>(null);
  
  // Interval for checking script4 value
  const script4CheckIntervalRef = useRef<number | null>(null);
  
  // Maximum wait timeout reference
  const maxWaitTimeoutRef = useRef<number | null>(null);
  
  // Track if we've already found a matching record
  const foundMatchingRecord = useRef<boolean>(false);
  
  // Flag to track if we're checking for existing records
  const isCheckingExistingRecords = useRef<boolean>(false);
  
  // Flag to track if we need to clear the PDF file
  const shouldClearPdfFile = useRef<boolean>(false);

  // Process webhook response
  const processWebhookResponse = (data: any, currentEpisode: string | null) => {
    console.log("Processing webhook response:", data);
    
    try {
      // Handle array response (from the webhook)
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        
        // Check if this is for our current episode
        if (item.episode_interview_file_name === currentEpisode) {
          // Mark that we've found a matching record
          foundMatchingRecord.current = true;
          
          // Update script links
          const newScriptLinks = {
            episode_interview_script_1: item.episode_interview_script_1 || null,
            episode_interview_script_2: item.episode_interview_script_2 || null,
            episode_interview_script_3: item.episode_interview_script_3 || null,
            episode_interview_script_4: item.episode_interview_script_4 || null,
            episode_interview_full_script: item.episode_interview_full_script || null,
            episode_interview_file: item.episode_interview_file || null
          };
          
          // Check if Script #1 is available but not Script #4
          const hasScript1 = !!item.episode_interview_script_1;
          const hasScript4 = !!item.episode_interview_script_4;
          
          return {
            success: true,
            scriptLinks: newScriptLinks,
            hasAnyScript: hasScript1 || hasScript4,
            hasScript1,
            hasScript4,
            scriptStatus: item.episode_interview_script_status,
            textFilesStatus: item.episode_text_files_status,
            podcastStatus: item.podcast_status
          };
        }
      }
      
      return { success: false };
    } catch (error) {
      console.error("Error processing webhook response:", error);
      return { success: false, error };
    }
  };

  // Check for existing records with the same episode name
  const checkForExistingRecords = async (episodeName: string) => {
    try {
      const { data, error } = await supabase
        .from('autoworkflow')
        .select('id, created_at, episode_interview_script_1, episode_interview_script_2, episode_interview_script_3, episode_interview_script_4, episode_interview_full_script, episode_interview_file, episode_interview_script_status, episode_text_files_status, podcast_status')
        .eq('episode_interview_file_name', episodeName);
      
      if (error) {
        console.error('Error checking for existing records:', error);
        return { success: false, error };
      }
      
      if (data && data.length > 0) {
        console.log('Found existing records with the same episode name:', data);
        
        // Sort by created_at to get the most recent record
        const sortedRecords = [...data].sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA; // Sort in descending order (newest first)
        });
        
        const mostRecentRecord = sortedRecords[0];
        
        // Mark that we've found a matching record
        foundMatchingRecord.current = true;
        
        // Store the record ID
        currentEpisodeId.current = mostRecentRecord.id;
        
        // Create script links object
        const scriptLinks = {
          episode_interview_script_1: mostRecentRecord.episode_interview_script_1 || null,
          episode_interview_script_2: mostRecentRecord.episode_interview_script_2 || null,
          episode_interview_script_3: mostRecentRecord.episode_interview_script_3 || null,
          episode_interview_script_4: mostRecentRecord.episode_interview_script_4 || null,
          episode_interview_full_script: mostRecentRecord.episode_interview_full_script || null,
          episode_interview_file: mostRecentRecord.episode_interview_file || null
        };
        
        // Check if any script exists
        const hasAnyScript = mostRecentRecord.episode_interview_script_1 || 
                            mostRecentRecord.episode_interview_script_2 || 
                            mostRecentRecord.episode_interview_script_3 || 
                            mostRecentRecord.episode_interview_script_4;
        
        // Check if Script #1 and Script #4 are available
        const hasScript1 = !!mostRecentRecord.episode_interview_script_1;
        const hasScript4 = !!mostRecentRecord.episode_interview_script_4;
        
        return {
          success: true,
          exists: true,
          record: mostRecentRecord,
          scriptLinks,
          hasAnyScript: !!hasAnyScript,
          hasScript1,
          hasScript4
        };
      }
      
      return { success: true, exists: false };
    } catch (err) {
      console.error('Error checking for existing records:', err);
      return { success: false, error: err };
    }
  };

  // Check for new row in the database
  const checkForNewRow = async (episodeName: string | null) => {
    if (!episodeName || !isSubmitting || foundMatchingRecord.current || isCheckingExistingRecords.current) {
      return { success: false, reason: 'Invalid state for checking new row' };
    }
    
    // Set the checking flag to prevent concurrent checks
    isCheckingExistingRecords.current = true;
    
    try {
      console.log(`Checking for new row with episode name: ${episodeName}`);
      
      // Query the database for records with the current episode name
      const { data, error } = await supabase
        .from('autoworkflow')
        .select('id, created_at, episode_interview_file_name, episode_interview_script_1, episode_interview_script_2, episode_interview_script_3, episode_interview_script_4, episode_interview_full_script, episode_interview_file, episode_interview_script_status, episode_text_files_status, podcast_status')
        .eq('episode_interview_file_name', episodeName);
      
      if (error) {
        console.error('Error checking for new row:', error);
        isCheckingExistingRecords.current = false;
        return { success: false, error };
      }
      
      // If we found matching records
      if (data && data.length > 0) {
        console.log('Found matching records:', data);
        
        // Sort by created_at to get the most recent record
        const sortedRecords = [...data].sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA; // Sort in descending order (newest first)
        });
        
        const mostRecentRecord = sortedRecords[0];
        
        console.log('Found record for current episode:', mostRecentRecord);
        
        // Mark that we've found a matching record
        foundMatchingRecord.current = true;
        
        // Store the record ID
        currentEpisodeId.current = mostRecentRecord.id;
        
        // Create script links object
        const scriptLinks = {
          episode_interview_script_1: mostRecentRecord.episode_interview_script_1 || null,
          episode_interview_script_2: mostRecentRecord.episode_interview_script_2 || null,
          episode_interview_script_3: mostRecentRecord.episode_interview_script_3 || null,
          episode_interview_script_4: mostRecentRecord.episode_interview_script_4 || null,
          episode_interview_full_script: mostRecentRecord.episode_interview_full_script || null,
          episode_interview_file: mostRecentRecord.episode_interview_file || null
        };
        
        // Check if any script exists
        const hasAnyScript = mostRecentRecord.episode_interview_script_1 || 
                            mostRecentRecord.episode_interview_script_2 || 
                            mostRecentRecord.episode_interview_script_3 || 
                            mostRecentRecord.episode_interview_script_4;
        
        // Check if Script #1 and Script #4 are available
        const hasScript1 = !!mostRecentRecord.episode_interview_script_1;
        const hasScript4 = !!mostRecentRecord.episode_interview_script_4;
        
        return {
          success: true,
          record: mostRecentRecord,
          scriptLinks,
          hasAnyScript: !!hasAnyScript,
          hasScript1,
          hasScript4
        };
      }
      
      return { success: true, found: false };
    } catch (err) {
      console.error('Error in checkForNewRow:', err);
      return { success: false, error: err };
    } finally {
      // Reset the checking flag
      isCheckingExistingRecords.current = false;
    }
  };

  // Submit form data to webhook
  const submitFormData = async (data: FormValues, onSuccess: (scriptLinks: ScriptLinks) => void) => {
    console.log("Form submitted");
    lastSubmittedData.current = data;
    
    // Store the current episode name for notifications
    currentEpisodeName.current = data.episodeName;
    
    // Reset the foundMatchingRecord flag
    foundMatchingRecord.current = false;
    
    // Set loading state
    setIsSubmitting(true);
    
    // Show processing toast
    toast({
      title: "Processing Started",
      description: "Your request is being processed. This will take a few minutes to complete.",
      variant: "default",
    });
    
    // Set the submission timestamp
    submissionTimestamp.current = Date.now();
    console.log(`Setting submission timestamp: ${submissionTimestamp.current}`);
    
    // Check if there's already a record with this episode name
    const existingRecordsResult = await checkForExistingRecords(data.episodeName);
    
    if (existingRecordsResult.success && existingRecordsResult.exists) {
      // We found an existing record, use it
      setIsSubmitting(false);
      shouldClearPdfFile.current = true;
      
      // Clear the script4 check interval
      if (script4CheckIntervalRef.current !== null) {
        window.clearInterval(script4CheckIntervalRef.current);
        script4CheckIntervalRef.current = null;
      }
      
      // Clear the max wait timeout
      if (maxWaitTimeoutRef.current !== null) {
        window.clearTimeout(maxWaitTimeoutRef.current);
        maxWaitTimeoutRef.current = null;
      }
      
      // Call the success callback with the script links
      if (existingRecordsResult.scriptLinks) {
        onSuccess(existingRecordsResult.scriptLinks);
      }
      
      // Show notification
      toast({
        title: "Scripts Found!",
        description: `Existing scripts for "${data.episodeName}" have been loaded.`,
        variant: "default",
      });
      
      return {
        success: true,
        existingRecord: true,
        record: existingRecordsResult.record,
        scriptLinks: existingRecordsResult.scriptLinks,
        hasAnyScript: existingRecordsResult.hasAnyScript,
        hasScript1: existingRecordsResult.hasScript1,
        hasScript4: existingRecordsResult.hasScript4
      };
    }
    
    // Set up a timeout to stop waiting after MAX_WAIT_TIME
    if (maxWaitTimeoutRef.current !== null) {
      window.clearTimeout(maxWaitTimeoutRef.current);
    }
    
    maxWaitTimeoutRef.current = window.setTimeout(() => {
      if (isSubmitting) {
        console.log(`Maximum wait time of ${MAX_WAIT_TIME}ms exceeded. Stopping loading state.`);
        
        // Stop the loading state
        setIsSubmitting(false);
        shouldClearPdfFile.current = true;
        
        // Clear the script4 check interval
        if (script4CheckIntervalRef.current !== null) {
          window.clearInterval(script4CheckIntervalRef.current);
          script4CheckIntervalRef.current = null;
        }
        
        // Show notification
        toast({
          title: "Processing Timeout",
          description: "The request is taking longer than expected. Please check the episodes list for your submission.",
          variant: "destructive",
        });
      }
    }, MAX_WAIT_TIME);
    
    // Create FormData
    const formData = new FormData();
    formData.append("episodeName", data.episodeName);
    formData.append("pdfFile", data.pdfFile);
    
    console.log("Submitting form to webhook");
    console.log("Episode name:", data.episodeName);
    console.log("PDF file name:", data.pdfFile.name);
    console.log("PDF file size:", data.pdfFile.size, "bytes");
    console.log("PDF file type:", data.pdfFile.type);
    
    // Send the webhook request
    try {
      // Webhook URL
      const webhookUrl = "https://d-launch.app.n8n.cloud/webhook-test/a662a23d-ca8c-499c-8524-a1292fb55950";
      
      // Use fetch with proper headers for binary file upload
      const response = await fetch(webhookUrl, {
        method: "POST",
        body: formData,
        // No need to set Content-Type header as it will be automatically set with the boundary
      });
      
      console.log("Webhook response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Could not read error response");
        console.error(`Server responded with status ${response.status}: ${response.statusText}. Details: ${errorText}`);
        
        // Just log the error - we'll continue waiting for new rows
        setLastError(`Error: Server responded with status ${response.status}`);
        setDetailedError(errorText);
      } else {
        // Try to parse the response as JSON
        try {
          const responseData = await response.json();
          console.log("Response data:", responseData);
          
          // Process the webhook response
          const processResult = processWebhookResponse(responseData, currentEpisodeName.current);
          
          // If we processed the response successfully, we can stop checking for new rows
          if (processResult.success) {
            // Clear the script4 check interval
            if (script4CheckIntervalRef.current !== null) {
              window.clearInterval(script4CheckIntervalRef.current);
              script4CheckIntervalRef.current = null;
            }
            
            // Clear the max wait timeout
            if (maxWaitTimeoutRef.current !== null) {
              window.clearTimeout(maxWaitTimeoutRef.current);
              maxWaitTimeoutRef.current = null;
            }
            
            // Call the success callback with the script links
            if (processResult.scriptLinks) {
              onSuccess(processResult.scriptLinks);
            }
            
            return processResult;
          }
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          setLastError("Error parsing response");
          setDetailedError(parseError instanceof Error ? parseError.message : "Unknown error");
        }
      }
      
      // Force an immediate check for new rows after webhook response
      return await checkForNewRow(currentEpisodeName.current);
      
    } catch (error) {
      console.error("Error submitting form:", error);
      
      let errorMessage = "An error occurred while processing your request.";
      let detailedMsg = "";
      
      if (error instanceof Error) {
        errorMessage = error.message;
        detailedMsg = `Error type: ${error.name}. Stack trace: ${error.stack || 'Not available'}`;
      }
      
      setLastError(`Error: ${errorMessage}`);
      setDetailedError(detailedMsg);
      
      // Log the error but don't show it to the user - we'll continue waiting for new rows
      console.error("Webhook error:", errorMessage);
      console.error("Detailed error:", detailedMsg);
      
      // Force an immediate check for new rows after error
      return await checkForNewRow(currentEpisodeName.current);
    }
  };

  // Clean up resources
  const cleanupResources = () => {
    // Clear the script4 check interval
    if (script4CheckIntervalRef.current !== null) {
      window.clearInterval(script4CheckIntervalRef.current);
      script4CheckIntervalRef.current = null;
    }
    
    // Clear the max wait timeout
    if (maxWaitTimeoutRef.current !== null) {
      window.clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = null;
    }
  };

  return {
    isSubmitting,
    setIsSubmitting,
    lastError,
    detailedError,
    currentEpisodeName,
    currentEpisodeId,
    foundMatchingRecord,
    shouldClearPdfFile,
    script4CheckIntervalRef,
    maxWaitTimeoutRef,
    submitFormData,
    checkForNewRow,
    processWebhookResponse,
    cleanupResources
  };
}
