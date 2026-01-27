# Image Preflight

> 🖼️ Modern, privacy-first image conversion & editing tool | Part of [Preflight Utility Suite](https://tools.fawadhs.dev)

[![NPM Version](https://img.shields.io/npm/v/@fawadhs/image-preflight)](https://www.npmjs.com/package/@fawadhs/image-preflight)
[![NPM Downloads](https://img.shields.io/npm/dt/@fawadhs/image-preflight)](https://www.npmjs.com/package/@fawadhs/image-preflight)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## ✨ Features

### Core Capabilities
- **🔒 Privacy First** - All processing happens in your browser. No uploads, no tracking.
- **📸 Multiple Formats** - Convert HEIC, JPEG, PNG, GIF, BMP, TIFF to WebP, JPEG, PNG, or AVIF
- **⚡ Web Workers** - Background processing for lightning-fast conversions
- **📦 Batch Processing** - Convert up to 50 images at once with sequential processing
- **🌙 Dark Mode** - Beautiful dark-first design with system preference support
- **📱 Mobile Ready** - Full touch support for all interactive tools (v2.5.1)

### Image Editing Suite (v2.5) 🎨
- **✂️ Crop Tool** - Rectangle, circle shapes with aspect ratio presets (1:1, 16:9, 4:3, 3:2) + mobile touch support
- **🔄 Rotate & Flip** - 90°/180°/270° rotation, horizontal/vertical flip
- **🎨 Filters** - Brightness, contrast, saturation, grayscale, sepia
- **📝 Text Overlay** - Add watermarks and captions with custom fonts, colors, opacity + touch dragging
- **🔗 Transform Pipeline** - All edits work together seamlessly
- **👆 Touch Optimized** - Full mobile/tablet support for crop and text tools

### Advanced Features
- **🔄 Before/After Comparison** - Interactive slider with responsive design for all screen sizes
- **📱 PWA Support** - Install as app, works offline
- **📊 Conversion History** - Track your conversions with statistics
- **🏷️ Advanced Naming** - Custom prefixes, suffixes, timestamps, dimensions
- **🛒 E-commerce Presets** - Product images, thumbnails, banners
- **📐 Resize Presets** - 4K, FHD, HD, Medium, Thumbnail, or Custom
- **♿ Fully Accessible** - WCAG 2.1 Level AA compliant

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/FawadHS/image-preflight.git
cd "Image Preflight"

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎯 Use Cases

### E-commerce & Online Stores 🛒
**Perfect for shop owners and marketplace sellers:**
- **Product Photography Workflow**
  - Crop product images to consistent aspect ratios (1:1 for Instagram, 4:3 for listings)
  - Add watermarks with store branding to protect images
  - Resize for different platforms (Amazon, eBay, Shopify thumbnails)
  - Batch process entire product catalogs

- **Admin Panel Integration** 💼
  - Integrate as iframe in WooCommerce, Shopify, or custom admin panels
  - Allow staff to edit images without leaving the dashboard
  - Standardize product image quality across the store
  - Reduce image file sizes by 60-80% for faster page loads

- **Multi-Channel Selling**
  - Create platform-specific image sizes in one batch
  - Convert HEIC photos from iPhones to web-compatible formats
  - Generate thumbnails, medium, and full-size versions simultaneously

### Content Creators & Bloggers 📝
- **Blog Post Optimization**
  - Optimize images for faster page loads and better SEO
  - Convert iPhone HEIC photos for web compatibility
  - Add consistent watermarks to protect original content
  
- **Social Media Management**
  - Batch process photos for Instagram, Facebook, Twitter
  - Apply filters for consistent brand aesthetic
  - Resize for different platform requirements

### Web Developers & Designers 💻
- **Development Workflow**
  - Generate WebP versions for modern browsers with PNG/JPEG fallbacks
  - Create responsive image sets (srcset) from single source
  - Automate image optimization without server-side processing
  - Embed tool in client portals for self-service image processing

### Photography & Creative Studios 📸
- **Client Delivery**
  - Batch watermark photos before sending to clients
  - Create web-optimized galleries from high-res originals
  - Generate proof sheets with consistent cropping

### Real Estate & Property Listings 🏠
- Standardize property photos to consistent dimensions
- Add agency branding to listing images
- Compress images while maintaining quality for faster MLS uploads

### Marketing Teams 📊
- Quickly resize campaign images for email, web, and print
- Add promotional text overlays to banners
- A/B test different image sizes and quality settings

## 🛠️ Tech Stack

- **React 18** - UI Framework
- **TypeScript 5** - Type Safety
- **Vite 6** - Lightning-fast Build Tool
- **Tailwind CSS** - Modern Styling
- **heic2any** - HEIC Conversion
- **JSZip** - Batch Downloads
- **Web Workers** - Background Processing
- **Canvas API** - Image Manipulation

## 🔌 Integration Guide

### Embed in Your Admin Panel

Image Tools can be easily integrated into existing admin panels, CMS, or e-commerce dashboards:

**Option 1: iFrame Embed** ⚡ (Recommended for Quick Setup)
```html
<iframe 
  src="https://tools.fawadhs.dev" 
  width="100%" 
  height="800px"
  style="border: none; border-radius: 8px;"
  title="Image Tools">
</iframe>
```

> **Note**: This works because the app is 100% client-side with no CORS restrictions. However, verify:
> - Your hosting allows iframe embedding (no `X-Frame-Options: DENY`)
> - Test in your specific environment before production use
> - For localhost development, use `http://localhost:5173` (Vite dev server)

**Option 2: NPM Package** 📦 (Recommended for React Projects)
```bash
npm install @fawadhs/image-tools
```

```typescript
import { ImageTools } from '@fawadhs/image-tools';
import '@fawadhs/image-tools/styles';

function AdminPage() {
  const handleComplete = (files) => {
    console.log('Converted:', files);
    // Upload to server, etc.
  };

  return (
    <ImageTools 
      theme="dark" 
      maxFiles={50}
      defaultFormat="webp"
      onConversionComplete={handleComplete}
    />
  );
}
```

> **Features**: Full TypeScript support, callbacks for conversion events, theme customization, all editing tools included.
> See [NPM Usage Guide](docs/NPM_USAGE.md) for detailed examples.

**Option 3: Self-Hosted** ⭐ (Best for Production)
```bash
# Clone and build
git clone https://github.com/FawadHS/image-tools.git
cd image-tools
npm install && npm run build

# Serve dist/ folder from your domain
# Example: https://yourdomain.com/image-tools
```

**Why Self-Host?**
- Full control over deployment
- No external dependencies
- Can customize features
- Better performance (same domain)
- No iframe restrictions

### WordPress/WooCommerce Integration
Add to your admin panel using a custom plugin or theme:

```php
// Add menu item to WordPress admin
add_action('admin_menu', function() {
    add_menu_page(
        'Image Tools',
        'Image Tools',
        'upload_files',
        'image-tools',
        'render_image_tools_page',
        'dashicons-format-image'
    );
});

function render_image_tools_page() {
    // Option A: Embed hosted version (requires internet)
    echo '<iframe src="https://tools.fawadhs.dev" 
          style="width:100%;height:90vh;border:none;"></iframe>';
    
    // Option B: Self-hosted (recommended for production)
    // echo '<iframe src="' . site_url('/image-tools') . '" 
    //       style="width:100%;height:90vh;border:none;"></iframe>';
}
```

> **Production Tip**: Self-host the tool in your WordPress `wp-content/uploads/image-tools/` directory for better performance and reliability.

### Shopify Admin Integration
Use the Shopify App Bridge to embed in your Shopify admin:

```javascript
// App Proxy or Embedded App
import { AppProvider } from '@shopify/polaris';

<AppProvider>
  <iframe 
    src="https://tools.fawadhs.dev" 
    style={{ width: '100%', height: '100vh' }}
  />
</AppProvider>
```

## 📖 Documentation

See [docs/SPEC.md](docs/SPEC.md) for detailed specifications.

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help makes this tool better for everyone.

### How to Contribute

1. **Fork the repository**
   ```bash
   git clone https://github.com/FawadHS/image-tools.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

4. **Commit with clear messages**
   ```bash
   git commit -m 'feat: Add amazing feature'
   ```
   Use conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Describe your changes clearly
   - Reference any related issues
   - Wait for review and address feedback

### Areas We Need Help With

🎨 **UI/UX Improvements**
- Additional mobile/tablet optimizations
- Accessibility improvements
- New theme options

🚀 **New Features**
- Additional image formats (SVG, RAW, PDF)
- Advanced editing tools (blur, sharpen, color curves)
- Batch preset system
- Cloud storage integration (Google Drive, Dropbox)

🐛 **Bug Fixes**
- Cross-browser compatibility issues
- Performance optimizations
- Edge case handling

📚 **Documentation**
- API documentation
- Tutorial videos
- Translation to other languages
- Integration guides for popular CMS/e-commerce platforms

🧪 **Testing**
- Unit tests for utilities
- E2E tests for critical workflows
- Performance benchmarks

### Development Setup

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Run TypeScript checks
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Focus on what's best for the community

### Questions or Ideas?

- 💬 Open a [GitHub Discussion](https://github.com/FawadHS/image-tools/discussions)
- 🐛 Report bugs via [GitHub Issues](https://github.com/FawadHS/image-tools/issues)
- 📧 Email: [fawad@fawadhs.dev](mailto:fawad@fawadhs.dev)

### Recognition

All contributors will be:
- Listed in our Contributors section
- Credited in release notes
- Part of building a tool used by thousands

Thank you for considering contributing! Every bit helps. ❤️

## 🌟 Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for detailed feature roadmap and development plans.

**Coming Soon:**
- 📁 Cloud storage integration (Google Drive, Dropbox)
- 🎨 Advanced editing tools (blur, sharpen, color curves)
- 🔄 Undo/Redo system
- 💾 Saved presets
- 🌍 Multi-language support
- 📱 Mobile app (React Native)
- 🖥️ Desktop app (Electron)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Creator**: [Fawad Hussain](https://fawadhs.dev)
- **Part of**: [tools.fawadhs.dev](https://tools.fawadhs.dev) suite
- **Built with**: React, TypeScript, Vite, Tailwind CSS
- **Inspiration**: Community feedback and real-world use cases
- **Special Thanks**: To all contributors and users who help improve this tool

## 📊 Stats

- **100% Client-Side** - Your images never leave your device
- **60-80% Size Reduction** - Average file size reduction with WebP
- **50 Images** - Batch process limit for optimal performance
- **4 Output Formats** - WebP, JPEG, PNG, AVIF
- **5 Editing Tools** - Crop, Rotate, Flip, Filters, Text Overlay
- **Zero Dependencies** - No server required, works offline
- **📱 Mobile & Touch** - Full support for smartphones and tablets

---

<p align="center">
  <strong>Made with ❤️ for developers, designers, and creators worldwide</strong>
  <br><br>
  <a href="https://tools.fawadhs.dev">🌐 Live Demo</a> •
  <a href="https://github.com/FawadHS/image-tools/issues">🐛 Report Bug</a> •
  <a href="https://github.com/FawadHS/image-tools/discussions">💬 Request Feature</a>
</p>
