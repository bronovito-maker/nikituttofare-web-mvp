# Performance Optimization Plan

**Generated:** 2026-02-06
**Lighthouse Score:** 88/100 (Target: 95+)
**Critical Issues:** TBT 460ms, TTI 6.1s, JS Execution 4.1s

---

## Executive Summary

The site has **excellent Core Web Vitals** (LCP 1.5s, CLS 0.0005) but suffers from **heavy JavaScript execution** blocking interactivity. The main culprit is a 4.1-second JavaScript chunk execution time, causing poor Time to Interactive (6.1s) and Total Blocking Time (460ms).

**Root Cause:** The landing page (`app/page.tsx`) is entirely client-rendered, causing all code (including heavy animation libraries) to be bundled and executed on the client.

---

## 🎯 Performance Targets

| Metric | Current | Target | Priority |
|--------|---------|--------|----------|
| **Performance Score** | 88 | 95+ | High |
| **Total Blocking Time** | 460ms | <200ms | Critical |
| **Time to Interactive** | 6.1s | <3.5s | Critical |
| **LCP** | 1.5s | <2.5s | ✅ Already good |
| **CLS** | 0.0005 | <0.1 | ✅ Already excellent |

---

## 🔍 Detailed Analysis

### Bundle Composition (Estimated)

From Lighthouse and code analysis:

```
Total JS Execution Time: ~6s
├─ Main chunk (9d9e41385afb31ee.js): 4,139ms (68%)
│  ├─ Framer Motion: ~800ms (animations)
│  ├─ Radix UI primitives: ~500ms
│  ├─ React Leaflet: ~400ms (maps - heavy!)
│  ├─ Lucide React icons: ~300ms
│  ├─ Landing page components: ~1,000ms
│  └─ Other dependencies: ~1,139ms
├─ Clarity.js: 223ms (analytics)
├─ Turbopack runtime: 214ms
└─ Other scripts: ~1,500ms
```

### Heavy Dependencies Identified

1. **react-leaflet** (1.1MB unpacked) - Used only in technician dashboard, loaded on landing page
2. **framer-motion** (600KB unpacked) - Used for animations, loaded upfront
3. **@radix-ui/** components - Multiple imports, some unused on first render
4. **Multiple date libraries** - Both `date-fns` AND `dayjs` installed
5. **PDF parsing** (`pdf-parse`) - Likely unused on landing page

---

## 🛠️ Optimization Strategy

### Phase 1: Server-Side Rendering (Critical - Highest Impact)

**Problem:** `app/page.tsx` has `'use client'` at the top, making the entire landing page client-rendered.

**Solution:** Convert to Server Component with selective client islands.

**Implementation:**
```typescript
// app/page.tsx (Server Component - remove 'use client')
import { HeroSection } from '@/components/landing/hero-section';
import { UrgencyStats } from '@/components/landing/urgency-stats';
// ... other server-safe imports

export default async function Home() {
  // This runs on the server!
  return (
    <div>
      <SiteHeader /> {/* Can be server component */}
      <HeroSection /> {/* Client component for interactivity */}
      <UrgencyStats /> {/* Server component */}
      {/* ... */}
    </div>
  );
}
```

**Extract client-only parts:**
- User type toggle → `<UserTypeToggle>` client component
- Animated text → `<AnimatedHero>` client component
- Everything else → Server Components

**Expected Impact:**
- Reduce initial JS by ~40%
- TBT improvement: 460ms → ~250ms
- TTI improvement: 6.1s → ~3.5s

---

### Phase 2: Code Splitting & Lazy Loading

**2.1 Defer Heavy Libraries**

```typescript
// app/page.tsx
const MapComponent = dynamic(
  () => import('@/components/map/technician-map'),
  {
    ssr: false,
    loading: () => <MapSkeleton />
  }
);

// Load Leaflet only when map is visible
const TechnicianDashboard = dynamic(
  () => import('@/app/technician/dashboard/page'),
  { ssr: false }
);
```

**2.2 Split Framer Motion**

```typescript
// Instead of importing all of framer-motion:
import { motion } from 'framer-motion';

