# Contributing to Image Tools 🎉

Thank you for your interest in contributing to Image Tools! This guide will help you get started.

## 🌟 Ways to Contribute

- 🐛 **Report bugs** - Found a problem? Let us know!
- ✨ **Suggest features** - Have an idea? We'd love to hear it!
- 📝 **Improve documentation** - Help make our docs clearer
- 💻 **Submit code** - Fix bugs or implement features
- 🎨 **Design improvements** - Enhance UI/UX
- ♿ **Accessibility** - Make the tool more accessible
- 🧪 **Add tests** - Improve code coverage
- 🌍 **Translations** - Help make it multilingual (future)

## 📋 Code of Conduct

Be respectful, inclusive, and collaborative. We're all here to build something great together.

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Git** for version control
- A modern browser (Chrome, Firefox, Safari, Edge)
- Basic knowledge of React, TypeScript, and Tailwind CSS

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR-USERNAME/image-tools.git
   cd image-tools
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 in your browser

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

## 🏗️ Project Structure

```
src/
├── components/       # React components
│   ├── ui/          # Reusable UI primitives
│   ├── ActionBar.tsx
│   ├── CropTool.tsx
│   ├── DropZone.tsx
│   ├── ImageEditor.tsx
│   └── ...
├── context/         # React Context (state management)
│   ├── ConverterContext.tsx
│   └── ThemeContext.tsx
├── hooks/           # Custom React hooks
│   ├── useImageConverter.ts
│   └── useDarkMode.ts
├── utils/           # Pure utility functions
│   ├── converter.ts
│   ├── imageTransform.ts
│   └── presets.ts
├── types/           # TypeScript type definitions
├── constants/       # App-wide constants
└── workers/         # Web Workers for background processing
```

## 💻 Development Guidelines

### TypeScript

- **Use strict typing** - Avoid `any`, define proper interfaces
- **Define types in `src/types/`** for shared types
- **Use discriminated unions** for complex state

```typescript
// Good
interface FileState {
  id: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
}

// Avoid
const state: any = { ... };
```

### React Patterns

- **Functional components with hooks** - No class components
- **Custom hooks** for reusable logic (prefix with `use`)
- **Context** for global state only (keep it minimal)
- **Memoize** expensive computations with `useMemo`

```typescript
// Custom hook example
export function useImageTransform() {
  const [transform, setTransform] = useState<Transform>({});
  
  const applyTransform = useCallback((image: HTMLImageElement) => {
    // Transform logic
  }, [transform]);
  
  return { transform, applyTransform };
}
```

### Styling with Tailwind

- **Use Tailwind classes** - Avoid custom CSS when possible
- **Follow the color palette** - blue-600 (primary), emerald-500 (success), etc.
- **Consistent spacing** - Use Tailwind's spacing scale (p-4, m-2, gap-6)
- **Dark mode** - Use `dark:` variants for all components

```tsx
// Good
<button className="rounded-lg bg-primary-500 px-4 py-2 text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700">
  Convert
</button>
```

### Code Style

- **Prettier** - Auto-formats code (configured in project)
- **ESLint** - Lints code for issues
- **Conventional Commits** - Use semantic commit messages

```bash
# Commit message format
<type>(<scope>): <description>

# Examples
feat: Add batch watermark feature
fix: Fix crop tool coordinate calculation
docs: Update README with new features
style: Improve button hover states
refactor: Extract image loading logic to hook
test: Add tests for file validation
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` UI/styling changes (not code style)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Adding tests
- `chore:` Maintenance tasks

## 🧪 Testing

Before submitting a PR, test your changes:

### Manual Testing Checklist

- [ ] Test in **Chrome, Firefox, Safari, Edge**
- [ ] Test **responsive design** (mobile, tablet, desktop)
- [ ] Test with **various image formats** (HEIC, PNG, JPEG, WebP)
- [ ] Test with **large files** (5MB+)
- [ ] Test **dark mode** and light mode
- [ ] Test **batch processing** (multiple files)
- [ ] Check **browser console** for errors
- [ ] Verify **accessibility** (keyboard navigation, screen reader)

### Build Test

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

Visit http://localhost:4173 and test the production build.

## 🎨 UI/UX Guidelines

### Design Principles

1. **Minimalist & Clean** - Remove clutter, focus on content
2. **Modern & Refined** - Subtle shadows, smooth gradients
3. **Dark Mode First** - Design for dark, ensure light works
4. **Information Rich** - Show useful stats without overwhelming
5. **Consistent Spacing** - Use Tailwind's scale consistently

### Component Patterns

- **Buttons**: `rounded-lg`, clear hierarchy (primary/secondary/ghost)
- **Cards**: Subtle borders, slight shadows, `rounded-xl`
- **Inputs**: Clean borders, focus states with `ring`
- **Animations**: Subtle, 200-300ms transitions
- **Icons**: Lucide React, consistent 20-24px sizes

## 🔒 Privacy & Security

**Critical Rule**: All image processing happens **client-side**. Never upload images to a server.

- Use Canvas API for image manipulation
- Use Web Workers for heavy processing
- No external API calls for image data
- No tracking or analytics that compromise privacy

## 📤 Submitting Your Contribution

### Pull Request Process

1. **Ensure code quality**
   ```bash
   npm run build    # Must succeed
   npm run lint     # Should pass (or fix issues)
   ```

2. **Update documentation**
   - Update README.md if adding features
   - Add comments for complex logic
   - Update docs/ if needed

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: Add awesome feature"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template
   - Add screenshots for UI changes

### PR Review Process

1. **Automated checks** run (linting, build)
2. **Maintainer reviews** your code
3. **Feedback** may be requested
4. Once approved, **merged** into main
5. **Credited** in release notes!

## 📚 Learning Resources

### Project-Specific

- [Project Specification](docs/SPEC.md) - Detailed feature specs
- [Roadmap](docs/ROADMAP.md) - Future plans
- [Transform Pipeline](docs/TRANSFORM-PIPELINE.md) - How image transforms work
- [Changelog](CHANGELOG.md) - Release history

### External Resources

- [React Docs](https://react.dev) - React fundamentals
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript guide
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS
- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) - Image manipulation
- [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) - Background processing

## 💬 Getting Help

- **GitHub Issues** - For bugs and feature requests
- **GitHub Discussions** - For questions and ideas
- **Code Comments** - Check inline documentation

## 🎯 Good First Issues

Look for issues labeled `good first issue` - these are great entry points for new contributors!

## 🏆 Recognition

All contributors are credited in:
- Release notes (CHANGELOG.md)
- GitHub contributors page
- Project README (for significant contributions)

## 📝 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## ✨ Thank You!

Your contributions make Image Tools better for everyone. We appreciate your time and effort! 🚀

**Questions?** Open an issue or discussion - we're here to help!
