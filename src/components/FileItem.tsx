import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check, Loader2, ImageIcon } from 'lucide-react';
import { SelectedFile } from '../types';
import { formatFileSize } from '../utils/fileUtils';
import { isHeicFile } from '../utils/converter';
import heic2any from 'heic2any';

interface FileItemProps {
  file: SelectedFile;
  onRemove: (id: string) => void;
}

export const FileItem: React.FC<FileItemProps> = ({ file, onRemove }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    // For HEIC files, we need to convert for preview
    if (isHeicFile(file.file)) {
      heic2any({
        blob: file.file,
        toType: 'image/jpeg',
        quality: 0.5,
      })
        .then((result) => {
          const blob = Array.isArray(result) ? result[0] : result;
          setPreviewUrl(URL.createObjectURL(blob));
        })
        .catch(() => {
          setPreviewUrl(null);
        });
    } else {
      setPreviewUrl(file.preview);
    }

    return () => {
      if (previewUrl && previewUrl !== file.preview) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file]);

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
      className={`
        relative flex items-center gap-3 p-3 bg-white dark:bg-gray-800 
        rounded-lg border-2 ${statusBorder[file.status]}
        transition-all duration-200
      `}
    >
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
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(file.id)}
        disabled={file.status === 'converting'}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
