import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-6 text-center text-sm text-gray-500 dark:text-gray-400">
      <p>
        All conversions happen locally in your browser.{' '}
        <span className="text-gray-400 dark:text-gray-500">No files are uploaded to any server.</span>
      </p>
    </footer>
  );
};