// Use LazyMotion for 5x smaller bundle:
import { LazyMotion, domAnimation, m } from 'framer-motion';

<LazyMotion features={domAnimation}>
  <m.div animate={{ opacity: 1 }} />
</LazyMotion>
```

**2.3 Icon Optimization**

Currently: `import { Icon1, Icon2, Icon3 } from 'lucide-react'`
Problem: Imports entire icon library

Solution: Already enabled `optimizePackageImports: ['lucide-react']` in Next config ✅

**Expected Impact:**
- Reduce framer-motion size by 80% (~500KB → ~100KB)
- Defer Leaflet entirely from landing page (~400ms saved)

---

### Phase 3: Dependency Cleanup

**3.1 Remove Duplicate Date Libraries**

Currently installed:
- `date-fns` (304KB)
- `dayjs` (2KB)

**Action:**
- Audit usage: `grep -r "date-fns\|dayjs" app/ components/`
- Keep only `dayjs` (96% smaller)
- Replace all `date-fns` imports with `dayjs`

**3.2 Review Unused Heavy Dependencies**

```bash
# Check if these are actually used on landing page:
npm run check-deps  # (create script to analyze bundle)
```

Candidates for removal/lazy-loading:
- `pdf-parse` (140KB) - Only used in admin?
- `csv-parse` + `csv-parser` (redundant?)
- `@faker-js/faker` (2.5MB!) - Only used in dev/tests?

---

### Phase 4: Source Maps

**Current:** `productionBrowserSourceMaps: false`
**Issue:** Lighthouse reports missing source maps

**Solution:**
```javascript
// next.config.mjs
productionBrowserSourceMaps: true,
```

Or use Sentry's source map upload (already configured):
```javascript
// Sentry config already has:
widenClientFileUpload: true,
```

**Trade-off:** Source maps add ~30% to build size but don't affect runtime performance.

**Recommendation:** Enable for Sentry uploads only (not public):
```javascript
productionBrowserSourceMaps: false, // Keep false
// Sentry will upload source maps separately via widenClientFileUpload
```

---

### Phase 5: Accessibility Fixes

**Issue:** Color contrast failures

**Action:**
1. Run audit: `npm run audit`
2. Check contrast ratios: https://webaim.org/resources/contrastchecker/
3. Fix text/background combinations in:
   - `globals.css` (semantic color tokens)
   - Component styles

**Target WCAG AA:**
- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio

---

## 📋 Implementation Checklist

### Week 1: Critical Fixes (Expected: +5 performance score)

- [ ] **Task #1:** Analyze bundle with `@next/bundle-analyzer`
  ```bash
  npm install --save-dev @next/bundle-analyzer
  # Add to next.config.mjs
  ```

- [ ] **Task #2:** Convert `app/page.tsx` to Server Component
  - [ ] Remove `'use client'` from page.tsx
  - [ ] Extract interactive parts to client components:
    - [ ] `<UserTypeToggle>` (state management)
    - [ ] `<AnimatedHero>` (framer-motion animations)
    - [ ] `<StickyActionNav>` (scroll behavior)
  - [ ] Test that all functionality still works

- [ ] **Task #3:** Implement LazyMotion for framer-motion
  - [ ] Replace `motion` with `m` + `LazyMotion`
  - [ ] Test animations still work
  - [ ] Measure bundle size reduction

### Week 2: Optimization (Expected: +3 performance score)

- [ ] **Task #4:** Remove duplicate date libraries
  - [ ] Audit all `date-fns` usage
  - [ ] Replace with `dayjs`
  - [ ] Remove `date-fns` from package.json

- [ ] **Task #5:** Defer Leaflet maps
  - [ ] Ensure Leaflet only loads in technician dashboard
  - [ ] Add loading skeleton for map

- [ ] **Task #6:** Clean up unused dependencies
  - [ ] Check if `@faker-js/faker` is in production bundle
  - [ ] Move to devDependencies if only used in tests
  - [ ] Check for other dev-only dependencies

### Week 3: Polish (Expected: +2 performance score)

- [ ] **Task #7:** Fix accessibility contrast issues
  - [ ] Identify failing elements
  - [ ] Update color tokens in globals.css
  - [ ] Test with Lighthouse

- [ ] **Task #8:** Enable source maps (optional)
  - [ ] Configure Sentry source map uploads
  - [ ] Test error tracking with source maps

- [ ] **Task #9:** Run final performance audit
  - [ ] Lighthouse on mobile
  - [ ] Lighthouse on desktop
  - [ ] Document improvements

---

## 🧪 Testing Strategy

### Before Each Change
```bash
# 1. Run production build
npm run build

