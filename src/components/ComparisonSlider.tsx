import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface ComparisonSliderProps {
  originalImage: string;
  convertedImage: string;
  originalSize: number;
  convertedSize: number;
  filename: string;
  onClose: () => void;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  originalImage,
  convertedImage,
  originalSize,
  convertedSize,
  filename,
  onClose,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{
    original: { width: number; height: number };
    converted: { width: number; height: number };
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load both images to get their dimensions
  useEffect(() => {
    const loadImages = async () => {
      const original = new Image();
      const converted = new Image();
      
      await Promise.all([
        new Promise((resolve) => {
          original.onload = () => resolve(null);
          original.src = originalImage;
        }),
        new Promise((resolve) => {
          converted.onload = () => resolve(null);
          converted.src = convertedImage;
        }),
      ]);

      setImageDimensions({
        original: { width: original.naturalWidth, height: original.naturalHeight },
        converted: { width: converted.naturalWidth, height: converted.naturalHeight },
      });
    };

    loadImages();
  }, [originalImage, convertedImage]);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const reduction = Math.round(((originalSize - convertedSize) / originalSize) * 100);

  // Calculate container aspect ratio based on larger image
  const containerAspectRatio = imageDimensions
    ? Math.max(
        imageDimensions.original.width / imageDimensions.original.height,
        imageDimensions.converted.width / imageDimensions.converted.height
      )
    : 16 / 9; // Default to 16:9 while loading

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
      <div className="relative w-full h-full max-w-6xl max-h-[95vh] flex flex-col bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="min-w-0 flex-1 pr-2">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
              Before / After Comparison
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium truncate">
              {filename}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-lg bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/30 border border-gray-300 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-700 transition-all shadow-sm"
            aria-label="Close comparison"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400" />
          </button>
        </div>

        {/* Image Comparison - Flexible height */}
        <div className="flex-1 min-h-0 relative bg-gray-900">
          <div
            ref={containerRef}
            className="absolute inset-0 overflow-hidden cursor-col-resize select-none flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            <div 
              className="relative w-full h-full"
              style={{ 
                maxWidth: '100%',
                maxHeight: '100%',
                aspectRatio: containerAspectRatio 
              }}
            >
              {/* Converted Image - Left Side Only */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img
                  src={convertedImage}
                  alt="Converted"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  draggable={false}
                  style={{ userSelect: 'none' }}
                />
              </div>

              {/* Original Image - Right Side Only */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
              >
                <img
                  src={originalImage}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  draggable={false}
                  style={{ userSelect: 'none' }}
                />
              </div>

              {/* Slider Line */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 px-2 sm:px-4 py-1 sm:py-2 bg-primary-600/90 backdrop-blur-md rounded-md sm:rounded-lg shadow-lg border border-white/20">
                <span className="text-xs sm:text-sm font-bold text-white tracking-wide">AFTER</span>
              </div>
              <div className="absolute top-2 sm:top-4 right-2 sm:right-4 px-2 sm:px-4 py-1 sm:py-2 bg-gray-800/90 backdrop-blur-md rounded-md sm:rounded-lg shadow-lg border border-white/20">
                <span className="text-xs sm:text-sm font-bold text-white tracking-wide">BEFORE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats - Flexible */}
        <div className="flex-shrink-0 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 grid grid-cols-3 gap-2 sm:gap-4 text-center border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Original</p>
            <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white">
              {formatSize(originalSize)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Converted</p>
            <p className="text-sm sm:text-base lg:text-lg font-semibold text-green-600 dark:text-green-400">
              {formatSize(convertedSize)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Reduction</p>
            <p className="text-sm sm:text-base lg:text-lg font-semibold text-primary-600 dark:text-primary-400">
              {reduction}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
