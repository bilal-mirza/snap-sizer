
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Image as ImageIcon, Download, RefreshCcw } from "lucide-react";
import { createDownloadLink } from "@/utils/imageUtils";
import { useImageProcessor } from "@/hooks/useImageProcessor";
import ImageUploader from "@/components/ImageUploader";
import ImageResizer from "@/components/ImageResizer";
import ImageCropper from "@/components/ImageCropper";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const Index = () => {
  const {
    originalImage,
    processedImage,
    isProcessing,
    handleImageUpload,
    resizeImage,
    cropImageToSize,
    resetImage
  } = useImageProcessor();
  
  const [activeTab, setActiveTab] = useState<"resize" | "crop">("resize");
  
  const handleResize = async (targetSize: string) => {
    await resizeImage(targetSize);
  };
  
  const handleCrop = async (
    cropArea: { x: number; y: number; width: number; height: number },
    canvasDimensions: { width: number; height: number }
  ) => {
    await cropImageToSize(cropArea, canvasDimensions);
  };
  
  const downloadUrl = processedImage?.processedFile
    ? createDownloadLink(processedImage.processedFile)
    : undefined;
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background py-4 px-6 sticky top-0 z-10 glass-effect">
        <div className="container max-w-screen-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-medium">SnapSizer</h1>
            </div>
            <div className="flex items-center gap-2">
              {processedImage && (
                <Button variant="ghost" size="sm" onClick={resetImage}>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  New Image
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 py-8">
        <div className="container max-w-screen-xl">
          {!processedImage ? (
            <Card className="w-full max-w-3xl mx-auto scale-in shadow-subtle">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center mb-6 space-y-2">
                  <ImageIcon className="h-12 w-12 text-primary mb-2 animate-float" />
                  <h1 className="text-2xl font-semibold tracking-tight">Image Processor</h1>
                  <p className="text-muted-foreground max-w-md">
                    Resize your images to specific file sizes or crop them to exact dimensions.
                  </p>
                </div>
                
                <ImageUploader onImageSelect={handleImageUpload} />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8 md:grid-cols-5 w-full max-w-screen-xl mx-auto fade-in">
              {/* Left panel - Preview */}
              <Card className="md:col-span-2 shadow-subtle">
                <CardContent className="p-6 space-y-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <h2 className="text-lg font-medium">Preview</h2>
                    <p className="text-sm text-muted-foreground">
                      {processedImage.processingStatus === "completed"
                        ? "Processed Image"
                        : "Original Image"}
                    </p>
                  </div>
                  
                  <div className="relative rounded-lg border overflow-hidden bg-secondary/50 aspect-square flex items-center justify-center">
                    <img
                      src={processedImage.preview}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain transition-all-300"
                    />
                  </div>
                  
                  <div className="flex justify-center pt-2">
                    {downloadUrl && processedImage.processingStatus === "completed" && (
                      <Button asChild variant="default" size="sm">
                        <a href={downloadUrl} download>
                          <Download className="h-4 w-4 mr-2" />
                          Download Result
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Right panel - Tools */}
              <Card className="md:col-span-3 shadow-subtle">
                <CardContent className="p-6">
                  <Tabs
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as "resize" | "crop")}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-2 mb-6">
                      <TabsTrigger value="resize">Resize</TabsTrigger>
                      <TabsTrigger value="crop">Crop</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="resize" className="mt-0">
                      <ImageResizer
                        originalSize={processedImage.originalSize}
                        processedSize={processedImage.processedSize}
                        onResize={handleResize}
                        isProcessing={isProcessing}
                        downloadUrl={downloadUrl}
                      />
                    </TabsContent>
                    
                    <TabsContent value="crop" className="mt-0">
                      <ImageCropper
                        imageUrl={processedImage.preview}
                        onCrop={handleCrop}
                        isProcessing={isProcessing}
                        downloadUrl={downloadUrl}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 border-t">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground">
            Crafted with ❤️ by BilalCreations
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
