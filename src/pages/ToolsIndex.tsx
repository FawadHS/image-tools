import { Link } from 'react-router-dom';

export const ToolsIndex = () => {
  const tools = [
    {
      id: 'image-tools',
      icon: '🖼️',
      title: 'Image Tools',
      description: 'Convert images between formats. HEIC, JPEG, PNG, WebP, AVIF. Quality control, resize, batch processing.',
      badge: 'Live',
      available: true,
      link: '/image-tools',
    },
    {
      id: 'pdf-tools',
      icon: '📄',
      title: 'PDF Tools',
      description: 'Merge, split, compress PDFs. Client-side processing.',
      badge: 'Soon',
      available: false,
      link: '',
    },
    {
      id: 'color-tools',
      icon: '🎨',
      title: 'Color Tools',
      description: 'Extract palettes, check contrast, generate schemes.',
      badge: 'Soon',
      available: false,
      link: '',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="text-4xl mb-3">🛠️</div>
          <h1 className="text-3xl font-semibold mb-2 tracking-tight">Tools</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Privacy-first utilities</p>
        </header>

        {/* Back Link */}
        <a
          href="https://fawadhs.dev"
          className="inline-block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-12"
        >
          ← fawadhs.dev
        </a>

        {/* Tools List */}
        <div className="space-y-4 mb-12">
          {tools.map((tool) => {
            const content = (
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">{tool.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-semibold">{tool.title}</h2>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${
                        tool.available
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {tool.badge}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>
            );

            return tool.available ? (
              <Link
                key={tool.id}
                to={tool.link}
                className="block p-6 border border-gray-200 dark:border-gray-800 rounded-lg transition-all hover:border-blue-600 dark:hover:border-blue-400 hover:-translate-y-0.5"
              >
                {content}
              </Link>
            ) : (
              <div
                key={tool.id}
                className="block p-6 border border-gray-200 dark:border-gray-800 rounded-lg opacity-50 cursor-not-allowed"
              >
                {content}
              </div>
            );
          })}
        </div>

        {/* Privacy Notice */}
        <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg text-center mb-12">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            <strong className="text-gray-900 dark:text-gray-100">Client-side processing</strong>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No uploads. No tracking. No data collection.
          </p>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-8">
          <p>
            Built by{' '}
            <a
              href="https://fawadhs.dev"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Fawad Hussain
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};
