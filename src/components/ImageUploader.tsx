
import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  className?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onImageSelect(file);
      }
    }
  }, [onImageSelect]);
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImageSelect(e.target.files[0]);
    }
  }, [onImageSelect]);
  
  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "grid-upload-area w-full rounded-lg border-2 border-dashed p-8 transition-all-300",
          isDragging ? "border-primary bg-primary/5" : "border-border",
          "hover:border-primary/50 hover:bg-secondary/50 cursor-pointer"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id="image-upload"
          onChange={handleFileChange}
        />
        
        <label
          htmlFor="image-upload"
          className="flex flex-col items-center justify-center gap-4 text-center cursor-pointer"
        >
          <div className={cn(
            "rounded-full p-3 transition-all-300",
            isDragging ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
          )}>
            <Upload className="h-6 w-6" />
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Drag and drop your image here
            </p>
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG, GIF, WebP up to 10MB
            </p>
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={(e) => e.preventDefault()}
          >
            Select from files
          </Button>
        </label>
      </div>
    </div>
  );
};

export default ImageUploader;
