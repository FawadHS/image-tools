# NPM Package Usage Examples

## Installation

```bash
npm install @fawadhs/image-tools
# or
yarn add @fawadhs/image-tools
# or
pnpm add @fawadhs/image-tools
```

## Basic Usage

```typescript
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

## With All Props

```typescript
import { ImageTools } from '@fawadhs/image-tools';
import '@fawadhs/image-tools/styles';

function AdminPanel() {
  const handleComplete = (files) => {
    console.log('Conversion complete!');
    files.forEach(file => {
      console.log(`${file.originalName} → ${file.name}`);
      // Upload to server or process further
      uploadToServer(file.blob, file.name);
    });
  };

  const handleFilesSelected = (count) => {
    console.log(`${count} files selected`);
  };

  return (
    <ImageTools 
      theme="dark"
      maxFiles={50}
      defaultFormat="webp"
      defaultQuality={85}
      onConversionComplete={handleComplete}
      onFilesSelected={handleFilesSelected}
      className="my-custom-class"
    />
  );
}
```

## WordPress/PHP Integration

```php
<?php
// Enqueue in your theme or plugin
function enqueue_image_tools() {
    // React dependencies
    wp_enqueue_script('react', 'https://unpkg.com/react@18/umd/react.production.min.js', [], '18.0.0', true);
    wp_enqueue_script('react-dom', 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', ['react'], '18.0.0', true);
    
    // Image Tools
    wp_enqueue_script('image-tools', 'path/to/image-tools.umd.js', ['react', 'react-dom'], '2.5.1', true);
    wp_enqueue_style('image-tools', 'path/to/image-tools.css', [], '2.5.1');
}
add_action('admin_enqueue_scripts', 'enqueue_image_tools');
?>

<!-- In your admin page -->
<div id="image-tools-root"></div>
<script>
  const { ImageTools } = window.ImageTools;
  const root = ReactDOM.createRoot(document.getElementById('image-tools-root'));
  root.render(React.createElement(ImageTools, {
    theme: 'dark',
    maxFiles: 50,
    onConversionComplete: (files) => {
      console.log('Files converted:', files);
    }
  }));
</script>
```

## Next.js App Router

```typescript
'use client';

import { ImageTools } from '@fawadhs/image-tools';
import '@fawadhs/image-tools/styles';

export default function ImageEditorPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Image Tools</h1>
      <ImageTools 
        theme="system"
        defaultFormat="webp"
      />
    </div>
  );
}
```

## Next.js Pages Router

```typescript
import dynamic from 'next/dynamic';
import '@fawadhs/image-tools/styles';

const ImageTools = dynamic(
  () => import('@fawadhs/image-tools').then(mod => mod.ImageTools),
  { ssr: false }
);

export default function ImageEditorPage() {
  return (
    <div>
      <h1>Image Tools</h1>
      <ImageTools theme="system" />
    </div>
  );
}
```

## Remix

```typescript
import { ImageTools } from '@fawadhs/image-tools';
import styles from '@fawadhs/image-tools/styles';

export function links() {
  return [{ rel: 'stylesheet', href: styles }];
}

export default function ImageEditor() {
  return (
    <div>
      <h1>Image Tools</h1>
      <ImageTools theme="dark" />
    </div>
  );
}
```

## Advanced: Custom Integration with Context

```typescript
import { 
  ConverterProvider, 
  useConverter,
  ThemeProvider 
} from '@fawadhs/image-tools';
import { ImageToolsPage } from '@fawadhs/image-tools';
import '@fawadhs/image-tools/styles';

function MyCustomComponent() {
  const { state, dispatch } = useConverter();
  
  return (
    <div>
      <p>Files: {state.files.length}</p>
      <button onClick={() => dispatch({ type: 'CLEAR_FILES' })}>
        Clear All
      </button>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider initialTheme="dark">
      <ConverterProvider>
        <MyCustomComponent />
        <ImageToolsPage />
      </ConverterProvider>
    </ThemeProvider>
  );
}
```

## TypeScript Types

```typescript
import type { 
  ImageToolsProps,
  SelectedFile,
  OutputFormat,
  ConversionOptions,
  ImageTransform 
} from '@fawadhs/image-tools';

const options: ConversionOptions = {
  format: 'webp',
  quality: 85,
  maxWidth: 1920,
  maintainAspectRatio: true
};
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | Theme mode |
| `maxFiles` | `number` | `50` | Max files allowed |
| `defaultFormat` | `'webp' \| 'jpeg' \| 'png' \| 'avif'` | `'webp'` | Default output format |
| `defaultQuality` | `number` | `85` | Default quality (1-100) |
| `onConversionComplete` | `(files) => void` | - | Callback when done |
| `onFilesSelected` | `(count) => void` | - | Callback when files selected |
| `className` | `string` | - | Custom CSS class |
| `features` | `object` | - | Enable/disable features |
