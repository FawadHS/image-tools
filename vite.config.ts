import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Read version from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))
const appVersion = packageJson.version

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Library build for NPM package
  if (mode === 'lib') {
    return {
      plugins: [react()],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/lib/index.ts'),
          name: 'ImageTools',
          fileName: (format) => `image-tools.${format}.js`,
          formats: ['es', 'umd']
        },
        rollupOptions: {
          // Externalize dependencies that shouldn't be bundled
          external: [
            'react',
            'react-dom',
            'react/jsx-runtime',
            'react-router-dom'
          ],
          output: {
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
              'react/jsx-runtime': 'react/jsx-runtime',
              'react-router-dom': 'ReactRouterDOM'
            },
            // Preserve CSS
            assetFileNames: (assetInfo) => {
              if (assetInfo.name === 'style.css') {
                return 'image-tools.css';
              }
              return assetInfo.name || 'assets/[name][extname]';
            }
          }
        },
        outDir: 'dist-lib',
        sourcemap: true,
        // Optimize for library usage
        minify: 'esbuild',
        cssCodeSplit: false
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify('production')
      }
    }
  }

  // Standard application build
  const plugins = [react()]
  if (mode === 'report') {
    plugins.push(visualizer({
      filename: 'dist/bundle-report.json',
      template: 'raw-data',
      gzipSize: true,
      brotliSize: true,
    }))
  }

  return {
    base: '/image-tools/',
    plugins,
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    worker: {
      format: 'es',
    },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      sourcemap: true,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      rollupOptions: {
        output: {
          // Add prefix to prevent collision with main landing page assets
          entryFileNames: 'assets/image-tools-[name]-[hash].js',
          chunkFileNames: 'assets/image-tools-[name]-[hash].js',
          assetFileNames: 'assets/image-tools-[name]-[hash].[ext]',
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('heic-to')) return 'heic'
              if (id.includes('jszip')) return 'zip'
              if (id.includes('react-hot-toast') || id.includes('lucide-react')) return 'ui'
              if (id.includes('react-dropzone') || id.includes('file-selector')) return 'dropzone'
              if (
                id.includes('react') ||
                id.includes('react-dom') ||
                id.includes('react-router-dom')
              ) {
                return 'vendor'
              }
              return 'vendor'
            }

            if (id.includes('/src/components/shopify/')) return 'shopify'
            if (id.includes('/src/components/')) return 'editor'
            return undefined
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom']
    }
  }
})
