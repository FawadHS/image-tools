import { useState, useRef, useEffect } from 'react';
import { Crop, Square, Circle, Lock, Unlock, Check, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConverter } from '../context/ConverterContext';
import { loadImageWithExif, renderEditsToCanvas } from '../utils/imageTransform';

type CropShape = 'rectangle' | 'circle';
type AspectRatioPreset = 'free' | '1:1' | '16:9' | '4:3' | '3:2';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const CropTool = () => {
  const { state, dispatch } = useConverter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cropShape, setCropShape] = useState<CropShape>('rectangle');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>('free');
  const [isLocked, setIsLocked] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  
  // Current transformed image (EXIF-normalized + rotation/flip/filters applied, NO crop)
  const [transformedImage, setTransformedImage] = useState<HTMLImageElement | null>(null);
  const [lastTransformState, setLastTransformState] = useState<string>('');
  
  // Get the active file
  const activeFile = state.files.find(f => f.id === state.activeFileId) || state.files[0];
  
  // Track committed crop state from active file
  const committedCrop = activeFile?.transform?.crop;
  const [previewCrop, setPreviewCrop] = useState<CropArea | null>(committedCrop || null);
  
  // Sync preview crop with committed state when it changes externally
  useEffect(() => {
    setPreviewCrop(committedCrop || null);
  }, [JSON.stringify(committedCrop), activeFile?.id]);
  
  // Check if preview differs from committed state
  const hasUnappliedChanges = JSON.stringify(previewCrop) !== JSON.stringify(committedCrop);

  // Load the TRANSFORMED image (rotation/flip/filters applied, but NO crop)
  // This is the base image that CropTool works on
  useEffect(() => {
    if (state.files.length === 0 || !activeFile) return;

    const currentTransformState = JSON.stringify({
      src: activeFile.preview,
      rotation: activeFile.transform?.rotation,
      flipHorizontal: activeFile.transform?.flipHorizontal,
      flipVertical: activeFile.transform?.flipVertical,
      filters: activeFile.transform?.filters,
    });
    
    if (lastTransformState === currentTransformState) return;

    // Load the image and apply transforms (EXCEPT crop)
    const loadTransformedImage = async () => {
      try {
        // Load original image with EXIF normalization
        const response = await fetch(activeFile.preview);
        const blob = await response.blob();
        const img = await loadImageWithExif(blob);

        // Apply rotation/flip/filters (but NOT crop) using unified pipeline
        const transformWithoutCrop = activeFile.transform ? {
          ...activeFile.transform,
          crop: undefined, // Explicitly remove crop
        } : undefined;

        const canvas = renderEditsToCanvas(img, transformWithoutCrop, false);
        
        // Convert to image for display
        const transformedImg = new Image();
        transformedImg.onload = () => {
          setTransformedImage(transformedImg);
          setLastTransformState(currentTransformState);
          
          // Initialize crop area to committed crop or full image
          const initialCrop = committedCrop || {
            x: 0,
            y: 0,
            width: transformedImg.naturalWidth,
            height: transformedImg.naturalHeight,
          };
          setCropArea(initialCrop);
          if (!committedCrop) setPreviewCrop(initialCrop);
        };
        transformedImg.src = canvas.toDataURL();
      } catch (error) {
        console.error('Failed to load transformed image:', error);
        toast.error('Failed to load image');
      }
    };

    loadTransformedImage();
  }, [activeFile, committedCrop, lastTransformState, state.files.length]);

  // Draw canvas preview with crop overlay
  useEffect(() => {
    if (!canvasRef.current || !transformedImage || !cropArea) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale to fit container
    const maxWidth = 450;
    const maxHeight = 300;
    const imgWidth = transformedImage.naturalWidth || transformedImage.width;
    const imgHeight = transformedImage.naturalHeight || transformedImage.height;
    const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1);

    canvas.width = Math.floor(imgWidth * scale);
    canvas.height = Math.floor(imgHeight * scale);

    // Draw full transformed image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(transformedImage, 0, 0, canvas.width, canvas.height);

    // Draw crop overlay
    const scaledCrop = {
      x: cropArea.x * scale,
      y: cropArea.y * scale,
      width: cropArea.width * scale,
      height: cropArea.height * scale,
    };

    // Darken outside crop area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear crop area (show original image)
    ctx.save();
    if (cropShape === 'circle') {
      const centerX = scaledCrop.x + scaledCrop.width / 2;
      const centerY = scaledCrop.y + scaledCrop.height / 2;
      const radius = Math.min(scaledCrop.width, scaledCrop.height) / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(scaledCrop.x, scaledCrop.y, scaledCrop.width, scaledCrop.height);
      ctx.clip();
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(transformedImage, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw crop border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    if (cropShape === 'circle') {
      const centerX2 = scaledCrop.x + scaledCrop.width / 2;
      const centerY2 = scaledCrop.y + scaledCrop.height / 2;
      const radius2 = Math.min(scaledCrop.width, scaledCrop.height) / 2;
      ctx.beginPath();
      ctx.arc(centerX2, centerY2, radius2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(scaledCrop.x, scaledCrop.y, scaledCrop.width, scaledCrop.height);
    }

    // Draw resize handles
    const handleSize = 8;
    ctx.fillStyle = '#3b82f6';
    const handles = [
      { x: scaledCrop.x, y: scaledCrop.y },
      { x: scaledCrop.x + scaledCrop.width, y: scaledCrop.y },
      { x: scaledCrop.x, y: scaledCrop.y + scaledCrop.height },
      { x: scaledCrop.x + scaledCrop.width, y: scaledCrop.y + scaledCrop.height },
    ];
    handles.forEach((handle) => {
      ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    });
  }, [transformedImage, cropArea, cropShape]);

  const getAspectRatioValue = (): number | null => {
    switch (aspectRatio) {
      case '1:1': return 1;
      case '16:9': return 16 / 9;
      case '4:3': return 4 / 3;
      case '3:2': return 3 / 2;
      default: return null;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !transformedImage) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const imgWidth = transformedImage.naturalWidth || transformedImage.width;
    const imgHeight = transformedImage.naturalHeight || transformedImage.height;
    
    // Use separate scales for X and Y to handle non-uniform scaling
    const scaleX = canvas.width / imgWidth;
    const scaleY = canvas.height / imgHeight;
    
    // Convert click coordinates to natural pixel space
    const x = (e.clientX - rect.left) / scaleX;
    const y = (e.clientY - rect.top) / scaleY;

    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart || !transformedImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const imgWidth = transformedImage.naturalWidth || transformedImage.width;
    const imgHeight = transformedImage.naturalHeight || transformedImage.height;
    
    // Use separate scales for X and Y to handle non-uniform scaling
    const scaleX = canvas.width / imgWidth;
    const scaleY = canvas.height / imgHeight;
    
    // Convert mouse coordinates to natural pixel space
    const x = (e.clientX - rect.left) / scaleX;
    const y = (e.clientY - rect.top) / scaleY;

    let width = Math.abs(x - dragStart.x);
    let height = Math.abs(y - dragStart.y);

    // Apply aspect ratio if locked
    const ratio = getAspectRatioValue();
    if (isLocked && ratio) {
      if (width / height > ratio) {
        width = height * ratio;
      } else {
        height = width / ratio;
      }
    }

    // Calculate crop area in natural pixel coordinates
    const cropX = Math.max(0, Math.min(dragStart.x, x));
    const cropY = Math.max(0, Math.min(dragStart.y, y));
    const cropWidth = Math.min(width, imgWidth - cropX);
    const cropHeight = Math.min(height, imgHeight - cropY);

    const newCrop = {
      x: Math.round(cropX),
      y: Math.round(cropY),
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
    };
    setCropArea(newCrop);
    setPreviewCrop(newCrop);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !transformedImage || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const imgWidth = transformedImage.naturalWidth || transformedImage.width;
    const imgHeight = transformedImage.naturalHeight || transformedImage.height;
    
    const scaleX = canvas.width / imgWidth;
    const scaleY = canvas.height / imgHeight;
    
    const x = (touch.clientX - rect.left) / scaleX;
    const y = (touch.clientY - rect.top) / scaleY;

    setIsDragging(true);
    setDragStart({ x, y });
    e.preventDefault();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart || !transformedImage || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const imgWidth = transformedImage.naturalWidth || transformedImage.width;
    const imgHeight = transformedImage.naturalHeight || transformedImage.height;
    
    const scaleX = canvas.width / imgWidth;
    const scaleY = canvas.height / imgHeight;
    
    const x = (touch.clientX - rect.left) / scaleX;
    const y = (touch.clientY - rect.top) / scaleY;

    let width = Math.abs(x - dragStart.x);
    let height = Math.abs(y - dragStart.y);

    const ratio = getAspectRatioValue();
    if (isLocked && ratio) {
      if (width / height > ratio) {
        width = height * ratio;
      } else {
        height = width / ratio;
      }
    }

    const cropX = Math.max(0, Math.min(dragStart.x, x));
    const cropY = Math.max(0, Math.min(dragStart.y, y));
    const cropWidth = Math.min(width, imgWidth - cropX);
    const cropHeight = Math.min(height, imgHeight - cropY);

    const newCrop = {
      x: Math.round(cropX),
      y: Math.round(cropY),
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
    };
    setCropArea(newCrop);
    setPreviewCrop(newCrop);
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDragStart(null);
  };
  
  const discardCrop = () => {
    const imgWidth = transformedImage?.naturalWidth || transformedImage?.width || 0;
    const imgHeight = transformedImage?.naturalHeight || transformedImage?.height || 0;
    
    const revertCrop = committedCrop || {
      x: 0,
      y: 0,
      width: imgWidth,
      height: imgHeight,
    };
    setCropArea(revertCrop);
    setPreviewCrop(revertCrop);
  };

  const applyCrop = () => {
    if (!previewCrop || !transformedImage || !activeFile) return;

    if (previewCrop.width <= 0 || previewCrop.height <= 0) {
      toast.error('Invalid crop area');
      return;
    }

    // Save crop to active file - coordinates are in natural pixel space
    // of the transformed image (after rotation/flip/filters, before crop)
    const currentTransform = activeFile.transform || {
      rotation: 0 as const,
      flipHorizontal: false,
      flipVertical: false,
    };

    dispatch({
      type: 'UPDATE_FILE',
      payload: {
        id: activeFile.id,
        updates: {
          transform: {
            ...currentTransform,
            crop: {
              ...previewCrop,
              shape: cropShape, // Store the crop shape (rectangle or circle)
            },
          },
        },
      },
    });

    toast.success('Crop applied', { duration: 2000 });
  };

  const resetCrop = () => {
    if (!activeFile) return;
    
    const currentTransform = activeFile.transform || {
      rotation: 0 as const,
      flipHorizontal: false,
      flipVertical: false,
    };

    dispatch({
      type: 'UPDATE_FILE',
      payload: {
        id: activeFile.id,
        updates: {
          transform: {
            ...currentTransform,
            crop: undefined,
          },
        },
      },
    });

    const imgWidth = transformedImage?.naturalWidth || transformedImage?.width || 0;
    const imgHeight = transformedImage?.naturalHeight || transformedImage?.height || 0;
    
    const fullCrop = {
      x: 0,
      y: 0,
      width: imgWidth,
      height: imgHeight,
    };
    setCropArea(fullCrop);
    setPreviewCrop(fullCrop);

    toast.success('Crop reset', { duration: 2000 });
  };

  if (state.files.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Crop className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Crop Tool</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload an image to start cropping
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crop className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Crop Tool</h2>
          {hasUnappliedChanges && (
            <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">
              Unsaved
            </span>
          )}
        </div>
        {(activeFile?.transform?.crop || hasUnappliedChanges) && (
          <button
            onClick={resetCrop}
            className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Reset Crop
          </button>
        )}
      </div>

      <div className="mb-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</h3>
        </div>
        <div className="flex justify-center items-center max-h-[300px] overflow-hidden">
        <canvas
          ref={canvasRef}
          data-testid="crop-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="cursor-crosshair border border-gray-300 dark:border-gray-600 rounded max-w-full max-h-[300px] object-contain touch-none"
        />
        </div>
      </div>

      {hasUnappliedChanges && (
        <div className="mb-4 flex gap-2">
          <button
            onClick={applyCrop}
            data-testid="apply-crop-button"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            <Check className="w-4 h-4" />
            Apply Crop
          </button>
          <button
            onClick={discardCrop}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            Discard
          </button>
        </div>
      )}

      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Crop Shape
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setCropShape('rectangle')}
            className={`flex items-center justify-center gap-2 p-3 border rounded-lg transition-all ${
              cropShape === 'rectangle'
                ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-primary-900/30'
            }`}
          >
            <Square className="w-4 h-4" />
            <span className="text-xs font-medium">Rectangle</span>
          </button>
          <button
            onClick={() => setCropShape('circle')}
            data-testid="circle-crop-button"
            className={`flex items-center justify-center gap-2 p-3 border rounded-lg transition-all ${
              cropShape === 'circle'
                ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-primary-900/30'
            }`}
          >
            <Circle className="w-4 h-4" />
            <span className="text-xs font-medium">Circle</span>
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Aspect Ratio</label>
          <button
            onClick={() => setIsLocked(!isLocked)}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            title={isLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>
        <select
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value as AspectRatioPreset)}
          disabled={!isLocked}
          aria-label="Aspect ratio preset"
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="free">Free</option>
          <option value="1:1">1:1 (Square)</option>
          <option value="16:9">16:9 (Widescreen)</option>
          <option value="4:3">4:3 (Standard)</option>
          <option value="3:2">3:2 (Photo)</option>
        </select>
      </div>

      {cropArea && (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Position:</span>{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {Math.round(cropArea.x)}, {Math.round(cropArea.y)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Size:</span>{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
