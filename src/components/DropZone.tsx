import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ImagePlus } from 'lucide-react';
import { useFileSelection } from '../hooks/useFileSelection';
import { ACCEPTED_FILE_TYPES, MAX_FILES } from '../constants';

export const DropZone: React.FC = () => {
  const { addFiles, fileCount, isAtLimit } = useFileSelection();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      addFiles(acceptedFiles);
    },
    [addFiles]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    disabled: isAtLimit,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
        transition-all duration-200 ease-in-out
        ${isDragActive && !isDragReject
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : isDragReject
          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
          : isAtLimit
          ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
          : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }
      `}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4">
        <div
          className={`
            p-4 rounded-full
            ${isDragActive
              ? 'bg-primary-100 dark:bg-primary-800'
              : 'bg-gray-100 dark:bg-gray-700'
            }
          `}
        >
          {isDragActive ? (
            <ImagePlus className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          ) : (
            <Upload className="w-8 h-8 text-gray-500 dark:text-gray-400" />
          )}
        </div>

        <div>
          {isDragActive ? (
            <p className="text-lg font-medium text-primary-600 dark:text-primary-400">
              Drop images here...
            </p>
          ) : isAtLimit ? (
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
              Maximum {MAX_FILES} files reached
            </p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
                Drop images here or{' '}
                <span className="text-primary-600 dark:text-primary-400">browse</span>
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Supports: HEIC, JPEG, PNG, GIF, BMP, TIFF, WebP
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Maximum {MAX_FILES} files • 50MB per file
              </p>
            </>
          )}
        </div>

        {fileCount > 0 && (
          <div className="mt-2 px-3 py-1 bg-primary-100 dark:bg-primary-900 rounded-full">
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              {fileCount} / {MAX_FILES} files selected
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
