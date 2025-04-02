
import { useState, useCallback } from "react";
import { resizeImageToSize, cropImage, formatFileSize, parseFileSize } from "@/utils/imageUtils";
import { toast } from "sonner";

interface ProcessedImage {
  originalFile: File;
  processedFile?: File;
  preview: string;
  processingStatus: "idle" | "processing" | "completed" | "error";
  originalSize: string;
  processedSize?: string;
}

export function useImageProcessor() {
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Handle file uploads
  const handleImageUpload = useCallback((file: File) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    const preview = URL.createObjectURL(file);
    
    setOriginalImage(file);
    setProcessedImage({
      originalFile: file,
      preview,
      processingStatus: "idle",
      originalSize: formatFileSize(file.size)
    });
    
    // Automatically toast success
    toast.success(`Image uploaded: ${file.name}`);
  }, []);
  
  // Resize image to target size (KB/MB)
  const resizeImage = useCallback(async (targetSizeStr: string) => {
    if (!originalImage) {
      toast.error('Please upload an image first');
      return null;
    }
    
    try {
      setIsProcessing(true);
      setProcessedImage(prev => 
        prev ? { ...prev, processingStatus: "processing" } : null
      );
      
      // Convert size string to bytes
      const targetSizeBytes = parseFileSize(targetSizeStr);
      
      if (targetSizeBytes <= 0) {
        toast.error('Please enter a valid file size');
        setIsProcessing(false);
        return null;
      }
      
      // Log values to help with debugging
      console.log('Original size:', originalImage.size, 'bytes');
      console.log('Target size:', targetSizeBytes, 'bytes');
      
      // Actual resize operation
      const resizedFile = await resizeImageToSize(originalImage, targetSizeBytes);
      const preview = URL.createObjectURL(resizedFile);
      
      console.log('Resized size:', resizedFile.size, 'bytes');
      
      const result = {
        originalFile: originalImage,
        processedFile: resizedFile,
        preview,
        processingStatus: "completed" as const,
        originalSize: formatFileSize(originalImage.size),
        processedSize: formatFileSize(resizedFile.size)
      };
      
      setProcessedImage(result);
      
      // Check if we're within acceptable tolerance of target size
      const tolerance = targetSizeBytes * 0.1; // 10% tolerance
      const difference = Math.abs(resizedFile.size - targetSizeBytes);
      const differencePercentage = (difference / targetSizeBytes) * 100;
      
      if (differencePercentage > 10) {
        // More than 10% off from target
        toast.warning(
          `Resized to ${formatFileSize(resizedFile.size)} (${differencePercentage.toFixed(0)}% deviation from target)`
        );
      } else {
        toast.success(`Image resized to ${formatFileSize(resizedFile.size)}`);
      }
      
      return result;
    } catch (error) {
      console.error('Error resizing image:', error);
      toast.error('Failed to resize image');
      setProcessedImage(prev => 
        prev ? { ...prev, processingStatus: "error" } : null
      );
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage]);
  
  // Crop image
  const cropImageToSize = useCallback(async (
    cropArea: { x: number; y: number; width: number; height: number },
    canvasDimensions: { width: number; height: number }
  ) => {
    if (!originalImage) {
      toast.error('Please upload an image first');
      return null;
    }
    
    try {
      setIsProcessing(true);
      setProcessedImage(prev => 
        prev ? { ...prev, processingStatus: "processing" } : null
      );
      
      // Actual crop operation
      const croppedFile = await cropImage(originalImage, cropArea, canvasDimensions);
      const preview = URL.createObjectURL(croppedFile);
      
      const result = {
        originalFile: originalImage,
        processedFile: croppedFile,
        preview,
        processingStatus: "completed" as const,
        originalSize: formatFileSize(originalImage.size),
        processedSize: formatFileSize(croppedFile.size)
      };
      
      setProcessedImage(result);
      toast.success('Image cropped successfully');
      return result;
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Failed to crop image');
      setProcessedImage(prev => 
        prev ? { ...prev, processingStatus: "error" } : null
      );
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage]);
  
  // Reset everything
  const resetImage = useCallback(() => {
    if (processedImage?.preview) {
      URL.revokeObjectURL(processedImage.preview);
    }
    setOriginalImage(null);
    setProcessedImage(null);
    setIsProcessing(false);
  }, [processedImage]);
  
  return {
    originalImage,
    processedImage,
    isProcessing,
    handleImageUpload,
    resizeImage,
    cropImageToSize,
    resetImage
  };
}
