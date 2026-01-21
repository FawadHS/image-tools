import { ConverterProvider } from '../context/ConverterContext';
import { Header } from '../components/Header';
import { DropZone } from '../components/DropZone';
import { SettingsPanel } from '../components/SettingsPanel';
import { ImageEditor } from '../components/ImageEditor';
import { CropTool } from '../components/CropTool';
import { TextOverlayTool } from '../components/TextOverlayTool';
import { FileList } from '../components/FileList';
import { ActionBar } from '../components/ActionBar';
import { HistoryPanel } from '../components/HistoryPanel';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';
import { ReviewForm } from '../components/ReviewForm';
import { ReviewsList } from '../components/ReviewsList';
import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useHeicConversion } from '../hooks/useHeicConversion';

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Drop Zone & File List */}
          <div className="lg:col-span-2 space-y-6">
            <DropZone />
            <FileList />
            <ActionBar />
            <HistoryPanel />
            
            {/* Review Section - Only shown when opened */}
            {(showReviewForm || showReviews) && (
              <div className="mt-6 space-y-6">
                {showReviewForm && (
                  <ReviewForm onClose={() => {
                    setShowReviewForm(false);
                    setShowReviews(true); // Show reviews list after submitting
                  }} />
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
                      <ReviewsList />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Settings */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 custom-scrollbar">
                <ImageEditor />
                <CropTool />
                <TextOverlayTool />
                <SettingsPanel />
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
        title="Image Tools - Convert HEIC, JPEG, PNG to WebP, AVIF | Privacy-First Image Editor"
        description="Free online image converter and editor with crop, rotate, filters, and text overlay. Convert HEIC, JPEG, PNG, GIF to WebP, AVIF. Batch processing, e-commerce presets. All processing in browser - no uploads."
        canonicalPath="/image-tools"
      />
      <ConverterProvider>
        <ImageToolsContent />
      </ConverterProvider>
    </>
  );
};
