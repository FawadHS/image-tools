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
import { useState } from 'react';
import { MessageSquare } from 'lucide-react';

export const ImageToolsPage = () => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  return (
    <>
      <SEO
        title="Image Tools - Convert HEIC, JPEG, PNG to WebP, AVIF | Privacy-First Image Editor"
        description="Free online image converter and editor with crop, rotate, filters, and text overlay. Convert HEIC, JPEG, PNG, GIF to WebP, AVIF. Batch processing, e-commerce presets. All processing in browser - no uploads."
        canonicalPath="/image-tools"
      />
      <ConverterProvider>
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
              
              {/* Review Form Section */}
              {showReviewForm && (
                <div className="mt-6">
                  <ReviewForm onClose={() => setShowReviewForm(false)} />
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
        {!showReviewForm && (
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
    </ConverterProvider>
    </>
  );
};