# 2. Start production server
npm run start

# 3. Run Lighthouse (mobile)
npx lighthouse http://localhost:3000 --only-categories=performance --output=json --output-path=./lighthouse-before.json --form-factor=mobile --screenEmulation.mobile=true

# 4. Extract score
jq '.categories.performance.score' lighthouse-before.json
```

### After Each Change
```bash
# Repeat Lighthouse test
npx lighthouse http://localhost:3000 --only-categories=performance --output=json --output-path=./lighthouse-after.json --form-factor=mobile --screenEmulation.mobile=true

# Compare scores
echo "Before: $(jq '.categories.performance.score' lighthouse-before.json)"
echo "After: $(jq '.categories.performance.score' lighthouse-after.json)"
```

### AI Chat Testing (Critical!)
```bash
# ALWAYS run after changes to ensure chat still works
npm run test:ai
npm run test:ai:emergency
```

---

## 📊 Expected Results

### Baseline (Current)
- Performance: 88
- TBT: 460ms
- TTI: 6.1s
- JS Execution: 4.1s

### After Phase 1 (Server Components)
- Performance: 92-93 (+5)
- TBT: ~250ms (-210ms)
- TTI: ~3.5s (-2.6s)
- JS Execution: ~2.0s (-2.1s)

### After Phase 2 (Code Splitting)
- Performance: 94-95 (+2)
- TBT: ~180ms (-70ms)
- TTI: ~2.8s (-0.7s)

### After Phase 3 (Dependency Cleanup)
- Performance: 95-96 (+1)
- TBT: ~150ms (-30ms)
- Bundle size: -500KB

### Final Target
- Performance: **95+** ✅
- TBT: **<200ms** ✅
- TTI: **<3.5s** ✅
- All Core Web Vitals: Green ✅

---

## 🚨 Risks & Mitigation

### Risk 1: Breaking Chat Functionality
**Likelihood:** Medium
**Impact:** Critical
**Mitigation:** Run `npm run test:ai` after EVERY change

### Risk 2: SSR Hydration Errors
**Likelihood:** High (when converting to Server Components)
**Impact:** High
**Mitigation:**
- Test thoroughly in dev mode
- Use `suppressHydrationWarning` only where necessary
- Check browser console for hydration errors

### Risk 3: Animation Performance Degradation
**Likelihood:** Low
**Impact:** Medium
**Mitigation:**
- Test LazyMotion animations on low-end devices
- Keep fallback for non-JS users

---

## 🔗 Resources

- [Next.js Performance Guide](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Framer Motion LazyMotion](https://www.framer.com/motion/lazy-motion/)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Lighthouse Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)

---

## 📝 Progress Tracking

| Phase | Status | Score Impact | Completion Date |
|-------|--------|--------------|-----------------|
| Phase 1: SSR | 🔄 In Progress | +5 | - |
| Phase 2: Code Splitting | ⏳ Pending | +2 | - |
| Phase 3: Dependencies | ⏳ Pending | +1 | - |
| Phase 4: Source Maps | ⏳ Pending | 0 | - |
| Phase 5: Accessibility | ⏳ Pending | +2 | - |

**Legend:** ⏳ Pending | 🔄 In Progress | ✅ Complete | ❌ Blocked

---

*This plan was generated based on Lighthouse audit from 2026-02-06. Results may vary based on testing conditions and implementation details.*
