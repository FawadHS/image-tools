import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

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
  return {
    base: '/image-tools/',
    plugins: [react()],
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
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['lucide-react', 'react-hot-toast'],
            utils: ['heic2any', 'jszip']
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
