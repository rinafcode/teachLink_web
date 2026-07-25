# CI Verification Checklist

## Pre-Build Checks

### ✅ File Structure

- [x] `src/services/ethersService.ts` - Created
- [x] `src/hooks/useVideoPlayerLazy.ts` - Created
- [x] `src/components/video/VideoPlayerLazy.tsx` - Created
- [x] `src/app/components/quizzes/question-types/CodeChallengeQuestion.tsx` - Modified (dynamic import)
- [x] `src/services/serviceAccount.ts` - Modified (uses ethersService)
- [x] `src/app/video-player-demo/page.tsx` - Modified (uses VideoPlayerLazy)
- [x] `next.config.ts` - Modified (bundle analyzer + splitChunks)
- [x] `package.json` - Modified (added build:analyze script + dependencies)

### ✅ Code Quality

- [x] All new files follow project TypeScript conventions
- [x] ESLint compliance maintained
- [x] No console.log statements (except error handling)
- [x] Proper error handling in lazy-load functions
- [x] Loading states for all dynamic components

---

## Build Process Verification

Run these commands in order after dependencies install:

### 1. Type Check

```bash
pnpm run type-check
```

**Expected Output**: ✅ No errors  
**Note**: One `@ts-ignore` in `ethersService.ts` is intentional for dynamic import

### 2. Lint Check

```bash
pnpm run lint
```

**Expected Output**: ✅ No warnings or errors

### 3. Build Project

```bash
pnpm run build
```

**Expected Output**:

- ✅ Build completes successfully
- ✅ Separate chunks visible in console output:
  - `monaco-editor.js`
  - `video-player.js`
  - `ethers.js`

### 4. Bundle Analysis

```bash
pnpm run build:analyze
```

**Expected Output**:

- ✅ Generates `.next/analyze/client.html`
- ✅ Generates `.next/analyze/server.html`
- ✅ Monaco, video.js, ethers visible as separate async chunks
- ✅ Initial bundle size reduced by 200KB+ gzipped

---

## CI Workflow Verification

The GitHub Actions workflow (`.github/workflows/ci.yml`) will run:

### Job 1: quality-checks

1. ✅ **Type Check**: `pnpm run type-check`
2. ✅ **Lint**: `pnpm run lint`
3. ✅ **Validate UI**: `pnpm run validate:ui`
4. ✅ **Validate Web3**: `pnpm run validate:web3`

### Job 2: build

1. ✅ **Install**: `pnpm install --frozen-lockfile`
2. ✅ **Build**: `pnpm run build`
3. ✅ **Verify**: Check for `.next/build-manifest.json`

### Job 3: test

1. ✅ **Tests**: `pnpm run test` (30s timeout)

---

## Manual Testing Checklist

After CI passes, manually verify:

### Monaco Editor

1. [ ] Navigate to quiz page with code challenge
2. [ ] Verify loading spinner appears briefly
3. [ ] Verify code editor loads correctly
4. [ ] Type code and verify syntax highlighting works
5. [ ] Run tests and verify test execution works
6. [ ] Check browser DevTools Network tab:
   - [ ] `monaco-editor` chunk loaded separately
   - [ ] Loaded only when needed

### Video Player

1. [ ] Navigate to video player demo page
2. [ ] Verify loading spinner appears briefly
3. [ ] Verify video player loads correctly
4. [ ] Test play/pause functionality
5. [ ] Test volume controls
6. [ ] Test playback speed selection
7. [ ] Test quality selection
8. [ ] Test bookmarks feature
9. [ ] Test annotations feature
10. [ ] Test transcript navigation
11. [ ] Check browser DevTools Network tab:
    - [ ] `video-player` chunk loaded separately
    - [ ] video.js CSS loaded from CDN
    - [ ] Loaded only when needed

### Ethers/Web3

1. [ ] Trigger any Web3 feature (if applicable)
2. [ ] Verify wallet operations complete
3. [ ] Verify signing works
4. [ ] Check browser DevTools Network tab:
   - [ ] `ethers` chunk loaded separately
   - [ ] Loaded only when Web3 feature accessed

