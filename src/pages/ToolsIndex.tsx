import { Link } from 'react-router-dom';
import { Image } from 'lucide-react';

export const ToolsIndex = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col">
      <div className="max-w-3xl mx-auto px-6 py-16 flex-1">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-primary-100 dark:bg-primary-900 rounded-2xl">
            <Image className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">Tools</h1>
          <p className="text-gray-600 dark:text-gray-400">Privacy-first utilities by{' '}
            <a
              href="https://fawadhs.dev"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              fawadhs.dev
            </a>
          </p>
        </header>

        {/* Image Tools Card */}
        <Link
          to="/image-tools"
          className="block p-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-lg transition-all mb-12"
        >
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
              <Image className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold">Image Tools</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 uppercase tracking-wide">
                  Live
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                Convert images between formats. HEIC, JPEG, PNG, WebP, AVIF. Quality control, resize, and batch processing.
              </p>
              <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium text-sm">
                Open Tool →
              </div>
            </div>
          </div>
        </Link>

        {/* Privacy Notice */}
        <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            <strong className="text-gray-900 dark:text-white">Client-side processing</strong>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No uploads. No tracking. No data collection.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 py-8">
        <p>
          Built by{' '}
          <a
            href="https://fawadhs.dev"
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            Fawad Hussain
          </a>
        </p>
      </footer>
    </div>
  );
};
