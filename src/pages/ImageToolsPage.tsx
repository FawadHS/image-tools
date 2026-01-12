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

export const ImageToolsPage = () => {
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
      </div>
    </ConverterProvider>
    </>
  );
};
