# E2E Tests (Playwright)

End-to-end tests that validate the full user journey: upload → process → export → verify.

## Running E2E Tests

### Prerequisites
1. Install Playwright browsers (one-time setup):
   ```powershell
   npx playwright install
   ```

2. Start development server in one terminal:
   ```powershell
   npm run dev
   ```

3. Run E2E tests in another terminal:
   ```powershell
   npm run test:e2e         # Headless mode
   npm run test:e2e:ui      # UI mode (interactive)
   ```

## Test Suites

### 🔥 smokeTest.spec.ts (HIGH VALUE)
**Purpose**: Validates entire export pipeline end-to-end with minimal test surface area.

**Tests**:
1. **Export pipeline validation**
   - Creates 1000×800 test PNG in-browser
   - Uploads via file input simulation
   - Exports without crop
   - Verifies exported dimensions === 1000×800
   - **WHY**: Single passing test provides evidence entire pipeline works

2. **Debug flag verification**
   - Sets `localStorage.setItem('DEBUG_RENDER', 'true')`
   - Reloads page
   - Verifies flag persists

3. **Coordinate conversion integration**
   - Verifies non-uniform canvas scaling handled correctly
   - Logs canvas display vs natural dimensions

**Recommendation**: Run this test FIRST after any pipeline changes.

---

### circleCrop.spec.ts (COMPREHENSIVE)
**Purpose**: Validates circle crop rendering behavior across formats.

**Tests**:
1. PNG with circle crop preserves alpha transparency
2. WebP with circle crop preserves alpha transparency
3. JPEG with circle crop fills background with white
4. Rectangle crop regression (should NOT apply circle)
5. Deterministic rendering (same input → same SHA-256 hash)

**Status**: ⚠️ Scaffolded but not fully implemented (requires test fixtures)

---

## Test Fixtures

See [tests/fixtures/README.md](../fixtures/README.md) for details on creating test images.

**Required fixtures**:
- Solid color PNGs (500×500) for pixel validation
- HEIC with orientation metadata for golden-image tests
- Reference PNGs showing correct upright rendering

---

## Debugging E2E Tests

### Visual Debugging
```powershell
npm run test:e2e:ui
```
Opens Playwright UI mode where you can:
- Step through tests
- See live browser interaction
- Inspect screenshots on failure
- Time-travel through test execution

### Headed Mode (See Browser)
```powershell
npx playwright test --headed
```

### Debug Single Test
```powershell
npx playwright test smokeTest.spec.ts --debug
```

### Screenshot on Failure
Playwright automatically captures screenshots on test failure → `test-results/`

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Best Practices

1. **Start dev server first** - E2E tests expect `http://localhost:5173`
2. **Use solid colors** - Easier to validate than gradients (cross-browser consistency)
3. **Test observable behavior** - Don't test implementation details
4. **Keep tests fast** - Use `test.slow()` only when necessary
5. **Avoid flaky selectors** - Use `data-testid` attributes for stable selection
6. **Golden images** - Use SHA-256 hashing for deterministic pixel validation

---

## Next Steps

1. ✅ Smoke test created (ready to run)
2. ⚠️ Create test fixtures (red-500x500.png, blue-500x500.png)
3. ⚠️ Run smoke test and verify it passes
4. ⚠️ Complete circle crop tests with pixel validation
5. ⚠️ Add HEIC golden-image tests
6. ⚠️ Set up CI/CD pipeline

---

**Last Updated**: January 11, 2025
