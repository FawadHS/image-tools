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
import { MessageSquare, ChevronDown, Image as ImageIcon, History as HistoryIcon, X } from 'lucide-react';
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

const ShopifyLogo = () => (
  <svg
    viewBox="0 0 256 291"
    className="h-4 w-4 text-[#95bf47]"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M210.7 61.7c-.2-.5-.5-1.1-.9-1.5l-29.7-31.6c-1.1-1.1-2.9-1-4-.6l-17.9 5.6c-4.7-13.6-13.1-26-27.5-25.6-0.4 0-0.8 0-1.2.1-3.6-4.8-8.1-6.9-12.1-6.7-30.9 1.5-45.7 39.4-50.3 58.8l-26.1 8.1c-7.6 2.4-7.8 2.7-8.8 9.9-.8 5.4-20.7 159-20.7 159l160.6 30.5 87-21.7s-21.8-154.1-22.3-155.3zM136.9 35.7l-37.4 11.7c3.6-13.9 10.4-27.6 20.7-34.5 3.8-2.5 7.3-3.8 10.5-3.6 3.4 7.7 5 17.1 6.2 26.4zm-30.4-30.1c-2.9.6-5.8 1.8-8.7 3.6-13.7 8.8-22.1 26.7-26.2 42.7L41 62.3c6.2-21.1 20.4-50.8 45.9-56.3 7.2-1.6 13.2.3 19.6 4.6zM143 84.3c-1.6-.1-3.3 0-5 .2-15.2 1.8-22.7 14.3-21.9 28.2 1.1 18.5 25.2 23.6 26.6 36.4 1 9.9-5.1 16.9-14.3 17.9-11 1.3-17.8-5.6-17.8-5.6l-3.4 14.3s6.8 6.3 20.5 6.3c0 0 1.7-.1 2.5-.2 17.4-2 27.1-14.4 26.1-30.4-1.3-21.6-25.3-25-26.7-36.6-.8-7.6 3.8-15.2 15-16.5 9.1-1.1 13.8 3.3 13.8 3.3l3.6-13.6c0 .1-4.7-3.2-18.9-3.9z"
    />
  </svg>
);

// Inner component that uses hooks requiring ConverterProvider context
const ImageToolsContent = () => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const closeReviewModal = () => {
    setShowReviewForm(false);
    setShowReviews(false);
  };
  
  // Auto-convert HEIC files when added
  useHeicConversion();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Tier Limits Banner */}
        <TierLimitsBanner />
        
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3.2fr)_minmax(0,1fr)] gap-6">
          {/* Primary Column - Upload, Queue, Actions, Editor */}
          <div className="space-y-6">
            <DropZone />
            <FileList />
            <ActionBar />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary-400" />
                  Edit & Preview
                </h2>
                <span className="text-xs text-gray-500 dark:text-gray-400">Optional</span>
              </div>
              <div className="space-y-6">
                <ImageEditor />
                <CropTool />
                <TextOverlayTool />
              </div>
            </div>

            {/* History is now a right-side drawer */}
            
            {/* Review Modal */}
            {(showReviewForm || showReviews) && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={closeReviewModal}
              >
                <div className="absolute inset-0 bg-black/40" />
                <div
                  className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {showReviewForm ? 'Leave a Review' : 'Reviews'}
                    </h2>
                    <button
                      onClick={closeReviewModal}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Close reviews"
                    >
                      <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                  <div className="p-5 overflow-y-auto">
                    {showReviewForm && (
                      <Suspense fallback={null}>
                        <ReviewForm
                          onClose={() => {
                            setShowReviewForm(false);
                            setShowReviews(true);
                          }}
                        />
                      </Suspense>
                    )}
                    {showReviews && (
                      <Suspense fallback={null}>
                        <ReviewsList />
                      </Suspense>
                    )}
                  </div>
                </div>
              </div>
            )}
            </div>

            {/* Secondary Column - Settings Stack */}
            <div>
              <div className="sticky top-8 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 custom-scrollbar">
                <SettingsPanel />
                <Suspense fallback={null}>
                  <ExifPanel />
                </Suspense>
                {/* Shopify Panel - Show for all users with upgrade prompts */}
                <details className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ShopifyLogo />
                      Shopify Integration
                    </span>
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

      {/* History Drawer Toggle */}
      <button
        onClick={() => setShowHistoryDrawer(true)}
        className="fixed bottom-20 right-6 p-4 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all z-40 group"
        aria-label="Open history"
      >
        <HistoryIcon className="w-6 h-6" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          History
        </span>
      </button>

      {showHistoryDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setShowHistoryDrawer(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-full sm:w-96 bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HistoryIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">History</h2>
              </div>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close history"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            <Suspense fallback={null}>
              <HistoryPanel variant="drawer" defaultExpanded />
            </Suspense>
          </div>
        </div>
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
