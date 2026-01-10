# Code Quality & Best Practices

## Overview
This document outlines the code quality standards, best practices, and architectural decisions for the Image Tools project.

## Architecture

### Component Structure
```
src/
├── components/     # UI components
│   ├── ui/        # Reusable primitives
│   └── *.tsx      # Feature components
├── hooks/         # Custom hooks
├── context/       # React contexts
├── utils/         # Pure utility functions
├── types/         # TypeScript interfaces
├── constants/     # App constants
└── workers/       # Web Workers
```

### Key Architectural Patterns

#### 1. Context + useReducer for State Management
- **ConverterContext**: Manages file conversion state and options
- **ThemeContext**: Manages dark/light theme preference
- Avoids prop drilling while keeping state predictable

#### 2. Web Workers for Performance
- Image conversion runs in background thread
- Prevents UI blocking during heavy processing
- Graceful fallback to main thread if unavailable

#### 3. Sequential Processing
- Converts images ONE BY ONE to avoid memory issues
- Intentional design for client-side free service
- Prevents browser crashes with large batches

#### 4. Transform Pipeline
Order matters! Transforms are applied in this sequence:
1. Rotation & Flip (ImageEditor)
2. Crop (CropTool)
3. Filters (ImageEditor)
4. Text Overlay (TextOverlayTool)

## Code Quality Standards

### TypeScript
- ✅ Strict mode enabled
- ✅ No `any` types (use `unknown` if needed)
- ✅ Explicit return types on exported functions
- ✅ Use discriminated unions for state
- ✅ `as const` for readonly arrays/objects

### React Patterns
- ✅ Functional components with hooks
- ✅ Custom hooks for reusable logic
- ✅ Memoize expensive computations
- ✅ Proper cleanup in useEffect
- ✅ Error boundaries for resilience

### Documentation
- ✅ JSDoc comments on all exported functions
- ✅ Examples in JSDoc where helpful
- ✅ README kept up-to-date
- ✅ Inline comments for complex logic only

### Performance
- ✅ Web Workers for heavy processing
- ✅ Sequential conversion to prevent memory overload
- ✅ Object URL cleanup (revokeObjectURL)
- ✅ Image smoothing for quality
- ✅ Debounced preview updates

### Accessibility
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Color contrast compliance
- ✅ Focus management

## Common Patterns

### Error Handling
```typescript
try {
  const result = await riskyOperation();
  // Handle success
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error('Operation failed:', error);
  toast.error(message);
}
```

### Custom Hooks
```typescript
export const useCustomHook = () => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup
    };
  }, [dependencies]);
  
  return { state, setState };
};
```

### Context Usage
```typescript
export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
};
```

## File Organization

### Naming Conventions
- **Components**: PascalCase (e.g., `ImageEditor.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useImageConverter.ts`)
- **Utils**: camelCase (e.g., `fileUtils.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILES`)
- **Types**: PascalCase (e.g., `ConvertOptions`)

### Import Order
1. React & external libraries
2. Internal contexts & hooks
3. Components
4. Utils & constants
5. Types
6. Styles

## Testing Considerations

### Manual Testing Checklist
- [ ] Test with various image formats (HEIC, JPEG, PNG, GIF, BMP, TIFF, WebP)
- [ ] Test large files (up to 50MB)
- [ ] Test batch processing (up to 50 images)
- [ ] Test all transform combinations
- [ ] Test error scenarios (invalid files, network issues)
- [ ] Test dark/light theme
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility

### Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Optimization

### Memory Management
1. **Sequential Processing**: One image at a time prevents memory overload
2. **URL Cleanup**: Always revoke object URLs after use
3. **Worker Termination**: Clean up workers when component unmounts
4. **History Limit**: Cap localStorage history at 50 entries

### Image Quality
- **High-quality smoothing**: `imageSmoothingQuality = 'high'`
- **Maintain aspect ratio** by default
- **Recommended quality**: 80% for WebP, 85% for JPEG

## Security Considerations

### Privacy-First
- ✅ No server uploads (100% client-side)
- ✅ No tracking or analytics that compromise privacy
- ✅ No external API calls with user data
- ✅ Optional metadata stripping

### Input Validation
- ✅ File type validation
- ✅ File size limits (50MB per file, 500MB total)
- ✅ Maximum file count (50 files)
- ✅ Sanitized filenames

## Code Refactoring Guide

### When to Refactor
- Function exceeds 100 lines
- Duplicate code in 3+ places
- Complex conditional logic (cyclomatic complexity > 10)
- Poor performance in production
- Unclear naming or purpose

### Refactoring Checklist
1. Write tests (if applicable)
2. Make small, incremental changes
3. Test after each change
4. Update documentation
5. Check for breaking changes
6. Review with git diff

## Dependencies

### Core Dependencies
- **React 18**: UI framework
- **TypeScript 5**: Type safety
- **Vite 6**: Build tool
- **heic2any**: HEIC conversion
- **JSZip**: Batch downloads
- **react-dropzone**: File uploads
- **lucide-react**: Icons

### Dependency Management
- Keep dependencies up-to-date (security)
- Avoid unnecessary dependencies
- Prefer well-maintained packages
- Check bundle size impact

## Common Pitfalls

### ❌ Don't
- Use `any` type
- Ignore memory cleanup
- Process all files in parallel
- Skip error handling
- Leave magic numbers in code
- Forget accessibility attributes

### ✅ Do
- Use proper TypeScript types
- Clean up resources (URLs, workers)
- Process files sequentially
- Handle all errors gracefully
- Extract constants
- Add ARIA labels

## Contributing

When contributing, ensure:
1. Code follows established patterns
2. TypeScript strict mode passes
3. No console errors or warnings
4. Manual testing completed
5. Documentation updated
6. Accessibility maintained

## Resources

- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [Web Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
