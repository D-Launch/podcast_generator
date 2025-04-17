import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { Label } from "@/components/ui/label";

interface PdfFileUploadProps {
  selectedFile: File | null;
  onChange: (file: File) => void;
  error?: string;
  disabled?: boolean;
}

export function PdfFileUpload({ 
  selectedFile, 
  onChange, 
  error, 
  disabled = false 
}: PdfFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      onChange(file);
    }
  };

  // Function to clear the PDF file
  const clearPdfFile = () => {
    console.log("Clearing PDF file");
    
    // Reset the file input value using the ref
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="pdfFile">Upload PDF</Label>
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="pdfFile"
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg ${
            disabled 
              ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700' 
              : 'cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 border-gray-300 dark:border-gray-600'
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className={`w-8 h-8 mb-3 ${
              disabled 
                ? 'text-gray-400 dark:text-gray-500' 
                : 'text-gray-500 dark:text-gray-400'
            }`} />
            <p className={`mb-2 text-sm ${
              disabled 
                ? 'text-gray-400 dark:text-gray-500' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className={`text-xs ${
              disabled 
                ? 'text-gray-400 dark:text-gray-500' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              PDF files only
            </p>
            {selectedFile && (
              <p className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                {selectedFile.name}
              </p>
            )}
          </div>
          <input
            id="pdfFile"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
            ref={fileInputRef}
          />
        </label>
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
