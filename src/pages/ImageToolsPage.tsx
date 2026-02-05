import { ConverterProvider } from '../context/ConverterContext';
import { Header } from '../components/Header';
import { DropZone } from '../components/DropZone';
import { SettingsPanel } from '../components/SettingsPanel';
import { ImageEditor } from '../components/ImageEditor';
import { CropTool } from '../components/CropTool';
import { TextOverlayTool } from '../components/TextOverlayTool';
import { FileList } from '../components/FileList';
import { ActionBar } from '../components/ActionBar';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';
import { TierLimitsBanner } from '../components/TierLimitsBanner';
import { lazy, Suspense, useState } from 'react';
import { MessageSquare, ChevronDown } from 'lucide-react';
import { useHeicConversion } from '../hooks/useHeicConversion';

const HistoryPanel = lazy(() =>
  import('../components/HistoryPanel').then((module) => ({ default: module.HistoryPanel }))
);
const ReviewForm = lazy(() =>
  import('../components/ReviewForm').then((module) => ({ default: module.ReviewForm }))
);
const ReviewsList = lazy(() =>
  import('../components/ReviewsList').then((module) => ({ default: module.ReviewsList }))
);
const ShopifyPanel = lazy(() =>
  import('../components/shopify/ShopifyPanel').then((module) => ({ default: module.ShopifyPanel }))
);
const ExifPanel = lazy(() =>
  import('../components/ExifPanel').then((module) => ({ default: module.ExifPanel }))
);

// Inner component that uses hooks requiring ConverterProvider context
const ImageToolsContent = () => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  
  // Auto-convert HEIC files when added
  useHeicConversion();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Tier Limits Banner */}
        <TierLimitsBanner />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary Column - Upload, Queue, Actions, Editor */}
          <div className="lg:col-span-2 space-y-6">
            <DropZone />
            <FileList />
            <ActionBar />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit & Preview</h2>
                <span className="text-xs text-gray-500 dark:text-gray-400">Optional</span>
              </div>
              <div className="space-y-6">
                <ImageEditor />
                <CropTool />
                <TextOverlayTool />
              </div>
            </div>

            <Suspense fallback={null}>
              <HistoryPanel />
            </Suspense>
            
            {/* Review Section - Only shown when opened */}
            {(showReviewForm || showReviews) && (
              <div className="mt-6 space-y-6">
                {showReviewForm && (
                  <Suspense fallback={null}>
                    <ReviewForm onClose={() => {
                      setShowReviewForm(false);
                      setShowReviews(true); // Show reviews list after submitting
                    }} />
                  </Suspense>
                )}
                  
                  {showReviews && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reviews</h2>
                        <button
                          onClick={() => setShowReviews(false)}
                          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          Hide
                        </button>
                      </div>
                      <Suspense fallback={null}>
                        <ReviewsList />
                      </Suspense>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Secondary Column - Settings Stack */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 custom-scrollbar">
                <SettingsPanel />
                <Suspense fallback={null}>
                  <ExifPanel />
                </Suspense>
                {/* Shopify Panel - Show for all users with upgrade prompts */}
                <details className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                    <span>Shopify Integration</span>
                    <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-4 pb-4 pt-1">
                    <Suspense fallback={null}>
                      <ShopifyPanel />
                    </Suspense>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </main>

        <Footer />
        
        {/* Floating Review Button */}
      {!showReviewForm && !showReviews && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="fixed bottom-6 right-6 p-4 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-40 group"
          aria-label="Leave a review"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Leave a Review
          </span>
        </button>
      )}
    </div>
  );
};

export const ImageToolsPage = () => {
  return (
    <>
      <SEO
        title="Image Preflight - Convert HEIC, JPEG, PNG to WebP, AVIF | Preflight Suite"
        description="Free online image converter and editor with crop, rotate, filters, and text overlay. Convert HEIC, JPEG, PNG, GIF to WebP, AVIF. Batch processing, e-commerce presets. All processing in browser - no uploads."
        canonicalPath="/image-tools"
      />
      <ConverterProvider>
        <ImageToolsContent />
      </ConverterProvider>
    </>
  );
};
