import React from 'react';
import { Moon, Sun, Image, ArrowLeft, Github } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

export const Header: React.FC = () => {
  const { isDark, toggle } = useDarkMode();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a 
              href="https://tools.fawadhs.dev" 
              aria-label="Image Tools - Go to tools.fawadhs.dev"
              className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
            >
              <Image className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </a>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Image Tools
                </h1>
                <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full font-medium">
                  BETA
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                by{' '}
                <a 
                  href="https://fawadhs.dev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  fawadhs.dev
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://fawadhs.dev/tools"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
              aria-label="Back to Tools"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Tools</span>
            </a>
            <a
              href="https://github.com/FawadHS/image-tools"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="View on GitHub"
            >
              <Github className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </a>
            <button
              onClick={toggle}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
