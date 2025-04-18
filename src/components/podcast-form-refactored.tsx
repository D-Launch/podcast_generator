import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ScriptApprovalDialog } from "@/components/script-approval-dialog";
import { supabase } from "@/lib/supabase";

// Import custom hooks
import { useScriptLinks, isValidScriptLink } from "@/hooks/useScriptLinks";
import { useScriptStatus } from "@/hooks/useScriptStatus";
import { useEpisodeSubmission, FormValues } from "@/hooks/useEpisodeSubmission";
import { useTextFilesGeneration } from "@/hooks/useTextFilesGeneration";
import { useEpisodeAssetsGeneration } from "@/hooks/useEpisodeAssetsGeneration";
import { usePodbeanPublishing } from "@/hooks/usePodbeanPublishing";
import { useAudioGeneration } from "@/hooks/useAudioGeneration";

// Import components
import { EpisodeHeader } from "@/components/EpisodeHeader";
import { ProcessingStatusBanner } from "@/components/ProcessingStatusBanner";
import { EpisodeNameInput } from "@/components/EpisodeNameInput";
import { PdfFileUpload } from "@/components/PdfFileUpload";
import { ScriptLinksList } from "@/components/ScriptLinksList";
import { AudioGenerationButton } from "@/components/AudioGenerationButton";
import { TextFilesSection } from "@/components/TextFilesSection";
import { EpisodeAssetsSection } from "@/components/EpisodeAssetsSection";
import { PodbeanPublishingSection } from "@/components/PodbeanPublishingSection";

const formSchema = z.object({
  episodeName: z.string().min(3, {
    message: "Episode name must be at least 3 characters.",
  }),
  pdfFile: z.instanceof(File).refine(
    (file) => file.size > 0 && file.type === "application/pdf",
    {
      message: "Please upload a valid PDF file.",
    }
  ),
});

// Interface for script links passed from parent
interface ScriptLinks {
  episode_interview_script_1: string | null;
  episode_interview_script_2: string | null;
  episode_interview_script_3: string | null;
  episode_interview_script_4: string | null;
  episode_interview_full_script?: string | null;
  episode_interview_file?: string | null;
  episode_interview_script_status?: string;
  episode_text_files_status?: string;
  podcast_status?: string;
}

interface PodcastFormProps {
  selectedScriptLinks?: ScriptLinks | null;
  selectedEpisodeName?: string | null;
}

