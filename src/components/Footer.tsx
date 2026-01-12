import React from 'react';
import { Shield, Github, Users, TrendingDown, Zap, Globe, Bug } from 'lucide-react';
import packageJson from '../../package.json';
import { getCommunityStats, formatDataSaved, formatCount } from '../utils/communityStats';

export const Footer: React.FC = () => {
  const stats = getCommunityStats();
  
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
        
        {/* Community Statistics */}
        <div className="mb-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-primary-500" />
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
              Community Impact
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            {/* Users */}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-500" />
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  {formatCount(stats.totalUsers)}+
                </span>{' '}
                users
              </p>
            </div>
            
            {/* Conversions */}
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-500" />
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold text-violet-600 dark:text-violet-400">
                  {formatCount(stats.totalConversions)}+
                </span>{' '}
                conversions
              </p>
            </div>
            
            {/* Data Saved */}
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-500" />
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatDataSaved(stats.totalDataSaved)}
                </span>{' '}
                saved globally
              </p>
            </div>
          </div>
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
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <a
            href="https://www.npmjs.com/package/@fawadhs/image-tools"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <img 
              src="https://raw.githubusercontent.com/npm/logos/cc343d8c50139f645d165aedfe4d375240599fd1/npm%20square/n.svg"
              alt="NPM"
              className="w-4 h-4"
            />
            NPM Package
          </a>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <a
            href="https://github.com/FawadHS/image-tools/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <Bug className="w-4 h-4" />
            Report a Bug
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
              Fawad Hussain Syed
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
