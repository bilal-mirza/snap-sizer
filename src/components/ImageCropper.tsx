
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Crop, RefreshCw } from "lucide-react";
import { convertUnits } from "@/utils/imageUtils";
import { cn } from "@/lib/utils";

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (
    cropArea: { x: number; y: number; width: number; height: number },
    canvasDimensions: { width: number; height: number }
  ) => Promise<void>;
  isProcessing: boolean;
  downloadUrl?: string;
  className?: string;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  imageUrl,
  onCrop,
  isProcessing,
  downloadUrl,
  className
}) => {
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State for crop area
  const [cropBox, setCropBox] = useState({
    x: 0, y: 0, width: 0, height: 0
  });
  
  // State for dragging
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragType, setDragType] = useState<"move" | "resize" | null>(null);
  const [resizeHandle, setResizeHandle] = useState<"topLeft" | "topRight" | "bottomLeft" | "bottomRight" | null>(null);
  
  // Cursor state
  const [currentCursor, setCurrentCursor] = useState<string>("default");
  
  // Dimensions state
  const [unit, setUnit] = useState<"inches" | "cm">("inches");
  const [width, setWidth] = useState("3");
  const [height, setHeight] = useState("2");
  const [dpi, setDpi] = useState("300");
  
  // Image dimensions
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && imageRef.current) {
        updateCanvasSize();
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Load image and set up canvas
  useEffect(() => {
    if (!imageUrl) return;
    
    const img = new Image();
    imageRef.current = img;
    
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      updateCanvasSize();
    };
    
    img.src = imageUrl;
  }, [imageUrl]);
  
  // Update crop box when dimensions change
  useEffect(() => {
    if (canvasDimensions.width === 0 || canvasDimensions.height === 0) return;
    
    // Convert dimensions from unit to pixels
    let widthInPixels: number;
    let heightInPixels: number;
    
    if (unit === "inches") {
      widthInPixels = convertUnits.inchesToPixels(parseFloat(width), parseInt(dpi));
      heightInPixels = convertUnits.inchesToPixels(parseFloat(height), parseInt(dpi));
    } else {
      widthInPixels = convertUnits.cmToPixels(parseFloat(width), parseInt(dpi));
      heightInPixels = convertUnits.cmToPixels(parseFloat(height), parseInt(dpi));
    }
    
    // Scale to fit canvas
    const scale = Math.min(
      canvasDimensions.width / imageDimensions.width,
      canvasDimensions.height / imageDimensions.height
    );
    
    const scaledImageWidth = imageDimensions.width * scale;
    const scaledImageHeight = imageDimensions.height * scale;
    
    // Scale crop dimensions to match displayed image
    const displayWidthInPixels = widthInPixels * scale;
    const displayHeightInPixels = heightInPixels * scale;
    
    // Center crop in image
    const newCropBox = {
      x: (scaledImageWidth - displayWidthInPixels) / 2,
      y: (scaledImageHeight - displayHeightInPixels) / 2,
      width: displayWidthInPixels,
      height: displayHeightInPixels
    };
    
    setCropBox(newCropBox);
    drawCanvas();
  }, [width, height, unit, dpi, canvasDimensions, imageDimensions]);
  
  // Draw canvas whenever crop box changes
  useEffect(() => {
    drawCanvas();
  }, [cropBox]);
  
  // Update canvas size based on container
  const updateCanvasSize = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const containerWidth = canvas.parentElement?.clientWidth || 600;
    
    // Calculate canvas size to maintain aspect ratio
    const scale = Math.min(
      containerWidth / imageRef.current.width,
      600 / imageRef.current.height
    );
    
    const width = imageRef.current.width * scale;
    const height = imageRef.current.height * scale;
    
    canvas.width = width;
    canvas.height = height;
    
    setCanvasDimensions({ width, height });
    drawCanvas();
  };
  
  // Draw the canvas with image and crop overlay
  const drawCanvas = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate image position to center it
    const scale = Math.min(
      canvas.width / imageRef.current.width,
      canvas.height / imageRef.current.height
    );
    
    const scaledWidth = imageRef.current.width * scale;
    const scaledHeight = imageRef.current.height * scale;
    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;
    
    // Draw image
    ctx.drawImage(imageRef.current, x, y, scaledWidth, scaledHeight);
    
    // Create semi-transparent overlay instead of white
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Instead of clearing the crop area (which caused the white), 
    // we'll draw the original image just for that section
    const cropRegion = new Path2D();
    cropRegion.rect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
    ctx.save();
    ctx.clip(cropRegion);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, x, y, scaledWidth, scaledHeight);
    ctx.restore();
    
    // Draw crop box border
    ctx.strokeStyle = "#0ea5e9";
    ctx.lineWidth = 2;
    ctx.strokeRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
    
    // Draw handles for resizing
    const handleSize = 8;
    const handlePositions = [
      { x: cropBox.x, y: cropBox.y, type: "topLeft" }, // top-left
      { x: cropBox.x + cropBox.width, y: cropBox.y, type: "topRight" }, // top-right
      { x: cropBox.x, y: cropBox.y + cropBox.height, type: "bottomLeft" }, // bottom-left
      { x: cropBox.x + cropBox.width, y: cropBox.y + cropBox.height, type: "bottomRight" } // bottom-right
    ];
    
    ctx.fillStyle = "#0ea5e9";
    handlePositions.forEach(pos => {
      ctx.fillRect(pos.x - handleSize / 2, pos.y - handleSize / 2, handleSize, handleSize);
    });
    
    // Draw resize arrows to indicate dragability
    handlePositions.forEach(pos => {
      const arrowSize = 12;
      ctx.fillStyle = "#0ea5e9";
      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 1;
      
      // Draw small direction arrows based on handle position
      if (pos.type === "topLeft") {
        // Draw northwest arrow
        ctx.beginPath();
        ctx.moveTo(pos.x - arrowSize, pos.y);
        ctx.lineTo(pos.x - arrowSize/2, pos.y - arrowSize/2);
        ctx.lineTo(pos.x, pos.y - arrowSize);
        ctx.stroke();
      } else if (pos.type === "topRight") {
        // Draw northeast arrow
        ctx.beginPath();
        ctx.moveTo(pos.x + arrowSize, pos.y);
        ctx.lineTo(pos.x + arrowSize/2, pos.y - arrowSize/2);
        ctx.lineTo(pos.x, pos.y - arrowSize);
        ctx.stroke();
      } else if (pos.type === "bottomLeft") {
        // Draw southwest arrow
        ctx.beginPath();
        ctx.moveTo(pos.x - arrowSize, pos.y);
        ctx.lineTo(pos.x - arrowSize/2, pos.y + arrowSize/2);
        ctx.lineTo(pos.x, pos.y + arrowSize);
        ctx.stroke();
      } else if (pos.type === "bottomRight") {
        // Draw southeast arrow
        ctx.beginPath();
        ctx.moveTo(pos.x + arrowSize, pos.y);
        ctx.lineTo(pos.x + arrowSize/2, pos.y + arrowSize/2);
        ctx.lineTo(pos.x, pos.y + arrowSize);
        ctx.stroke();
      }
    });
    
    // Draw dimensions text
    ctx.fillStyle = "white";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `${width} × ${height} ${unit}`,
      cropBox.x + cropBox.width / 2,
      cropBox.y + cropBox.height + 15
    );
  };
  
  // Check if point is in resize handle
  const getResizeHandle = (x: number, y: number) => {
    const handleSize = 12; // Slightly larger than visible size for easier interaction
    
    const isInHandle = (handleX: number, handleY: number, handleType: "topLeft" | "topRight" | "bottomLeft" | "bottomRight") => {
      return (
        x >= handleX - handleSize / 2 &&
        x <= handleX + handleSize / 2 &&
        y >= handleY - handleSize / 2 &&
        y <= handleY + handleSize / 2
      ) ? handleType : null;
    };
    
    // Check each handle
    return isInHandle(cropBox.x, cropBox.y, "topLeft") || 
           isInHandle(cropBox.x + cropBox.width, cropBox.y, "topRight") || 
           isInHandle(cropBox.x, cropBox.y + cropBox.height, "bottomLeft") || 
           isInHandle(cropBox.x + cropBox.width, cropBox.y + cropBox.height, "bottomRight");
  };
  
  // Update cursor based on mouse position
  const updateCursor = (x: number, y: number) => {
    const handle = getResizeHandle(x, y);
    
    if (handle) {
      switch(handle) {
        case "topLeft":
          setCurrentCursor("nwse-resize");
          break;
        case "topRight":
          setCurrentCursor("nesw-resize");
          break;
        case "bottomLeft":
          setCurrentCursor("nesw-resize");
          break;
        case "bottomRight":
          setCurrentCursor("nwse-resize");
          break;
      }
    } else if (
      x >= cropBox.x &&
      x <= cropBox.x + cropBox.width &&
      y >= cropBox.y &&
      y <= cropBox.y + cropBox.height
    ) {
      setCurrentCursor("move");
    } else {
      setCurrentCursor("default");
    }
  };
  
  // Handle mouse down (start drag)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on a resize handle
    const handle = getResizeHandle(x, y);
    
    if (handle) {
      setResizeHandle(handle);
      setDragType("resize");
    }
    // Check if clicking inside crop box (for moving)
    else if (
      x >= cropBox.x &&
      x <= cropBox.x + cropBox.width &&
      y >= cropBox.y &&
      y <= cropBox.y + cropBox.height
    ) {
      setDragType("move");
    } else {
      return; // clicked outside, do nothing
    }
    
    setIsDragging(true);
    setDragStart({ x, y });
  };
  
  // Handle mouse move (drag)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update cursor regardless of dragging state
    updateCursor(x, y);
    
    if (!isDragging) return;
    
    const dx = x - dragStart.x;
    const dy = y - dragStart.y;
    
    if (dragType === "move") {
      // Move the entire crop box
      setCropBox(prev => ({
        ...prev,
        x: Math.max(0, Math.min(canvas.width - prev.width, prev.x + dx)),
        y: Math.max(0, Math.min(canvas.height - prev.height, prev.y + dy))
      }));
    } else if (dragType === "resize" && resizeHandle) {
      // Resize the crop box
      let newCropBox = { ...cropBox };
      
      switch (resizeHandle) {
        case "topLeft":
          newCropBox = {
            x: Math.min(cropBox.x + dx, cropBox.x + cropBox.width - 10),
            y: Math.min(cropBox.y + dy, cropBox.y + cropBox.height - 10),
            width: cropBox.width - dx,
            height: cropBox.height - dy
          };
          break;
        case "topRight":
          newCropBox = {
            x: cropBox.x,
            y: Math.min(cropBox.y + dy, cropBox.y + cropBox.height - 10),
            width: Math.max(10, cropBox.width + dx),
            height: cropBox.height - dy
          };
          break;
        case "bottomLeft":
          newCropBox = {
            x: Math.min(cropBox.x + dx, cropBox.x + cropBox.width - 10),
            y: cropBox.y,
            width: cropBox.width - dx,
            height: Math.max(10, cropBox.height + dy)
          };
          break;
        case "bottomRight":
          newCropBox = {
            x: cropBox.x,
            y: cropBox.y,
            width: Math.max(10, cropBox.width + dx),
            height: Math.max(10, cropBox.height + dy)
          };
          break;
      }
      
      // Ensure crop box stays within canvas
      newCropBox.x = Math.max(0, newCropBox.x);
      newCropBox.y = Math.max(0, newCropBox.y);
      newCropBox.width = Math.min(canvas.width - newCropBox.x, newCropBox.width);
      newCropBox.height = Math.min(canvas.height - newCropBox.y, newCropBox.height);
      
      setCropBox(newCropBox);
      
      // Update dimensions input fields based on crop box size
      const scale = Math.min(
        canvas.width / imageDimensions.width,
        canvas.height / imageDimensions.height
      );
      
      // Convert pixel dimensions back to inches/cm
      const widthInPixels = newCropBox.width / scale;
      const heightInPixels = newCropBox.height / scale;
      
      if (unit === "inches") {
        setWidth(convertUnits.pixelsToInches(widthInPixels, parseInt(dpi)).toFixed(2));
        setHeight(convertUnits.pixelsToInches(heightInPixels, parseInt(dpi)).toFixed(2));
      } else {
        setWidth(convertUnits.pixelsToCm(widthInPixels, parseInt(dpi)).toFixed(2));
        setHeight(convertUnits.pixelsToCm(heightInPixels, parseInt(dpi)).toFixed(2));
      }
    }
    
    setDragStart({ x, y });
  };
  
  // Handle mouse up (end drag)
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
    setResizeHandle(null);
  };
  
  // Handle mouse leave (end drag)
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragType(null);
      setResizeHandle(null);
    }
  };
  
  // Handle unit change
  const handleUnitChange = (newUnit: "inches" | "cm") => {
    // Convert current dimensions to the new unit
    if (newUnit === "cm" && unit === "inches") {
      setWidth((parseFloat(width) * 2.54).toFixed(2));
      setHeight((parseFloat(height) * 2.54).toFixed(2));
    } else if (newUnit === "inches" && unit === "cm") {
      setWidth((parseFloat(width) / 2.54).toFixed(2));
      setHeight((parseFloat(height) / 2.54).toFixed(2));
    }
    
    setUnit(newUnit);
  };
  
  // Handle crop
  const handleCrop = async () => {
    await onCrop(cropBox, canvasDimensions);
  };
  
  return (
    <div className={cn("space-y-6 fade-in", className)}>
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Crop Image</h3>
        <p className="text-sm text-muted-foreground">
          Set dimensions and position the crop area
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <div className="relative w-full rounded-lg border overflow-hidden bg-secondary/20" ref={containerRef}>
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto touch-none"
              style={{ cursor: currentCursor }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                type="number"
                min="0.1"
                step="0.01"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                type="number"
                min="0.1"
                step="0.01"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={unit}
                onValueChange={(value) => handleUnitChange(value as "inches" | "cm")}
              >
                <SelectTrigger id="unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inches">Inches</SelectItem>
                  <SelectItem value="cm">Centimeters</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dpi">DPI/PPI</Label>
              <Input
                id="dpi"
                type="number"
                min="72"
                max="600"
                step="1"
                value={dpi}
                onChange={(e) => setDpi(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleCrop}
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
                <>
                  <Crop className="mr-2 h-4 w-4" />
                  Crop Image
                </>
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
    </div>
  );
};

export default ImageCropper;
