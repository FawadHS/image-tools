import { useState, useRef, useEffect } from 'react';
import { Crop, Square, Circle, Lasso, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConverter } from '../context/ConverterContext';
import { applyTransformationsToCanvas, canvasToImage } from '../utils/imageTransform';

type CropShape = 'rectangle' | 'circle' | 'freeform';
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
  const [previewImage, setPreviewImage] = useState<HTMLImageElement | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

  const transform = state.options.transform;

  // Load preview image from first file with transformations applied
  useEffect(() => {
    if (state.files.length > 0 && state.files[0].preview) {
      const img = new Image();
      img.onload = async () => {
        // Store original image for reference
        setOriginalImage(img);
        
        // Apply all transformations except crop (since we're in the crop tool)
        try {
          const transformedCanvas = applyTransformationsToCanvas(
            img,
            transform,
            true, // exclude crop
            false // include text overlay
          );
          const transformedImg = await canvasToImage(transformedCanvas);
          setPreviewImage(transformedImg);
          
          // Initialize crop area to full transformed image
          setCropArea({
            x: 0,
            y: 0,
            width: transformedImg.width,
            height: transformedImg.height,
          });
        } catch (error) {
          console.error('Failed to apply transformations:', error);
          setPreviewImage(img);
          setCropArea({
            x: 0,
            y: 0,
            width: img.width,
            height: img.height,
          });
        }
      };
      img.src = state.files[0].preview;
    }
  }, [state.files, transform?.rotation, transform?.flipHorizontal, transform?.flipVertical, transform?.filters, transform?.textOverlay, transform?.crop]);

  // Draw preview on canvas
  useEffect(() => {
    if (!canvasRef.current || !previewImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to fit container while maintaining aspect ratio
    // Use smaller max dimensions to ensure it fits within the container
    const maxWidth = 500;
    const maxHeight = 350;
    const scale = Math.min(
      maxWidth / previewImage.width,
      maxHeight / previewImage.height,
      1
    );

    canvas.width = Math.floor(previewImage.width * scale);
    canvas.height = Math.floor(previewImage.height * scale);

    // Draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(previewImage, 0, 0, canvas.width, canvas.height);

    // Draw crop overlay
    if (cropArea) {
      const scaledCrop = {
        x: cropArea.x * scale,
        y: cropArea.y * scale,
        width: cropArea.width * scale,
        height: cropArea.height * scale,
      };

      // Darken outside crop area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clear crop area
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
      ctx.drawImage(previewImage, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Draw crop border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      if (cropShape === 'circle') {
        const centerX = scaledCrop.x + scaledCrop.width / 2;
        const centerY = scaledCrop.y + scaledCrop.height / 2;
        const radius = Math.min(scaledCrop.width, scaledCrop.height) / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(scaledCrop.x, scaledCrop.y, scaledCrop.width, scaledCrop.height);
      }

      // Draw resize handles
      const handleSize = 8;
      ctx.fillStyle = '#3b82f6';
      const handles = [
        { x: scaledCrop.x, y: scaledCrop.y }, // Top-left
        { x: scaledCrop.x + scaledCrop.width, y: scaledCrop.y }, // Top-right
        { x: scaledCrop.x, y: scaledCrop.y + scaledCrop.height }, // Bottom-left
        { x: scaledCrop.x + scaledCrop.width, y: scaledCrop.y + scaledCrop.height }, // Bottom-right
      ];
      handles.forEach((handle) => {
        ctx.fillRect(
          handle.x - handleSize / 2,
          handle.y - handleSize / 2,
          handleSize,
          handleSize
        );
      });
    }
  }, [previewImage, cropArea, cropShape]);

  const getAspectRatioValue = (): number | null => {
    switch (aspectRatio) {
      case '1:1':
        return 1;
      case '16:9':
        return 16 / 9;
      case '4:3':
        return 4 / 3;
      case '3:2':
        return 3 / 2;
      default:
        return null;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !previewImage) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * previewImage.width) / canvas.width;
    const y = ((e.clientY - rect.top) * previewImage.height) / canvas.height;

    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart || !previewImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * previewImage.width) / canvas.width;
    const y = ((e.clientY - rect.top) * previewImage.height) / canvas.height;

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

    // Calculate crop area with boundary constraints
    let cropX = Math.min(dragStart.x, x);
    let cropY = Math.min(dragStart.y, y);
    
    // Ensure crop doesn't exceed image boundaries
    width = Math.min(width, previewImage.width - cropX);
    height = Math.min(height, previewImage.height - cropY);
    cropX = Math.max(0, cropX);
    cropY = Math.max(0, cropY);

    setCropArea({
      x: cropX,
      y: cropY,
      width,
      height,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const applyCrop = () => {
    if (!cropArea || !previewImage || !originalImage) return;

    // Validate crop area
    if (cropArea.width <= 0 || cropArea.height <= 0) {
      toast.error('Invalid crop area');
      return;
    }

    // Calculate the absolute crop coordinates relative to the original image
    // We need to account for any existing crop
    const existingCrop = transform?.crop;
    
    // If there's an existing crop, the current cropArea is relative to that cropped region
    // We need to translate it back to the original image coordinates
    let absoluteCrop: CropArea;
    
    if (existingCrop) {
      // Current crop is relative to the already-cropped image
      // Add the existing crop offset to get absolute coordinates
      absoluteCrop = {
        x: existingCrop.x + cropArea.x,
        y: existingCrop.y + cropArea.y,
        width: cropArea.width,
        height: cropArea.height,
      };
    } else {
      // No existing crop, use cropArea as-is
      absoluteCrop = cropArea;
    }

    const currentTransform = transform || {
      rotation: 0 as const,
      flipHorizontal: false,
      flipVertical: false,
    };

    // Save the crop to state
    dispatch({
      type: 'SET_OPTIONS',
      payload: {
        transform: {
          ...currentTransform,
          crop: absoluteCrop,
        },
      },
    });

    // Update preview to show only the cropped portion
    const canvas = document.createElement('canvas');
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(
        previewImage,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
      );
      const croppedImg = new Image();
      croppedImg.onload = () => {
        setPreviewImage(croppedImg);
        // Reset crop area to show the full cropped image for next potential crop
        setCropArea({
          x: 0,
          y: 0,
          width: croppedImg.width,
          height: croppedImg.height,
        });
      };
      croppedImg.src = canvas.toDataURL();
    }

    toast.success('Crop applied', {
      duration: 2000,
    });
  };

  const resetCrop = () => {
    const currentTransform = transform || {
      rotation: 0 as const,
      flipHorizontal: false,
      flipVertical: false,
    };

    // Clear crop from transform
    dispatch({
      type: 'SET_OPTIONS',
      payload: {
        transform: {
          ...currentTransform,
          crop: undefined,
        },
      },
    });

    // Reload the original image to reset the preview
    if (originalImage) {
      const reloadImage = async () => {
        try {
          const transformedCanvas = applyTransformationsToCanvas(
            originalImage,
            { ...currentTransform, crop: undefined },
            true, // exclude crop
            false // include text overlay
          );
          const transformedImg = await canvasToImage(transformedCanvas);
          setPreviewImage(transformedImg);
          setCropArea({
            x: 0,
            y: 0,
            width: transformedImg.width,
            height: transformedImg.height,
          });
        } catch (error) {
          console.error('Failed to reload image:', error);
          // Fallback to original image
          setPreviewImage(originalImage);
          setCropArea({
            x: 0,
            y: 0,
            width: originalImage.width,
            height: originalImage.height,
          });
        }
      };
      reloadImage();
    }

    toast.success('Crop reset', {
      duration: 2000,
    });
  };

  const hasCrop = transform?.crop !== undefined;

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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crop className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Crop Tool</h2>
        </div>
        {hasCrop && (
          <button
            onClick={resetCrop}
            className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            Reset Crop
          </button>
        )}
      </div>

      {/* Canvas Preview */}
      <div className="mb-4 flex justify-center bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-crosshair border border-gray-300 dark:border-gray-600"
        />
      </div>

      {/* Crop Shape Selection */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Crop Shape
        </label>
        <div className="grid grid-cols-3 gap-2">
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
            className={`flex items-center justify-center gap-2 p-3 border rounded-lg transition-all ${
              cropShape === 'circle'
                ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-primary-900/30'
            }`}
          >
            <Circle className="w-4 h-4" />
            <span className="text-xs font-medium">Circle</span>
          </button>
          <button
            onClick={() => setCropShape('freeform')}
            className={`flex items-center justify-center gap-2 p-3 border rounded-lg transition-all ${
              cropShape === 'freeform'
                ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-primary-900/30'
            }`}
          >
            <Lasso className="w-4 h-4" />
            <span className="text-xs font-medium">Freeform</span>
          </button>
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Aspect Ratio
          </label>
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

      {/* Crop Info */}
      {cropArea && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
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

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={resetCrop}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm transition-colors"
        >
          Reset
        </button>
        <button
          onClick={applyCrop}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm transition-colors"
        >
          Apply Crop
        </button>
      </div>
    </div>
  );
};
