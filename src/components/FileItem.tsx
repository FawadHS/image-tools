import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check, Loader2, ImageIcon, Eye } from 'lucide-react';
import { SelectedFile } from '../types';
import { formatFileSize } from '../utils/fileUtils';
import { ComparisonSlider } from './ComparisonSlider';
import { useConverter } from '../context/ConverterContext';

interface FileItemProps {
  file: SelectedFile;
  onRemove: (id: string) => void;
  onToggleSelect?: (id: string) => void;
  isActive?: boolean;
}

export const FileItem: React.FC<FileItemProps> = ({ file, onRemove, onToggleSelect, isActive = false }) => {
  const { dispatch } = useConverter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const handleClick = () => {
    dispatch({ type: 'SET_ACTIVE_FILE', payload: file.id });
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect?.(file.id);
  };

  // Use centralized displayPreview (already converted for HEIC files)
  // This avoids duplicate HEIC conversion - conversion happens once in useHeicConversion hook
  useEffect(() => {
    setPreviewUrl(file.displayPreview || file.preview);
  }, [file.displayPreview, file.preview]);

  // Handle original image URL for comparison
  // Uses displayPreview which is already converted for HEIC files
  useEffect(() => {
    // Use displayPreview for comparison original (already browser-displayable)
    if (file.displayPreview) {
      setOriginalImageUrl(file.displayPreview);
    } else {
      // Fallback for non-HEIC files
      const url = URL.createObjectURL(file.file);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file.displayPreview, file.file]);

  // Handle converted image URL
  useEffect(() => {
    if (file.result?.blob) {
      // Create blob URL once and store it
      const url = URL.createObjectURL(file.result.blob);
      setConvertedUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setConvertedUrl(null);
    }
  }, [file.result]);

  const statusIcon = {
    pending: null,
    converting: <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />,
    completed: <Check className="w-4 h-4 text-green-500" />,
    error: <AlertCircle className="w-4 h-4 text-red-500" />,
  };

  const statusBorder = {
    pending: 'border-gray-200 dark:border-gray-700',
    converting: 'border-primary-400 dark:border-primary-500',
    completed: 'border-green-400 dark:border-green-500',
    error: 'border-red-400 dark:border-red-500',
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative flex items-center gap-3 p-3 bg-white dark:bg-gray-800 
        rounded-lg border-2 ${statusBorder[file.status]}
        transition-all duration-200 cursor-pointer
        ${isActive ? 'ring-2 ring-primary-500 dark:ring-primary-400' : 'hover:border-primary-300 dark:hover:border-primary-600'}
      `}
      role="button"
      tabIndex={0}
      aria-label={`Select ${file.file.name} for editing`}
    >
      {/* Selection Checkbox */}
      {onToggleSelect && (
        <div onClick={handleCheckboxClick} className="flex-shrink-0">
          <input
            type="checkbox"
            checked={file.selected ?? false}
            onChange={() => {}}
            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
            aria-label={`Select ${file.file.name} for conversion`}
          />
        </div>
      )}

      {/* Preview */}
      <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={file.file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {file.file.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(file.file.size)}
          {file.result && (
            <span className="text-green-600 dark:text-green-400 ml-2">
              → {formatFileSize(file.result.convertedSize)} ({file.result.reduction}% smaller)
            </span>
          )}
        </p>
        {file.error && (
          <p className="text-xs text-red-500 mt-1">{file.error}</p>
        )}
      </div>

      {/* Status & Progress */}
      <div className="flex items-center gap-2">
        {file.status === 'converting' && (
          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}
        {statusIcon[file.status]}
        
        {/* Compare Button - show only when conversion is complete */}
        {file.status === 'completed' && file.result && (
          <button
            onClick={() => setShowComparison(true)}
            className="p-1 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded transition-colors"
            aria-label="Compare before and after"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(file.id)}
        disabled={file.status === 'converting'}
        aria-label={`Remove ${file.file.name}`}
        aria-disabled={file.status === 'converting'}
        tabIndex={0}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <X className="w-4 h-4" />
      </button>
      
      {/* Comparison Modal */}
      {showComparison && file.result && originalImageUrl && convertedUrl && (
        <ComparisonSlider
          originalImage={originalImageUrl}
          convertedImage={convertedUrl}
          originalSize={file.file.size}
          convertedSize={file.result.convertedSize}
          filename={file.file.name}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
};
