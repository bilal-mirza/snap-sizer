/**
 * Utility functions for image processing
 */

/**
 * Resizes an image to match a target file size in bytes
 */
export const resizeImageToSize = (
  file: File,
  targetSize: number,
  maxIterations = 20
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Convert File to Image
    const img = new Image();
    img.onload = () => {
      // Start with original dimensions
      let width = img.width;
      let height = img.height;
      let quality = 0.9;
      let currentIteration = 0;
      let currentSize = file.size;
      let bestMatchFile: File | null = null;
      let bestMatchDiff = Infinity;
      
      // If the file is already smaller than target size and we are trying to increase its size
      if (file.size <= targetSize) {
        // We need to increase dimensions or quality
        console.log('Attempting to increase file size from', file.size, 'to', targetSize);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // For increasing size, use a different approach - we'll increase dimensions
        // and keep high quality
        const scaleFactor = Math.sqrt(targetSize / file.size);
        width = Math.ceil(width * scaleFactor);
        height = Math.ceil(height * scaleFactor);
        quality = 1.0; // Use maximum quality
        
        console.log('New dimensions:', width, 'x', height, 'Scale factor:', scaleFactor);
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }
            
            const resizedFile = new File([blob], file.name, { type: file.type });
            console.log('New file size:', resizedFile.size);
            
            resolve(resizedFile);
          },
          file.type,
          quality
        );
        
        return;
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      const compressStep = () => {
        if (currentIteration >= maxIterations) {
          // Return best match if we've reached max iterations
          if (bestMatchFile) {
            resolve(bestMatchFile);
          } else {
            // Return last attempt if no best match was found
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to create blob'));
                  return;
                }
                resolve(new File([blob], file.name, { type: file.type }));
              },
              file.type,
              quality
            );
          }
          return;
        }
        
        currentIteration++;
        
        // Get ratio of target to current size
        const ratio = Math.sqrt(targetSize / currentSize);
        const sizeDifference = currentSize - targetSize;
        
        if (sizeDifference > 0) {
          // Reduce dimensions or quality based on how far we are from target
          if (sizeDifference > targetSize * 0.5) {
            // If we're far from target, adjust dimensions
            width = Math.floor(width * Math.max(ratio, 0.7));
            height = Math.floor(height * Math.max(ratio, 0.7));
          } else {
            // If we're closer, fine-tune with quality adjustments
            quality = Math.max(quality * (0.95 + (ratio - 1) * 0.1), 0.5);
          }
        } else {
          // We've gone too small, increase dimensions or quality
          width = Math.floor(width / Math.min(ratio, 1.2));
          height = Math.floor(height / Math.min(ratio, 1.2));
          quality = Math.min(quality * 1.05, 1.0);
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw image at new dimensions
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob to check new size
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }
            
            currentSize = blob.size;
            const diff = Math.abs(currentSize - targetSize);
            
            // Track our best match
            if (diff < bestMatchDiff) {
              bestMatchDiff = diff;
              bestMatchFile = new File([blob], file.name, { type: file.type });
            }
            
            // More precise targeting with narrower tolerance range
            const tolerance = targetSize * 0.05; // 5% tolerance for more accuracy
            
            if (currentSize <= targetSize + tolerance && currentSize >= targetSize - tolerance) {
              // We're close enough to target size
              resolve(new File([blob], file.name, { type: file.type }));
            } else {
              // Continue optimizing
              compressStep();
            }
          },
          file.type,
          quality
        );
      };
      
      // Start compression
      compressStep();
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Crops an image based on the specified dimensions and area
 */
export const cropImage = (
  file: File,
  cropArea: { x: number; y: number; width: number; height: number },
  canvasDimensions: { width: number; height: number }
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Set canvas dimensions to the crop area's dimensions
      canvas.width = cropArea.width;
      canvas.height = cropArea.height;
      
      // Calculate the scale between natural image size and displayed size
      const scaleX = img.naturalWidth / canvasDimensions.width;
      const scaleY = img.naturalHeight / canvasDimensions.height;
      
      // Scale crop area to match the natural image dimensions
      const scaledCropArea = {
        x: cropArea.x * scaleX,
        y: cropArea.y * scaleY,
        width: cropArea.width * scaleX,
        height: cropArea.height * scaleY
      };
      
      // Draw only the cropped portion
      ctx.drawImage(
        img,
        scaledCropArea.x,
        scaledCropArea.y,
        scaledCropArea.width,
        scaledCropArea.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
      
      // Convert to blob/file
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          resolve(new File([blob], file.name, { type: file.type }));
        },
        file.type,
        1.0
      );
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Converts between different unit types
 */
export const convertUnits = {
  pixelsToInches: (pixels: number, dpi = 96) => pixels / dpi,
  inchesToPixels: (inches: number, dpi = 96) => inches * dpi,
  pixelsToCm: (pixels: number, dpi = 96) => (pixels / dpi) * 2.54,
  cmToPixels: (cm: number, dpi = 96) => (cm / 2.54) * dpi
};

/**
 * Formats file size in a human-readable way
 */
export const formatFileSize = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Parse file size string (e.g., "5 MB") to bytes
 */
export const parseFileSize = (sizeStr: string): number => {
  const value = parseFloat(sizeStr);
  if (isNaN(value)) return 0;
  
  if (sizeStr.toLowerCase().includes('kb')) {
    return value * 1024;
  } else if (sizeStr.toLowerCase().includes('mb')) {
    return value * 1024 * 1024;
  } else if (sizeStr.toLowerCase().includes('gb')) {
    return value * 1024 * 1024 * 1024;
  }
  
  return value; // Assume bytes if no unit specified
};

/**
 * Creates a downloadable link for a processed image
 */
export const createDownloadLink = (file: File): string => {
  return URL.createObjectURL(file);
};
