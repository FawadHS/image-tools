import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App'
// Removed PWA service worker registration - causes caching issues

// Ensure DOM is fully loaded before mounting React
const mountApp = () => {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    console.error('Root element not found!')
    return
  }
  
  createRoot(rootElement).render(
    <StrictMode>
      <App />
      <Toaster position="bottom-right" />
    </StrictMode>,
  )
}

// Mount when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp)
} else {
  mountApp()
}

