import { Link } from 'react-router-dom';
import { Image, FileText, Palette, Type, ArrowRight, Shield, Github } from 'lucide-react';

export const ToolsIndex = () => {
  const tools = [
    {
      id: 'image-tools',
      icon: Image,
      title: 'Image Tools',
      description: 'Convert images between formats with quality control, resize, and batch processing. Supports HEIC, JPEG, PNG, WebP, and AVIF.',
      badge: 'BETA',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      available: true,
      features: [
        'Client-side conversion (no uploads)',
        'Batch processing up to 50 images',
        'Quality control & resize options',
        'E-commerce presets included',
        'Before/after comparison slider',
        'Conversion history tracking'
      ]
    },
    {
      id: 'pdf-tools',
      icon: FileText,
      title: 'PDF Tools',
      description: 'Merge, split, compress, and convert PDF files. All processing happens locally in your browser.',
      badge: 'Coming Soon',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      available: false,
      features: [
        'Merge multiple PDFs',
        'Split PDFs by page range',
        'Compress large files',
        'Convert to/from images'
      ]
    },
    {
      id: 'color-tools',
      icon: Palette,
      title: 'Color Palette Generator',
      description: 'Generate beautiful color palettes from images or create custom schemes for your design projects.',
      badge: 'Coming Soon',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      available: false,
      features: [
        'Extract colors from images',
        'Generate harmonious palettes',
        'Export as CSS, JSON, or SVG',
        'Accessibility contrast checker'
      ]
    },
    {
      id: 'text-tools',
      icon: Type,
      title: 'Text Tools',
      description: 'Encode, decode, format, and transform text. Includes Base64, URL encoding, Markdown preview, and more.',
      badge: 'Coming Soon',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      available: false,
      features: [
        'Base64 encode/decode',
        'URL encode/decode',
        'JSON formatter & validator',
        'Markdown live preview'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            🛠️ Tools
          </h1>
          <p className="text-xl text-white/90 mb-6">
            Free, privacy-first web tools. No uploads, no tracking.
          </p>
          <a
            href="https://fawadhs.dev"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md text-white rounded-lg hover:bg-white/20 transition-all"
          >
            ← Back to Portfolio
          </a>
        </header>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const content = (
              <>
                <div className="text-5xl mb-4">{<Icon className="w-12 h-12 text-primary-600 dark:text-primary-400" />}</div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {tool.title}
                  </h2>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${tool.badgeColor}`}>
                    {tool.badge}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {tool.description}
                </p>
                <ul className="space-y-2 mb-4">
                  {tool.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-green-500 font-bold mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {tool.available && (
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-medium">
                    Open Tool <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </>
            );

            return tool.available ? (
              <Link
                key={tool.id}
                to={`/${tool.id}`}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-300 block"
              >
                {content}
              </Link>
            ) : (
              <div
                key={tool.id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl opacity-60 cursor-not-allowed"
              >
                {content}
              </div>
            );
          })}
        </div>

        {/* Privacy Notice */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl text-center mb-12">
          <div className="flex justify-center mb-3">
            <Shield className="w-12 h-12 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Your Privacy is Protected
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            All tools process files entirely in your browser. Nothing is uploaded to any server.
            <br />
            No tracking, no analytics, no data collection.
          </p>
        </div>

        {/* Footer */}
        <footer className="text-center text-white/80">
          <p className="mb-2">
            Built with care by{' '}
            <a
              href="https://fawadhs.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline"
            >
              Fawad Hussain
            </a>
          </p>
          <a
            href="https://github.com/FawadHS/image-tools"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <Github className="w-4 h-4" />
            View Source on GitHub
          </a>
        </footer>
      </div>
    </div>
  );
};
