import { ConverterProvider } from '../context/ConverterContext';
import { Header } from '../components/Header';
import { DropZone } from '../components/DropZone';
import { SettingsPanel } from '../components/SettingsPanel';
import { FileList } from '../components/FileList';
import { ActionBar } from '../components/ActionBar';
import { HistoryPanel } from '../components/HistoryPanel';
import { Footer } from '../components/Footer';

export const ImageToolsPage = () => {
  return (
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
              <div className="sticky top-8">
                <SettingsPanel />
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ConverterProvider>
  );
};