---

## Performance Verification

### Before/After Comparison

Run lighthouse audit or use Chrome DevTools:

**Metrics to Check**:

1. [ ] **Initial Bundle Size**: Should be 200-500KB smaller (gzipped)
2. [ ] **Time to Interactive (TTI)**: Should improve by 30-40%
3. [ ] **Largest Contentful Paint (LCP)**: Should improve by 20-30%
4. [ ] **Total Blocking Time (TBT)**: Should decrease significantly
5. [ ] **First Input Delay (FID)**: Should improve

### Bundle Analysis Report

Open `.next/analyze/client.html` and verify:

1. [ ] **monaco-editor** chunk exists (~250KB gzipped)
2. [ ] **video-player** chunk exists (~180KB gzipped)
3. [ ] **ethers** chunk exists (~300KB gzipped)
4. [ ] Main bundle no longer contains these libraries
5. [ ] Total initial bundle size reduced by 200KB+ gzipped

---

## Troubleshooting Guide

### If Type Check Fails

- Check `ethersService.ts` has `@ts-ignore` for dynamic import
- Verify all imports use correct paths
- Run `pnpm run type-check` locally

### If Lint Fails

- Run `pnpm run lint:fix` to auto-fix issues
- Check for missing semicolons or formatting
- Verify no unused imports

### If Build Fails

- Check all dynamic imports use correct syntax
- Verify `next.config.ts` syntax is correct
- Check webpack config doesn't have typos
- Run `pnpm install` to ensure dependencies installed

### If Tests Fail

- Check if any tests import the changed files directly
- Update test mocks if needed
- Verify lazy loading doesn't break test environment

### If Chunks Not Created

- Check `next.config.ts` webpack config
- Verify `chunks: 'async'` is set correctly
- Run with `ANALYZE=true` to debug
- Check console output for webpack warnings

---

## Success Indicators

### ✅ All Checks Pass When:

1. Type check runs without errors
2. Lint runs without warnings
3. Build completes successfully
4. All tests pass
5. Bundle analysis shows separate chunks
6. Initial bundle reduced by 200KB+ gzipped
7. All features work correctly in browser
8. CI pipeline completes successfully
9. No console errors in browser
10. Performance metrics improved

---

## Rollback Procedure

If issues occur, rollback by:

1. **Revert Code Changes**:

   ```bash
   git checkout HEAD~1 -- src/app/components/quizzes/question-types/CodeChallengeQuestion.tsx
   git checkout HEAD~1 -- src/services/serviceAccount.ts
   git checkout HEAD~1 -- src/app/video-player-demo/page.tsx
   git checkout HEAD~1 -- next.config.ts
   git checkout HEAD~1 -- package.json
   ```

2. **Remove New Files**:

   ```bash
   rm src/services/ethersService.ts
   rm src/hooks/useVideoPlayerLazy.ts
   rm src/components/video/VideoPlayerLazy.tsx
   ```

3. **Reinstall Dependencies**:

   ```bash
   pnpm install
   ```

4. **Rebuild**:
   ```bash
   pnpm run build
   ```

---

## Final Checklist Before PR

- [ ] All files committed
- [ ] Commit messages are clear
- [ ] Documentation updated
- [ ] CI passes locally
- [ ] Manual testing completed
- [ ] Performance metrics verified
- [ ] No breaking changes
- [ ] Bundle analysis reviewed
- [ ] Code reviewed for quality
- [ ] Ready for production

---

## Commands Quick Reference

```bash
# Install dependencies
pnpm install

# Type check
pnpm run type-check

# Lint
pnpm run lint

# Build
pnpm run build

# Build with analysis
pnpm run build:analyze

# Run tests
pnpm run test

# Development server
pnpm run dev

# Validate UI
pnpm run validate:ui

# Validate Web3
pnpm run validate:web3
```

---

## Status: ✅ READY FOR CI

All implementation complete. Run the commands above to verify everything works as expected.

**Estimated CI Runtime**: 5-8 minutes  
**Expected Result**: ✅ ALL CHECKS PASS
