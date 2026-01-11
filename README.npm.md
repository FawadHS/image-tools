# @fawadhs/image-tools

> Privacy-first image conversion and editing React component. Convert HEIC, JPEG, PNG to WebP with crop, rotate, filters, and text overlay tools.

[![NPM Version](https://img.shields.io/npm/v/@fawadhs/image-tools.svg)](https://www.npmjs.com/package/@fawadhs/image-tools)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

- **🔒 100% Client-Side** - No uploads, no tracking. Your images never leave the browser
- **📸 Multiple Formats** - HEIC, JPEG, PNG, GIF, BMP, TIFF → WebP, JPEG, PNG, AVIF
- **🎨 Full Editing Suite** - Crop (rectangle/circle), rotate, flip, filters, text overlays
- **⚡ Web Workers** - Background processing for optimal performance
- **📦 Batch Processing** - Process up to 50 images simultaneously
- **🌙 Dark Mode** - Beautiful dark-first design with theme support
- **📱 Mobile Ready** - Full touch support for mobile and tablets
- **♿ Accessible** - WCAG 2.1 Level AA compliant
- **🎯 TypeScript** - Full type definitions included

## 📦 Installation

```bash
npm install @fawadhs/image-tools
# or
yarn add @fawadhs/image-tools
# or
pnpm add @fawadhs/image-tools
```

## 🚀 Quick Start

```tsx
import { ImageTools } from '@fawadhs/image-tools';
import '@fawadhs/image-tools/styles';

function App() {
  return (
    <div>
      <h1>Image Converter</h1>
      <ImageTools />
    </div>
  );
}
```

## 📖 Usage Examples

### With Callbacks

```tsx
import { ImageTools } from '@fawadhs/image-tools';
import '@fawadhs/image-tools/styles';

function AdminPanel() {
  const handleComplete = (files) => {
    console.log('Conversion complete!');
    files.forEach(file => {
      console.log(`${file.originalName} → ${file.name}`);
      // Upload to server, update database, etc.
      uploadToServer(file.blob, file.name);
    });
  };

  return (
    <ImageTools 
      theme="dark"
      maxFiles={50}
      defaultFormat="webp"
      defaultQuality={85}
      onConversionComplete={handleComplete}
    />
  );
}
```

### Next.js App Router

```tsx
'use client';

import { ImageTools } from '@fawadhs/image-tools';
import '@fawadhs/image-tools/styles';

export default function ImageEditorPage() {
  return <ImageTools theme="system" />;
}
```

### Next.js Pages Router (with SSR)

```tsx
import dynamic from 'next/dynamic';
import '@fawadhs/image-tools/styles';

const ImageTools = dynamic(
  () => import('@fawadhs/image-tools').then(mod => mod.ImageTools),
  { ssr: false }
);

export default function Page() {
  return <ImageTools />;
}
```

## 🎛️ Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | Theme mode |
| `maxFiles` | `number` | `50` | Maximum files allowed |
| `defaultFormat` | `'webp' \| 'jpeg' \| 'png' \| 'avif'` | `'webp'` | Default output format |
| `defaultQuality` | `number` | `85` | Default quality (1-100) |
| `onConversionComplete` | `(files) => void` | - | Callback when conversion completes |
| `onFilesSelected` | `(count) => void` | - | Callback when files are selected |
| `className` | `string` | - | Custom CSS class |
| `features` | `object` | - | Enable/disable specific features |

## 🎨 Styling

The component includes all necessary styles. Simply import the CSS file:

```tsx
import '@fawadhs/image-tools/styles';
```

For custom styling, wrap the component and override CSS classes:

```tsx
<div className="custom-wrapper">
  <ImageTools className="custom-tools" />
</div>
```

## 📝 TypeScript

Full TypeScript support with type definitions:

```typescript
import type { 
  ImageToolsProps,
  SelectedFile,
  OutputFormat,
  ConvertOptions,
  ImageTransform 
} from '@fawadhs/image-tools';
```

## 🌐 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with ES2020 support

## 📄 License

MIT © [Fawad Hussain](https://fawadhs.dev)

## 🔗 Links

- [Documentation](https://github.com/FawadHS/image-tools#readme)
- [Live Demo](https://tools.fawadhs.dev)
- [Report Issues](https://github.com/FawadHS/image-tools/issues)
- [Changelog](https://github.com/FawadHS/image-tools/blob/main/CHANGELOG.md)

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](https://github.com/FawadHS/image-tools/blob/main/CONTRIBUTING.md).

---

Made with ❤️ for developers, designers, and creators worldwide
