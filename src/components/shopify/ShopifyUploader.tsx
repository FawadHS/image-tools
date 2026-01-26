/**
 * Shopify Uploader Component
 * UI for uploading converted images to Shopify
 */

import { useState } from 'react';
import { 
  Upload, 
  Store, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown,
  FolderOpen,
  Package,
  RefreshCw
} from 'lucide-react';
import { useShopify } from '../../context/ShopifyContext';
import { useConverter } from '../../context/ConverterContext';
import { shopifyApi, type ShopifyProduct } from '../../services/shopifyApi';
import { ProductSearch } from './ProductSearch';
import type { SelectedFile } from '../../types';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error' | 'partial';
type UploadDestination = 'files' | 'product';

interface FileUploadResult {
  filename: string;
  success: boolean;
  error?: string;
  fileUrl?: string;
  retries: number;
}

interface UploadProgress {
  total: number;
  completed: number;
  failed: number;
  status: UploadStatus;
  message?: string;
  results: FileUploadResult[];
}

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

export function ShopifyUploader() {
  const { connections, activeConnection, setActiveConnection } = useShopify();
  const { state: converterState } = useConverter();
  
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    status: 'idle',
    results: [],
  });
  const [showConnectionSelect, setShowConnectionSelect] = useState(false);
  const [destination, setDestination] = useState<UploadDestination>('files');
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);

  const activeConnections = connections.filter(c => c.status === 'active');
  
  // Get completed files with results
  const completedFiles: SelectedFile[] = converterState.files.filter(
    (f: SelectedFile) => f.status === 'completed' && f.result
  );

  /**
   * Sleep helper for retry delays
   */
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  /**
   * Upload a single file with retry logic
   */
  const uploadSingleFile = async (
    file: SelectedFile,
    stagedTarget: any,
    connectionId: string
  ): Promise<FileUploadResult> => {
    const filename = file.result!.filename;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Step 1: Upload to staged URL
        const resourceUrl = await shopifyApi.uploadToStaged(
          stagedTarget, 
          file.result!.blob, 
          filename
        );
        
        // Step 2: Complete upload - register in Shopify Files
        await shopifyApi.completeUpload(connectionId, resourceUrl, filename);
        
        return {
          filename,
          success: true,
          fileUrl: resourceUrl,
          retries: attempt,
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error');
        console.error(`[Shopify Upload] Attempt ${attempt + 1} failed for ${filename}:`, err);
        
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY * (attempt + 1)); // Exponential backoff
        }
      }
    }
    
    return {
      filename,
      success: false,
      error: lastError?.message || 'Upload failed after retries',
      retries: MAX_RETRIES,
    };
  };

  /**
   * Upload all completed files to Shopify
   */
  const handleUpload = async () => {
    if (!activeConnection || completedFiles.length === 0) return;
    if (destination === 'product' && !selectedProduct) return;

    setUploadProgress({
      total: completedFiles.length,
      completed: 0,
      failed: 0,
      status: 'uploading',
      results: [],
    });

    const results: FileUploadResult[] = [];
    const uploadedUrls: string[] = [];

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

      // Upload each file with retry logic
      for (let i = 0; i < completedFiles.length; i++) {
        const file = completedFiles[i];
        const target = stagedTargets[i];

        const result = await uploadSingleFile(file, target, activeConnection.id);
        results.push(result);
        
        if (result.success && result.fileUrl) {
          uploadedUrls.push(result.fileUrl);
        }

        setUploadProgress(prev => ({
          ...prev,
          completed: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results: [...results],
        }));
      }

      // If uploading to product, attach media
      if (destination === 'product' && selectedProduct && uploadedUrls.length > 0) {
        try {
          await shopifyApi.attachMediaToProduct(
            activeConnection.id,
            selectedProduct.id,
            uploadedUrls
          );
        } catch (err) {
          console.error('[Shopify Upload] Failed to attach media to product:', err);
          // Files were uploaded, but attachment failed
          setUploadProgress(prev => ({
            ...prev,
            status: 'partial',
            message: `Uploaded ${uploadedUrls.length} images but failed to attach to product: ${err instanceof Error ? err.message : 'Unknown error'}`,
          }));
          return;
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      let status: UploadStatus = 'success';
      let message = '';

      if (failCount === 0) {
        status = 'success';
        message = destination === 'product' 
          ? `Successfully uploaded ${successCount} images to ${selectedProduct?.title}!`
          : `Successfully uploaded ${successCount} images to Shopify Files!`;
      } else if (successCount > 0) {
        status = 'partial';
        message = `Uploaded ${successCount} images, ${failCount} failed`;
      } else {
        status = 'error';
        message = 'All uploads failed. Please try again.';
      }

      setUploadProgress(prev => ({
        ...prev,
        status,
        message,
      }));

    } catch (error) {
      console.error('[Shopify Upload] Batch upload error:', error);
      setUploadProgress(prev => ({
        ...prev,
        status: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
      }));
    }
  };

  /**
   * Retry failed uploads
   */
  const handleRetryFailed = async () => {
    const failedResults = uploadProgress.results.filter(r => !r.success);
    if (failedResults.length === 0 || !activeConnection) return;

    // Find the corresponding files
    const failedFiles = completedFiles.filter(f => 
      failedResults.some(r => r.filename === f.result?.filename)
    );

    if (failedFiles.length === 0) return;

    setUploadProgress(prev => ({
      ...prev,
      status: 'uploading',
      message: `Retrying ${failedFiles.length} failed uploads...`,
    }));

    try {
      const filesMeta = failedFiles.map((f: SelectedFile) => ({
        filename: f.result!.filename,
        mimeType: f.result!.blob.type,
        fileSize: f.result!.blob.size,
      }));

      const { stagedTargets } = await shopifyApi.createStagedUploads(
        activeConnection.id,
        filesMeta
      );

      const newResults = [...uploadProgress.results];
      
      for (let i = 0; i < failedFiles.length; i++) {
        const file = failedFiles[i];
        const target = stagedTargets[i];
        const result = await uploadSingleFile(file, target, activeConnection.id);
        
        // Update the result in the array
        const idx = newResults.findIndex(r => r.filename === result.filename);
        if (idx !== -1) {
          newResults[idx] = result;
        }
      }

      const successCount = newResults.filter(r => r.success).length;
      const failCount = newResults.filter(r => !r.success).length;

      setUploadProgress({
        total: uploadProgress.total,
        completed: successCount,
        failed: failCount,
        status: failCount === 0 ? 'success' : 'partial',
        message: failCount === 0 
          ? `All ${successCount} images uploaded successfully!`
          : `Uploaded ${successCount} images, ${failCount} still failing`,
        results: newResults,
      });

    } catch (error) {
      console.error('[Shopify Upload] Retry error:', error);
      setUploadProgress(prev => ({
        ...prev,
        status: 'error',
        message: error instanceof Error ? error.message : 'Retry failed',
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
      results: [],
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
            Store
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

      {/* Destination Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Upload to
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setDestination('files');
              setSelectedProduct(null);
            }}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-colors ${
              destination === 'files'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span className="text-sm font-medium">Files Library</span>
          </button>
          <button
            onClick={() => setDestination('product')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-colors ${
              destination === 'product'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="text-sm font-medium">Product</span>
          </button>
        </div>
      </div>

      {/* Product Search (when product destination selected) */}
      {destination === 'product' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Select Product
          </label>
          <ProductSearch
            selectedProduct={selectedProduct}
            onSelect={setSelectedProduct}
            onClear={() => setSelectedProduct(null)}
          />
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
                {uploadProgress.completed + uploadProgress.failed}/{uploadProgress.total}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ 
                  width: `${((uploadProgress.completed + uploadProgress.failed) / uploadProgress.total) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Success Message */}
        {uploadProgress.status === 'success' && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="text-sm text-green-700 dark:text-green-300">
              {uploadProgress.message}
            </span>
          </div>
        )}

        {/* Partial Success Message */}
        {uploadProgress.status === 'partial' && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {uploadProgress.message}
              </span>
            </div>
            {uploadProgress.results.filter(r => !r.success).length > 0 && (
              <div className="mt-2 space-y-1">
                {uploadProgress.results.filter(r => !r.success).slice(0, 3).map((result, idx) => (
                  <p key={idx} className="text-xs text-amber-600 dark:text-amber-400">
                    • {result.filename}: {result.error}
                  </p>
                ))}
                {uploadProgress.results.filter(r => !r.success).length > 3 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    • and {uploadProgress.results.filter(r => !r.success).length - 3} more...
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {uploadProgress.status === 'error' && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300">
              {uploadProgress.message}
            </span>
          </div>
        )}

        {/* Upload Button */}
        {uploadProgress.status === 'idle' && (
          <button
            onClick={handleUpload}
            disabled={destination === 'product' && !selectedProduct}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
              destination === 'product' && !selectedProduct
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            {destination === 'product' && selectedProduct
              ? `Upload to ${selectedProduct.title}`
              : `Upload to ${activeConnection.shopName}`}
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

        {/* Post-upload actions */}
        {(uploadProgress.status === 'success' || uploadProgress.status === 'partial' || uploadProgress.status === 'error') && (
          <div className="flex gap-2">
            {uploadProgress.results.some(r => !r.success) && (
              <button
                onClick={handleRetryFailed}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Failed ({uploadProgress.failed})
              </button>
            )}
            <button
              onClick={resetUpload}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-white rounded-lg font-medium transition-colors ${
                uploadProgress.results.some(r => !r.success) ? '' : 'flex-1'
              }`}
            >
              {uploadProgress.results.some(r => !r.success) ? 'Done' : 'Upload More'}
            </button>
          </div>
        )}
      </div>

      {/* Destination note */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {destination === 'product' 
          ? 'Images will be added to the product\'s media gallery'
          : 'Images will be uploaded to your Shopify Files library'}
      </p>
    </div>
  );
}

export default ShopifyUploader;
