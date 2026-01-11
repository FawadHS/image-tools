import React from 'react';
import { Shield, Github } from 'lucide-react';
import packageJson from '../../package.json';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Privacy Notice */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-green-500" />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            All conversions happen locally in your browser.{' '}
            <span className="text-gray-500 dark:text-gray-400">No files are uploaded to any server.</span>
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm mb-4">
          <a
            href="https://fawadhs.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Portfolio
          </a>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <a
            href="https://tools.fawadhs.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            More Tools
          </a>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <a
            href="https://github.com/FawadHS/image-tools"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <Github className="w-4 h-4" />
            Open Source
          </a>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500">
          <p>
            Made by{' '}
            <a
              href="https://fawadhs.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-primary-600 dark:hover:text-primary-400"
            >
              Fawad Hussain
            </a>
          </p>
          <p className="mt-1">
            © {new Date().getFullYear()} fawadhs.dev — MIT License
            <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
            <span className="font-mono">v{packageJson.version}</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