export function PodcastForm({ selectedScriptLinks, selectedEpisodeName }: PodcastFormProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [episodeDbId, setEpisodeDbId] = useState<string | null>(null);
  
  // File input reference
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Use custom hooks
  const {
    scriptLinks,
    setScriptLinks,
    isScriptGenerated,
    setIsScriptGenerated,
    hasScript1,
    hasScript4,
    isRefreshing,
    refreshScriptLinks
  } = useScriptLinks(selectedScriptLinks, selectedEpisodeName);
  
  const {
    scriptStatus,
    setScriptStatus,
    textFilesStatus,
    setTextFilesStatus,
    podcastStatus,
    setPodcastStatus,
    processingStatus,
    setProcessingStatus,
    approveScripts,
    updateProcessingStatus
  } = useScriptStatus({
    initialScriptStatus: selectedScriptLinks?.episode_interview_script_status,
    initialTextFilesStatus: selectedScriptLinks?.episode_text_files_status,
    initialPodcastStatus: selectedScriptLinks?.podcast_status
  });
  
  const {
    isSubmitting,
    setIsSubmitting,
    currentEpisodeName,
    currentEpisodeId,
    shouldClearPdfFile,
    submitFormData,
    cleanupResources,
    resetCurrentEpisodeId
  } = useEpisodeSubmission();

  // New hooks for the additional sections
  const {
    isGeneratingTextFiles,
    textFileLinks,
    generateTextFiles,
    updateTextFileLinks
  } = useTextFilesGeneration();

  const {
    isGeneratingAssets,
    assetLinks,
    generateEpisodeAssets,
    updateAssetLinks
  } = useEpisodeAssetsGeneration();

  const {
    isPublishing,
    publishToPodbean
  } = usePodbeanPublishing();

  const {
    isGeneratingAudio,
    generateAudio
  } = useAudioGeneration();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      episodeName: "",
    }
  });

  // Reset currentEpisodeId when no episode is selected
  useEffect(() => {
    if (!selectedEpisodeName) {
      console.log("No episode selected, resetting currentEpisodeId");
      resetCurrentEpisodeId();
      setEpisodeDbId(null);
    }
  }, [selectedEpisodeName, resetCurrentEpisodeId]);

  // Fetch the database ID for the selected episode
  useEffect(() => {
    const fetchEpisodeDbId = async () => {
      if (!selectedEpisodeName) {
        setEpisodeDbId(null);
        return;
      }
      
      try {
        console.log("PodcastForm: Fetching database ID for episode name:", selectedEpisodeName);
        
        const { data, error } = await supabase
          .from('autoworkflow')
          .select('id')
          .eq('episode_interview_file_name', selectedEpisodeName)
          .single();
        
        if (error) {
          console.error("PodcastForm: Error fetching database ID:", error);
          return;
        }
        
        if (data) {
          console.log("PodcastForm: Found database ID:", data.id);
          setEpisodeDbId(data.id);
          
          // Also update the currentEpisodeId ref
          if (currentEpisodeId.current !== data.id) {
            console.log("PodcastForm: Updating currentEpisodeId from", currentEpisodeId.current, "to", data.id);
            currentEpisodeId.current = data.id;
          }
        } else {
          console.log("PodcastForm: No database record found for episode name:", selectedEpisodeName);
        }
      } catch (err) {
        console.error("PodcastForm: Exception in fetchEpisodeDbId:", err);
      }
    };
    
    fetchEpisodeDbId();
  }, [selectedEpisodeName, currentEpisodeId]);

  // Set up automatic refreshing of episodes list and script links every second
  useEffect(() => {
    // Start the refresh interval
    const refreshInterval = window.setInterval(() => {
      // Dispatch a custom event to trigger refresh in EpisodesList component
      window.dispatchEvent(new CustomEvent('episodes-list-auto-refresh'));
      
      // Auto-refresh script links if we have an episode name
      if (currentEpisodeName.current) {
        refreshScriptLinks(currentEpisodeName.current).then(result => {
          if (result?.success && result.data) {
            // Update script status if available
            if (result.data.episode_interview_script_status) {
              setScriptStatus(result.data.episode_interview_script_status === "Approved" ? "Approved" : "Pending");
            }
            
            // Update new status fields
            if (result.data.episode_text_files_status) {
              setTextFilesStatus(result.data.episode_text_files_status);
            }
            
            if (result.data.podcast_status) {
              setPodcastStatus(result.data.podcast_status);
            }
          }
        });
      }
    }, 1000); // Refresh every second
    
    // Cleanup on unmount
    return () => {
      window.clearInterval(refreshInterval);
    };
  }, [refreshScriptLinks, setScriptStatus, setTextFilesStatus, setPodcastStatus, currentEpisodeName]);

  // Clean up intervals when component unmounts or submission state changes
  useEffect(() => {
    if (!isSubmitting) {
      // Clean up resources when submission ends
      cleanupResources();
      
      // If we should clear the PDF file, do it now
      if (shouldClearPdfFile.current) {
        clearPdfFile();
        shouldClearPdfFile.current = false;
      }
    }
    
    // Cleanup on unmount
    return () => {
      cleanupResources();
    };
  }, [isSubmitting, cleanupResources]);

  // Update processing status when script links change
  useEffect(() => {
    updateProcessingStatus(hasScript1, hasScript4, isSubmitting);
    
    // IMPORTANT: Make sure to stop the loading state when Script #4 is available
    if (isSubmitting && hasScript4) {
      setIsSubmitting(false);
      shouldClearPdfFile.current = true;
    }
  }, [scriptLinks, isSubmitting, hasScript1, hasScript4, updateProcessingStatus, setIsSubmitting]);

  // Update form when selectedScriptLinks changes
  useEffect(() => {
    if (selectedEpisodeName && selectedEpisodeName.trim() !== '') {
      setValue("episodeName", selectedEpisodeName);
    } else {
      setValue("episodeName", "");
    }
  }, [selectedEpisodeName, setValue]);

  // Set up subscription to listen for changes in the autoworkflow table
  useEffect(() => {
    // Subscribe to INSERT events
    const insertSubscription = supabase
      .channel('autoworkflow-inserts')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'autoworkflow' 
      }, (payload) => {
        console.log('New record created in Supabase:', payload);
        
        // Only process if we're currently submitting and have an episode name
        if (isSubmitting && currentEpisodeName.current) {
          const newRecord = payload.new as any;
          
          // Check if this is the record for our current episode
          if (newRecord.episode_interview_file_name === currentEpisodeName.current) {
            console.log('New record matches our current episode');
            
            // Update script links
            setScriptLinks({
              episode_interview_script_1: newRecord.episode_interview_script_1 || null,
              episode_interview_script_2: newRecord.episode_interview_script_2 || null,
              episode_interview_script_3: newRecord.episode_interview_script_3 || null,
              episode_interview_script_4: newRecord.episode_interview_script_4 || null,
              episode_interview_full_script: newRecord.episode_interview_full_script || null,
              episode_interview_file: newRecord.episode_interview_file || null
            });
            
            // Set script generated flag if any script exists
            const hasAnyScript = newRecord.episode_interview_script_1 || 
                                newRecord.episode_interview_script_2 || 
                                newRecord.episode_interview_script_3 || 
                                newRecord.episode_interview_script_4;
            
            setIsScriptGenerated(!!hasAnyScript);
            
            // Update script status if available
            if (newRecord.episode_interview_script_status) {
              setScriptStatus(newRecord.episode_interview_script_status === "Approved" ? "Approved" : "Pending");
            }
            
            // Update new status fields
            if (newRecord.episode_text_files_status) {
              setTextFilesStatus(newRecord.episode_text_files_status);
            }
            
            if (newRecord.podcast_status) {
              setPodcastStatus(newRecord.podcast_status);
            }
            
            // Check if Script #4 is available
            const hasScript4 = !!newRecord.episode_interview_script_4;
            
            if (hasScript4) {
              // Stop the loading state when all scripts are available
              setIsSubmitting(false);
              shouldClearPdfFile.current = true;
              
              // Show notification
              toast({
                title: "Success!",
                description: `Scripts for "${currentEpisodeName.current}" have been generated.`,
                variant: "default",
              });
            }
          }
        }
      })
      .subscribe();

    // Subscribe to UPDATE events
    const updateSubscription = supabase
      .channel('autoworkflow-updates')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'autoworkflow' 
      }, (payload) => {
        console.log('Record updated in Supabase:', payload);
        
        // Only process if we have an episode name
        if (currentEpisodeName.current) {
          const updatedRecord = payload.new as any;
          
          // Check if this is the record for our current episode
          if (updatedRecord.episode_interview_file_name === currentEpisodeName.current) {
            console.log('Updated record matches our current episode');
            
            // Update script links
            setScriptLinks({
              episode_interview_script_1: updatedRecord.episode_interview_script_1 || null,
              episode_interview_script_2: updatedRecord.episode_interview_script_2 || null,
              episode_interview_script_3: updatedRecord.episode_interview_script_3 || null,
              episode_interview_script_4: updatedRecord.episode_interview_script_4 || null,
              episode_interview_full_script: updatedRecord.episode_interview_full_script || null,
              episode_interview_file: updatedRecord.episode_interview_file || null
            });
            
            // Set script generated flag if any script exists
            const hasAnyScript = updatedRecord.episode_interview_script_1 || 
                                updatedRecord.episode_interview_script_2 || 
                                updatedRecord.episode_interview_script_3 || 
                                updatedRecord.episode_interview_script_4;
            
            setIsScriptGenerated(!!hasAnyScript);
            
            // Update script status if available
            if (updatedRecord.episode_interview_script_status) {
              setScriptStatus(updatedRecord.episode_interview_script_status === "Approved" ? "Approved" : "Pending");
            }
            
            // Update new status fields
            if (updatedRecord.episode_text_files_status) {
              setTextFilesStatus(updatedRecord.episode_text_files_status);
            }
            
            if (updatedRecord.podcast_status) {
              setPodcastStatus(updatedRecord.podcast_status);
            }
            
            // Check if Script #4 is available
            const hasScript4 = !!updatedRecord.episode_interview_script_4;
            
            if (hasScript4 && isSubmitting) {
              // Stop the loading state when all scripts are available
              setIsSubmitting(false);
              shouldClearPdfFile.current = true;
              
              // Show notification
              toast({
                title: "Success!",
                description: `Scripts for "${currentEpisodeName.current}" have been generated.`,
                variant: "default",
              });
            }
          }
        }
      })
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      insertSubscription.unsubscribe();
      updateSubscription.unsubscribe();
    };
  }, [isSubmitting, toast, currentEpisodeName, setScriptLinks, setIsScriptGenerated, setScriptStatus, setTextFilesStatus, setPodcastStatus, setIsSubmitting]);

  // Function to clear the PDF file
  const clearPdfFile = () => {
    console.log("Clearing PDF file");
    
    // Clear the selected file state
    setSelectedFile(null);
    
    // Reset the file input value using the ref
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Also try to reset using getElementById as a fallback
    const fileInput = document.getElementById('pdfFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const onSubmit = async (data: FormValues) => {
    // Use the submitFormData function from the custom hook
    const result = await submitFormData(data, (newScriptLinks) => {
      // Update script links when submission is successful
      setScriptLinks(newScriptLinks);
    });
    
    // If the submission was successful and we found an existing record
    if (result?.success && result.existingRecord) {
      // Update script status if available
      if (result.record?.episode_interview_script_status) {
        setScriptStatus(result.record.episode_interview_script_status === "Approved" ? "Approved" : "Pending");
      }
      
      // Update new status fields
      if (result.record?.episode_text_files_status) {
        setTextFilesStatus(result.record.episode_text_files_status);
      }
      
      if (result.record?.podcast_status) {
        setPodcastStatus(result.record.podcast_status);
      }
      
      // Set script generated flag
      setIsScriptGenerated(!!result.hasAnyScript);
    }
  };

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setValue("pdfFile", file);
  };

  const handleApproveScripts = () => {
    console.log("handleApproveScripts called");
    console.log("Current episode ID:", currentEpisodeId.current);
    console.log("Database ID:", episodeDbId);
    console.log("Episode Name:", selectedEpisodeName);
    
    // Use the database ID if available, otherwise fall back to currentEpisodeId
    const idToUse = episodeDbId || currentEpisodeId.current;
    
    if (!idToUse && selectedEpisodeName) {
      // If we don't have an ID but have the episode name, try to fetch the ID first
      console.log("No ID available, attempting to fetch from database before opening dialog");
      
      supabase
        .from('autoworkflow')
        .select('id')
        .eq('episode_interview_file_name', selectedEpisodeName)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching episode ID:", error);
            toast({
              title: "Error",
              description: "Could not find episode ID in database",
              variant: "destructive",
            });
            return;
          }
          
          if (data) {
            console.log("Successfully fetched ID:", data.id);
            setEpisodeDbId(data.id);
            currentEpisodeId.current = data.id;
            setIsApprovalDialogOpen(true);
          } else {
            console.error("No episode found with name:", selectedEpisodeName);
            toast({
              title: "Error",
              description: "Episode not found in database",
              variant: "destructive",
            });
          }
        });
    } else if (!idToUse && !selectedEpisodeName) {
      // No ID and no episode name
      console.error("Cannot approve scripts: No episode selected");
      toast({
        title: "Error",
        description: "Please select an episode first",
        variant: "destructive",
      });
    } else {
      // We have an ID, proceed with opening the dialog
      setIsApprovalDialogOpen(true);
    }
  };

  const confirmApproval = async () => {
    console.log("confirmApproval called");
    
    // Use the database ID if available, otherwise fall back to currentEpisodeId
    const idToUse = episodeDbId || currentEpisodeId.current;
    
    console.log("Using ID for approval:", idToUse);
    
    if (!idToUse) {
      console.error("No episode ID available for approval");
      toast({
        title: "Error",
        description: "No episode ID available",
        variant: "destructive",
      });
      setIsApprovalDialogOpen(false);
      return;
    }
    
    try {
      // First approve the scripts in the database
      const result = await approveScripts(idToUse);
      
      if (!result.success) {
        console.error("Failed to approve scripts:", result.error);
        toast({
          title: "Update Error",
          description: "Failed to update script status in the database.",
          variant: "destructive",
        });
        setIsApprovalDialogOpen(false);
        return;
      }
      
      console.log("Scripts approved successfully, now generating audio");
      
      // Then send the data to the webhook
      const audioResult = await generateAudio({
        id: idToUse,
        episodeName: selectedEpisodeName || "",
        scriptLinks: scriptLinks
      });
      
      if (!audioResult.success) {
        console.error("Failed to generate audio");
        toast({
          title: "Error",
          description: "Failed to start audio generation process.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Scripts Approved",
          description: "All scripts have been successfully approved. Audio generation has started.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error in approval process:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during the approval process.",
        variant: "destructive",
      });
    } finally {
      setIsApprovalDialogOpen(false);
    }
  };

  const cancelApproval = () => {
    setIsApprovalDialogOpen(false);
  };

  // Handler for generating text files
  const handleGenerateTextFiles = async () => {
    // Use the database ID if available, otherwise fall back to currentEpisodeId
    const idToUse = episodeDbId || currentEpisodeId.current;
    
    if (!idToUse) {
      console.error("No episode ID available for generating text files");
      toast({
        title: "Error",
        description: "No episode ID available",
        variant: "destructive",
      });
      return;
    }
    
    await generateTextFiles(idToUse, selectedEpisodeName || "");
  };

  // Handler for generating episode assets
  const handleGenerateEpisodeAssets = async () => {
    // Use the database ID if available, otherwise fall back to currentEpisodeId
    const idToUse = episodeDbId || currentEpisodeId.current;
    
    if (!idToUse) {
      console.error("No episode ID available for generating assets");
      toast({
        title: "Error",
        description: "No episode ID available",
        variant: "destructive",
      });
      return;
    }
    
    await generateEpisodeAssets(idToUse, selectedEpisodeName || "");
  };

  // Handler for publishing to Podbean
  const handlePublishToPodbean = async (publishData: any) => {
    // Use the database ID if available, otherwise fall back to currentEpisodeId
    const idToUse = episodeDbId || currentEpisodeId.current;
    
    if (!idToUse) {
      console.error("No episode ID available for publishing to Podbean");
      toast({
        title: "Error",
        description: "No episode ID available",
        variant: "destructive",
      });
      return;
    }
    
    await publishToPodbean(idToUse, selectedEpisodeName || "", publishData);
  };

  // Check if an episode is selected
  const isEpisodeSelected = selectedEpisodeName !== null && selectedEpisodeName !== undefined && selectedEpisodeName.trim() !== '';

  // Debug info
  console.log("PodcastForm render with:", {
    selectedEpisodeName,
    episodeDbId,
    currentEpisodeId: currentEpisodeId.current,
    scriptStatus,
    isScriptGenerated,
    hasScript4
  });

  return (
    <>
      {/* Episode Header */}
      <EpisodeHeader episodeName={selectedEpisodeName} />

      {/* Processing Status Banner */}
      <ProcessingStatusBanner status={processingStatus} />

      {/* Debug Info - Remove in production */}
      <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 text-xs rounded">
        <div>Episode Name: {selectedEpisodeName || 'null'}</div>
        <div>Database ID: {episodeDbId || 'null'}</div>
        <div>Current Episode ID: {currentEpisodeId.current || 'null'}</div>
        <div>Script Status: {scriptStatus}</div>
        <div>Has Script 4: {hasScript4 ? 'Yes' : 'No'}</div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Episode Name Input */}
        <EpisodeNameInput
          value={watch("episodeName")}
          onChange={(e) => setValue("episodeName", e.target.value)}
          error={errors.episodeName?.message}
          disabled={isEpisodeSelected}
        />
        
        {/* PDF File Upload */}
        <PdfFileUpload
          selectedFile={selectedFile}
          onChange={handleFileChange}
          error={errors.pdfFile?.message}
          disabled={isEpisodeSelected}
        />
        
        {/* Buttons Container */}
        <div className="flex gap-4">
          {/* Submit Button */}
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting || isEpisodeSelected}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Script...
              </>
            ) : (
              "Generate Script"
            )}
          </Button>
          
          {/* Audio Generation Button - Pass the episode name */}
          <AudioGenerationButton
            scriptStatus={scriptStatus}
            isScriptGenerated={isScriptGenerated}
            hasScript4={hasScript4}
            onClick={handleApproveScripts}
            isGeneratingAudio={isGeneratingAudio}
            episodeName={selectedEpisodeName}
          />
        </div>
      </form>

      {/* Scripts and Audio Section */}
      <div className="mt-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Scripts and Audio</h3>
        </div>

        {/* Script Links List */}
        <ScriptLinksList
          scriptLinks={scriptLinks}
          isScriptGenerated={isScriptGenerated}
        />
      </div>

      {/* Text Files Section */}
      <TextFilesSection
        textFilesStatus={textFilesStatus}
        isScriptGenerated={isScriptGenerated}
        onGenerateTextFiles={handleGenerateTextFiles}
        textFileLinks={textFileLinks}
      />

      {/* Episode Assets Section */}
      <EpisodeAssetsSection
        podcastStatus={podcastStatus}
        isScriptGenerated={isScriptGenerated}
        onGenerateAssets={handleGenerateEpisodeAssets}
        assetLinks={assetLinks}
      />

      {/* Podbean Publishing Section */}
      <PodbeanPublishingSection
        podcastStatus={podcastStatus}
        onPublishToPodbean={handlePublishToPodbean}
      />

      {/* Script Approval Dialog */}
      <ScriptApprovalDialog 
        isOpen={isApprovalDialogOpen} 
        onConfirm={confirmApproval}
        onCancel={cancelApproval}
      />
    </>
  );
}
