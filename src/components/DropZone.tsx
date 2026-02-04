import React, { useCallback, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ImagePlus } from 'lucide-react';
import { useFileSelection } from '../hooks/useFileSelection';
import { ACCEPTED_FILE_TYPES, MAX_FILES } from '../constants';
import { fetchImageFromUrl } from '../utils/urlImport';
import toast from 'react-hot-toast';

export const DropZone: React.FC = () => {
  const { addFiles, fileCount, isAtLimit } = useFileSelection();
  const [urlInput, setUrlInput] = useState('');
  const [useProxy, setUseProxy] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const proxyBase = useMemo(() => import.meta.env.VITE_IMAGE_PROXY_URL as string | undefined, []);

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

  const handleUrlImport = async () => {
    if (!urlInput.trim()) {
      toast.error('Paste an image URL first');
      return;
    }

    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
      toast.error('URL must start with http:// or https://');
      return;
    }

    if (useProxy && !proxyBase) {
      toast.error('Proxy is not configured');
      return;
    }

    try {
      setIsFetching(true);
      const file = await fetchImageFromUrl(urlInput.trim(), useProxy, proxyBase);
      addFiles([file]);
      setUrlInput('');
      toast.success('Image imported');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import image';
      toast.error(message);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="space-y-4">
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
        role="region"
        aria-label="Image file drop zone. Drag and drop images here or browse to select files."
        tabIndex={0}
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

          <div className="text-center px-2">
            {isDragActive ? (
              <p className="text-base sm:text-lg font-medium text-primary-600 dark:text-primary-400">
                Drop images here...
              </p>
            ) : isAtLimit ? (
              <p className="text-base sm:text-lg font-medium text-gray-500 dark:text-gray-400">
                Maximum {MAX_FILES} files reached
              </p>
            ) : (
              <>
                <p className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-200">
                  Drop images here or{' '}
                  <span className="text-primary-600 dark:text-primary-400">browse</span>
                </p>
                <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Supports: HEIC, JPEG, PNG, GIF, BMP, TIFF, WebP
                </p>
                <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                  Maximum {MAX_FILES} files - 50MB per file
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

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="image-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Import from URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="image-url"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleUrlImport}
                disabled={isFetching}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isFetching ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={useProxy}
                onChange={() => setUseProxy((prev) => !prev)}
                disabled={!proxyBase}
                className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
              />
              Use proxy (if configured)
            </label>
            {!proxyBase && (
              <span className="text-xs text-gray-400">Proxy not configured</span>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            CORS note: some URLs block direct browser downloads. If import fails, enable proxy or host the image with
            CORS headers enabled.
          </p>
        </div>
      </div>
    </div>
  );
};
