
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Download, RefreshCw, AlertTriangle } from "lucide-react";
import { formatFileSize } from "@/utils/imageUtils";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImageResizerProps {
  originalSize: string;
  onResize: (targetSize: string) => Promise<void>;
  processedSize?: string;
  isProcessing: boolean;
  downloadUrl?: string;
  className?: string;
}

const ImageResizer: React.FC<ImageResizerProps> = ({
  originalSize,
  onResize,
  processedSize,
  isProcessing,
  downloadUrl,
  className
}) => {
  const [sizeType, setSizeType] = useState<"KB" | "MB">("KB");
  const [sizeValue, setSizeValue] = useState("1");
  
  const handleSizeTypeChange = (type: "KB" | "MB") => {
    setSizeType(type);
    
    // Convert value when changing between KB and MB
    if (type === "KB" && sizeType === "MB") {
      setSizeValue((parseFloat(sizeValue) * 1024).toString());
    } else if (type === "MB" && sizeType === "KB") {
      setSizeValue((parseFloat(sizeValue) / 1024).toString());
    }
  };
  
  const handleResize = () => {
    onResize(`${sizeValue} ${sizeType}`);
  };
  
  // Parse original size for slider max
  const getOriginalSizeInCurrentUnit = (): number => {
    const sizeInBytes = parseInt(originalSize.split(' ')[0]);
    const sizeUnit = originalSize.split(' ')[1];
    
    if (sizeUnit === "KB" && sizeType === "KB") return sizeInBytes;
    if (sizeUnit === "MB" && sizeType === "MB") return sizeInBytes;
    if (sizeUnit === "KB" && sizeType === "MB") return sizeInBytes / 1024;
    if (sizeUnit === "MB" && sizeType === "KB") return sizeInBytes * 1024;
    
    // Default in case of parsing issues
    return sizeType === "MB" ? 5 : 5000;
  };
  
  const maxSize = Math.ceil(getOriginalSizeInCurrentUnit());
  
  return (
    <div className={cn("space-y-6 fade-in", className)}>
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Resize Image</h3>
        <p className="text-sm text-muted-foreground">
          Adjust the target file size below
        </p>
      </div>
      
      <Alert variant="default" className="bg-muted/50 border-primary/20">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-xs">
          The final size may differ slightly from your target due to compression variables.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Original Size:</span>
          <span className="text-sm">{originalSize}</span>
        </div>
        
        {processedSize && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">New Size:</span>
            <span className="text-sm text-primary font-medium">{processedSize}</span>
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Target Size</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0.01"
              max={maxSize}
              step="0.01"
              value={sizeValue}
              onChange={(e) => setSizeValue(e.target.value)}
              className="flex-1"
            />
            
            <div className="flex rounded-md overflow-hidden">
              <Button
                type="button"
                variant={sizeType === "KB" ? "default" : "outline"}
                size="sm"
                className="rounded-r-none"
                onClick={() => handleSizeTypeChange("KB")}
              >
                KB
              </Button>
              <Button
                type="button"
                variant={sizeType === "MB" ? "default" : "outline"}
                size="sm"
                className="rounded-l-none"
                onClick={() => handleSizeTypeChange("MB")}
              >
                MB
              </Button>
            </div>
          </div>
          
          <Slider
            min={0.01}
            max={maxSize}
            step={0.01}
            value={[parseFloat(sizeValue)]}
            onValueChange={(value) => setSizeValue(value[0].toString())}
            className="py-4"
          />
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleResize}
            disabled={isProcessing}
            variant="default"
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>Resize Image</>
            )}
          </Button>
          
          {downloadUrl && (
            <Button asChild variant="outline">
              <a href={downloadUrl} download>
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageResizer;
