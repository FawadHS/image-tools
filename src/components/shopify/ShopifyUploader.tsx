/**
 * Shopify Uploader Component
 * UI for uploading converted images to Shopify
 */

import { useState } from 'react';
import { Upload, Store, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { useShopify } from '../../context/ShopifyContext';
import { useConverter } from '../../context/ConverterContext';
import { shopifyApi } from '../../services/shopifyApi';
import type { SelectedFile } from '../../types';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadProgress {
  total: number;
  completed: number;
  failed: number;
  status: UploadStatus;
  message?: string;
}

export function ShopifyUploader() {
  const { connections, activeConnection, setActiveConnection } = useShopify();
  const { state: converterState } = useConverter();
  
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    status: 'idle',
  });
  const [showConnectionSelect, setShowConnectionSelect] = useState(false);

  const activeConnections = connections.filter(c => c.status === 'active');
  
  // Get completed files with results
  const completedFiles: SelectedFile[] = converterState.files.filter(
    (f: SelectedFile) => f.status === 'completed' && f.result
  );

  /**
   * Upload all completed files to Shopify
   */
  const handleUpload = async () => {
    if (!activeConnection || completedFiles.length === 0) return;

    setUploadProgress({
      total: completedFiles.length,
      completed: 0,
      failed: 0,
      status: 'uploading',
    });

    try {
      // Prepare file metadata for staged uploads
      const filesMeta = completedFiles.map((f: SelectedFile) => ({
        filename: f.result!.filename,
        mimeType: f.result!.blob.type,
        fileSize: f.result!.blob.size,
      }));

      // Get staged upload URLs
      const { stagedTargets } = await shopifyApi.createStagedUploads(
        activeConnection.id,
        filesMeta
      );

      let completed = 0;
      let failed = 0;

      // Upload each file
      for (let i = 0; i < completedFiles.length; i++) {
        const file = completedFiles[i];
        const target = stagedTargets[i];

        try {
          await shopifyApi.uploadToStaged(target, file.result!.blob);
          completed++;
        } catch {
          failed++;
        }

        setUploadProgress(prev => ({
          ...prev,
          completed,
          failed,
        }));
      }

      setUploadProgress(prev => ({
        ...prev,
        status: failed === 0 ? 'success' : (completed > 0 ? 'success' : 'error'),
        message: failed === 0 
          ? `Successfully uploaded ${completed} images to Shopify!`
          : `Uploaded ${completed} images, ${failed} failed`,
      }));

    } catch (error) {
      setUploadProgress(prev => ({
        ...prev,
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
      }));
    }
  };

  /**
   * Reset upload state
   */
  const resetUpload = () => {
    setUploadProgress({
      total: 0,
      completed: 0,
      failed: 0,
      status: 'idle',
    });
  };

  // No active connection
  if (!activeConnection) {
    return (
      <div className="text-center py-8">
        <Store className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Connect a Shopify store to start uploading
        </p>
      </div>
    );
  }

  // No completed files
  if (completedFiles.length === 0) {
    return (
      <div className="text-center py-8">
        <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Convert some images first, then upload to Shopify
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Selector */}
      {activeConnections.length > 1 && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Upload to
          </label>
          <button
            onClick={() => setShowConnectionSelect(!showConnectionSelect)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-left"
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-gray-900 dark:text-white">
                {activeConnection.shopName}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showConnectionSelect ? 'rotate-180' : ''}`} />
          </button>
          
          {showConnectionSelect && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
              {activeConnections.map(conn => (
                <button
                  key={conn.id}
                  onClick={() => {
                    setActiveConnection(conn);
                    setShowConnectionSelect(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                >
                  <Store className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-900 dark:text-white">{conn.shopName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Summary */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Ready to Upload
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {completedFiles.length} image{completedFiles.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {/* Preview thumbnails */}
        <div className="flex flex-wrap gap-2 mb-4">
          {completedFiles.slice(0, 6).map((file: SelectedFile) => (
            <div
              key={file.id}
              className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600"
            >
              <img
                src={file.displayPreview || file.preview}
                alt={file.file.name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {completedFiles.length > 6 && (
            <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 font-medium">
              +{completedFiles.length - 6}
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploadProgress.status === 'uploading' && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {uploadProgress.completed}/{uploadProgress.total}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ 
                  width: `${(uploadProgress.completed / uploadProgress.total) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Success Message */}
        {uploadProgress.status === 'success' && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm text-green-700 dark:text-green-300">
              {uploadProgress.message}
            </span>
          </div>
        )}

        {/* Error Message */}
        {uploadProgress.status === 'error' && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-300">
              {uploadProgress.message}
            </span>
          </div>
        )}

        {/* Upload Button */}
        {uploadProgress.status === 'idle' && (
          <button
            onClick={handleUpload}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload to {activeConnection.shopName}
          </button>
        )}

        {uploadProgress.status === 'uploading' && (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading...
          </button>
        )}

        {(uploadProgress.status === 'success' || uploadProgress.status === 'error') && (
          <button
            onClick={resetUpload}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-white rounded-lg font-medium transition-colors"
          >
            Upload More
          </button>
        )}
      </div>

      {/* Destination note */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Images will be uploaded to your Shopify Files library
      </p>
    </div>
  );
}

export default ShopifyUploader;
