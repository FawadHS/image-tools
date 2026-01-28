// Image Preflight - Configuration
// Part of Preflight Utility Suite

// Version is injected at build time from package.json
declare const __APP_VERSION__: string;

// Environment detection
const isDev = import.meta.env.DEV;

export const config = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'https://api.tools.fawadhs.dev',
  
  // Platform URLs  
  platformUrl: isDev ? 'http://localhost:5173' : 'https://tools.fawadhs.dev',
  spreadsheetToolsUrl: isDev ? 'http://localhost:5174' : 'https://tools.fawadhs.dev/spreadsheet',
  
  // App Info
  appName: 'Image Preflight',
  appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '3.0.0',
  
  // File Limits (from constants)
  maxFiles: 50,
  maxFileSizeMB: 50,
  maxTotalSizeMB: 500,
  
  // Feature Flags
  features: {
    shopifyIntegration: true,  // v3.0 - Enabled
    batchProcessing: true,
    cropTool: true,
    ecommercePresets: true,
    authRequired: false,  // When true, requires login for full features
  },
};

export default config;
