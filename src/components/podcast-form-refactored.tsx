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
    cleanupResources
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
    setIsApprovalDialogOpen(true);
  };

  const confirmApproval = async () => {
    const result = await approveScripts(currentEpisodeId.current);
    
    if (!result.success) {
      toast({
        title: "Update Error",
        description: "Failed to update script status in the database, but marked as approved locally.",
        variant: "destructive",
      });
    }
    
    setIsApprovalDialogOpen(false);
    
    toast({
      title: "Scripts Approved",
      description: "All scripts have been successfully approved. Audio generation has started.",
      variant: "default",
    });
  };

  const cancelApproval = () => {
    setIsApprovalDialogOpen(false);
  };

  // Handler for generating text files
  const handleGenerateTextFiles = async () => {
    await generateTextFiles(currentEpisodeId.current, currentEpisodeName.current);
  };

  // Handler for generating episode assets
  const handleGenerateEpisodeAssets = async () => {
    await generateEpisodeAssets(currentEpisodeId.current, currentEpisodeName.current);
  };

  // Handler for publishing to Podbean
  const handlePublishToPodbean = async (publishData: any) => {
    await publishToPodbean(currentEpisodeId.current, currentEpisodeName.current, publishData);
  };

  // Check if an episode is selected
  const isEpisodeSelected = selectedEpisodeName !== null && selectedEpisodeName !== undefined && selectedEpisodeName.trim() !== '';

  return (
    <>
      {/* Episode Header */}
      <EpisodeHeader episodeName={selectedEpisodeName} />

      {/* Processing Status Banner */}
      <ProcessingStatusBanner status={processingStatus} />

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
          
          {/* Audio Generation Button - Moved here from below */}
          <AudioGenerationButton
            scriptStatus={scriptStatus}
            isScriptGenerated={isScriptGenerated}
            hasScript4={hasScript4}
            onClick={handleApproveScripts}
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
