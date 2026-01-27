import React, { useState, useEffect } from 'react';
import { Moon, Sun, ArrowLeft, Info, X, LogIn, User } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { getAuthUser, getBackButtonDestination } from '../lib/sharedAuth';
import type { SharedUser } from '../lib/sharedAuth';

export const Header: React.FC = () => {
  const { isDark, toggle } = useDarkMode();
  const [showInfo, setShowInfo] = useState(false);
  const [user, setUser] = useState<SharedUser | null>(null);
  const [backButton, setBackButton] = useState({ label: 'Back to Tools', url: '/' });

  useEffect(() => {
    // Check if user is authenticated
    const authUser = getAuthUser();
    setUser(authUser);

    // Get back button destination
    const destination = getBackButtonDestination();
    setBackButton(destination);
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a 
              href="https://tools.fawadhs.dev"
              aria-label="Back to Tools"
              className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
            >
              <img src="/image-tools/favicon.svg" alt="Image Tools" className="w-6 h-6" />
            </a>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Preflight Image Tools
                </h1>
                <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full font-medium">
                  BETA
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
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
              href={`https://tools.fawadhs.dev${backButton.url}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
              aria-label={backButton.label}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{backButton.label.replace('Back to ', '')}</span>
            </a>
            {user ? (
              <a
                href="https://tools.fawadhs.dev/dashboard"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 transition-colors text-sm font-medium text-white"
                aria-label="Dashboard"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{user.fullName.split(' ')[0]}</span>
              </a>
            ) : (
              <a
                href="https://tools.fawadhs.dev/login"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 transition-colors text-sm font-medium text-white"
                aria-label="Login"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </a>
            )}
            <button
              onClick={() => setShowInfo(true)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="How to use"
            >
              <Info className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
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

      {/* Info Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowInfo(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How to Use Preflight Image Tools</h2>
              <button
                onClick={() => setShowInfo(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            
            <div className="px-6 py-6 space-y-6">
              {/* Privacy First */}
              <section>
                <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-2">🔒 Privacy First</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  All image processing happens in your browser. No uploads, no tracking, no data collection. Your images never leave your device.
                </p>
              </section>

              {/* Getting Started */}
              <section>
                <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-2">🚀 Getting Started</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li><strong>Upload Images:</strong> Drag & drop or click to select up to 50 images</li>
                  <li><strong>Choose Format:</strong> Select output format (WebP, JPEG, PNG, AVIF)</li>
                  <li><strong>Adjust Quality:</strong> Use the slider to set quality (1-100%)</li>
                  <li><strong>Convert:</strong> Click "Convert All" or convert individually</li>
                  <li><strong>Download:</strong> Get single files or ZIP for batches</li>
                </ol>
              </section>

              {/* Supported Formats */}
              <section>
                <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-2">📸 Supported Formats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-1">Input:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">HEIC, HEIF, JPEG, PNG, GIF, BMP, TIFF, WebP</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-1">Output:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">WebP, JPEG, PNG, AVIF</p>
                  </div>
                </div>
              </section>

              {/* Image Editing Tools */}
              <section>
                <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-2">🎨 Image Editing Tools</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li><strong>✂️ Crop:</strong> Rectangle or circle crop with aspect ratio presets (1:1, 16:9, 4:3, 3:2)</li>
                  <li><strong>🔄 Rotate & Flip:</strong> Rotate 90°/180°/270° or flip horizontally/vertically</li>
                  <li><strong>🎨 Filters:</strong> Adjust brightness, contrast, saturation, or apply grayscale/sepia</li>
                  <li><strong>📝 Text Overlay:</strong> Add watermarks and captions with custom fonts, colors, and opacity</li>
                  <li><strong>📏 Resize:</strong> Custom dimensions with aspect ratio lock</li>
                </ul>
              </section>

              {/* E-commerce Presets */}
              <section>
                <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-2">🛍️ E-commerce Presets</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">Quick presets optimized for online selling:</p>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li>• <strong>Product Images:</strong> 1200px, 85% quality</li>
                  <li>• <strong>Thumbnails:</strong> 400px, 70% quality</li>
                  <li>• <strong>Hero Banners:</strong> 1920px, 90% quality</li>
                </ul>
              </section>

              {/* Shopify Integration */}
              <section className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">🏪 Shopify Integration</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Connect your Shopify store to streamline product image management:
                </p>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li>• <strong>Direct Upload:</strong> Send images straight to Shopify Files or Products</li>
                  <li>• <strong>SKU Mapping:</strong> Auto-match images to products by filename</li>
                  <li>• <strong>Bulk Processing:</strong> Process and upload multiple product images at once</li>
                  <li>• <strong>Optimized Formats:</strong> Auto-convert to Shopify-recommended sizes</li>
                </ul>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Requires Pro or Business subscription. <a href="https://tools.fawadhs.dev/pricing" className="text-green-600 dark:text-green-400 hover:underline">Upgrade now</a>
                </p>
              </section>

              {/* Tips & Tricks */}
              <section>
                <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-2">💡 Tips & Tricks</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• <strong>WebP:</strong> Best for web - smaller files with great quality</li>
                  <li>• <strong>AVIF:</strong> Newest format - smallest files but slower encoding</li>
                  <li>• <strong>Batch Processing:</strong> Apply same settings to multiple images</li>
                  <li>• <strong>Before/After:</strong> Click converted images to compare quality</li>
                  <li>• <strong>History:</strong> View your recent conversions in the History panel</li>
                  <li>• <strong>Mobile:</strong> Fully touch-optimized for mobile editing</li>
                </ul>
              </section>

              {/* NPM Package */}
              <section className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-2">📦 For Developers</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Install as a React component in your project:
                </p>
                <code className="block bg-gray-900 text-gray-100 px-3 py-2 rounded text-sm">
                  npm install @fawadhs/image-tools
                </code>
              </section>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
