import React from 'react';
import { Download, Archive, Loader2, XCircle } from 'lucide-react';
import { useFileSelection } from '../hooks/useFileSelection';
import { useImageConverter } from '../hooks/useImageConverter';
import { downloadFile, downloadAsZip } from '../utils/fileUtils';

export const ActionBar: React.FC = () => {
  const { files, completedFiles, pendingFiles, selectedFiles } = useFileSelection();
  const { convertAll, convertSelected, cancelConversion, isConverting } = useImageConverter();

  const handleDownloadAll = async () => {
    const results = completedFiles
      .map((f) => f.result)
      .filter((r): r is NonNullable<typeof r> => r !== undefined);

    if (results.length === 0) return;

    if (results.length === 1) {
      downloadFile(results[0].blob, results[0].filename);
    } else {
      await downloadAsZip(results);
    }
  };

  const handleDownloadSingle = (fileId: string) => {
    const file = completedFiles.find((f) => f.id === fileId);
    if (file?.result) {
      downloadFile(file.result.blob, file.result.filename);
    }
  };

  const canConvert = pendingFiles.length > 0 || files.some((f) => f.status === 'error');
  const canConvertSelected = selectedFiles.length > 0;
  const hasCompleted = completedFiles.length > 0;

  if (files.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Convert Buttons */}
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Convert Selected Button */}
          {canConvertSelected && (
            <button
              onClick={convertSelected}
              disabled={!canConvertSelected || isConverting}
              data-testid="convert-selected-button"
              className={`
                flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium flex-1 sm:flex-none
                transition-all duration-200
                ${canConvertSelected && !isConverting
                  ? 'bg-primary-600 hover:bg-primary-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  Convert Selected ({selectedFiles.length})
                </>
              )}
            </button>
          )}

          {/* Convert All Button */}
          <button
            onClick={convertAll}
            disabled={!canConvert || isConverting}
            data-testid="convert-button"
            className={`
              flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium flex-1 sm:flex-none
              transition-all duration-200
              ${canConvert && !isConverting
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isConverting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                Convert {pendingFiles.length > 0 ? `All (${pendingFiles.length})` : 'All'}
              </>
            )}
          </button>

          {/* Cancel Button - shown while converting */}
          {isConverting && (
            <button
              onClick={cancelConversion}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-all"
            >
              <XCircle className="w-5 h-5" />
              Cancel
            </button>
          )}
        </div>

        {/* Download Buttons */}
        {hasCompleted && (
          <div className="flex gap-2 w-full sm:w-auto">
            {completedFiles.length === 1 ? (
              <button
                onClick={() => handleDownloadSingle(completedFiles[0].id)}
                data-testid="download-button"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium w-full sm:w-auto"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            ) : (
              <button
                onClick={handleDownloadAll}
                data-testid="download-all-button"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium w-full sm:w-auto"
              >
                <Archive className="w-4 h-4" />
                Download All as ZIP ({completedFiles.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary */}
      {files.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Pending: {pendingFiles.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Completed: {completedFiles.length}
              </span>
            </div>
            {files.some((f) => f.status === 'error') && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Errors: {files.filter((f) => f.status === 'error').length}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
