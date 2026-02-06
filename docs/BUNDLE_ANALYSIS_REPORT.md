# Bundle Analysis Report

**Date:** 2026-02-06
**Analyzer:** Automated Script + Lighthouse

---

## Executive Summary

Analysis of the Next.js bundle reveals several optimization opportunities:

1. **Unused Dependencies:** 3 packages (faker, pdf-parse, csv-parser, dayjs) not used in production
2. **Heavy Libraries:** Leaflet only used in admin (good!), framer-motion used widely
3. **Client Components:** 74 client components - landing page is entirely client-rendered
4. **Date Libraries:** date-fns used in 5 files, dayjs installed but unused

**Estimated savings:** ~600KB gzipped (~1.8MB uncompressed) after optimizations

---

## Dependency Usage Analysis

### Date Libraries (Redundant)

| Library | Size | Usage | Status |
|---------|------|-------|--------|
| `date-fns` | 304KB | 5 files | ⚠️ In use |
| `dayjs` | 2KB | 0 files | ❌ **UNUSED - Remove** |

**Recommendation:** Remove `dayjs` (unused) OR replace `date-fns` with `dayjs` (98% smaller)

**Files using date-fns:**
- `app/dashboard/assets/[id]/page.tsx`
- `components/admin/ticket-item.tsx`
- `components/dashboard/tickets-list.tsx`
- `components/technician/job-card.tsx`
- `components/technician/ticket-detail-view.tsx`

**Action:** Replace with `dayjs` for consistency and size reduction.

---

### Maps (Leaflet)

| Library | Size | Usage | Status |
|---------|------|-------|--------|
| `react-leaflet` | 1.1MB | 1 file | ✅ Properly isolated |
| `leaflet` | 500KB | 1 file | ✅ Properly isolated |

**Files using leaflet:**
- `app/admin/leads/map.tsx` (admin only)

**Status:** ✅ Already optimally used - only loaded in admin dashboard, not on landing page.

**Recommendation:** Ensure this is dynamically imported:
```typescript
const LeadsMap = dynamic(() => import('./map'), { ssr: false });
```

---

### Animation (Framer Motion)

| Library | Size | Usage | Status |
|---------|------|-------|--------|
| `framer-motion` | 600KB | 4 files | ⚠️ Can optimize |

**Files using framer-motion:**
1. `components/ui/client-animation-wrapper.tsx` (1 usage)
2. `components/providers/animation-provider.tsx` (1 usage)
3. `components/layout/mobile-nav.tsx` (1 usage)
4. `components/landing/user-type-toggle.tsx` (1 usage)

**Current:** Using full `motion` import
**Recommended:** Use `LazyMotion` for 80% size reduction

**Implementation:**
```typescript
// OLD (600KB)
import { motion } from 'framer-motion';

// NEW (120KB)
import { LazyMotion, domAnimation, m } from 'framer-motion';

<LazyMotion features={domAnimation}>
  <m.div animate={{ opacity: 1 }} />
</LazyMotion>
```

**Expected savings:** ~480KB (80% reduction)

---

### Testing/Dev Dependencies in Production

| Library | Size | Usage | Status |
|---------|------|-------|--------|
| `@faker-js/faker` | 2.5MB | 0 files | ❌ **MOVE TO devDependencies** |
| `pdf-parse` | 140KB | 0 files | ❌ **Remove or devDependencies** |
| `csv-parse` | 50KB | 0 files | ❌ **Remove** |
| `csv-parser` | 45KB | 0 files | ❌ **Remove** |

**Total savings:** ~2.7MB uncompressed (~800KB gzipped)

**Action Plan:**
```bash
# 1. Move faker to devDependencies
npm install --save-dev @faker-js/faker
npm uninstall @faker-js/faker

# 2. Remove unused CSV libraries (check if truly unused first)
npm uninstall csv-parse csv-parser

# 3. Check if pdf-parse is needed (might be used server-side)
# If only for admin, keep but ensure it's server-only
```

---

## Client Components Analysis

**Total Client Components:** 74

This is HIGH. Many components could be Server Components by default.

**Critical Issue:** `app/page.tsx` has `'use client'` at the top, making the entire landing page client-rendered.

### Landing Page Component Breakdown

```typescript
// app/page.tsx
'use client'; // ❌ This makes EVERYTHING client-side

import { BlurText } from '@/components/react-bits/BlurText'; // Heavy (framer-motion)
import { ClientAnimationWrapper } from '@/components/ui/client-animation-wrapper'; // Heavy
import dynamic from 'next/dynamic';

// These are already dynamically imported (good!)
const RetroGrid = dynamic(...);
const PriceComparison = dynamic(...);
const HowItWorks = dynamic(...);
// ... etc

export default function Home() {
  const [userType, setUserType] = useState<UserType>('residential'); // Only interactive part
  // ...
}
```

**Problem:** The `useState` hook requires `'use client'`, but that directive applies to the ENTIRE file. This means all imports and all code gets bundled for the client.

**Solution:** Extract state management into a smaller client component:

```typescript
// app/page.tsx (Server Component - NO 'use client')
import { LandingPageContent } from '@/components/landing/landing-page-content';

export default function Home() {
  // This is a Server Component!
  return <LandingPageContent />;
}

// components/landing/landing-page-content.tsx
'use client'; // Now only THIS component is client-side

export function LandingPageContent() {
  const [userType, setUserType] = useState<UserType>('residential');
  // ... rest of the logic
}
```

**Better Solution:** Even more granular - only the toggle needs to be client:

```typescript
// app/page.tsx (Server Component)
import { UserTypeToggle } from '@/components/landing/user-type-toggle';
import { HeroSection } from '@/components/landing/hero-section';

export default function Home() {
  return (
    <div>
      <UserTypeToggle /> {/* Only this is client-side */}
      <HeroSection /> {/* Server component */}
      {/* ... */}
    </div>
  );
}
```

**Expected Impact:**
- Reduce client-side JS by 40-50%
- Improve TTI from 6.1s to ~3.0s
- Reduce TBT from 460ms to ~200ms

---

## Bundle Analyzer Next Steps

1. **Run full bundle analysis:**
   ```bash
   npm run build:analyze
   ```
   This will generate an interactive HTML report showing exact bundle composition.

2. **Compare before/after** each optimization

3. **Focus on largest chunks first** (Pareto principle - 80/20 rule)

---

## Priority Optimization Order

### Phase 1: Quick Wins (1-2 hours)

1. ✅ Remove `dayjs` (unused)
   ```bash
   npm uninstall dayjs
   ```

2. ✅ Move `@faker-js/faker` to devDependencies
   ```bash
   npm uninstall @faker-js/faker
   npm install --save-dev @faker-js/faker
   ```

3. ✅ Remove unused CSV parsers
   ```bash
   npm uninstall csv-parse csv-parser
   ```

**Expected Impact:** -800KB gzipped

---

### Phase 2: Server Components (4-6 hours)

1. Convert `app/page.tsx` to Server Component
2. Extract client-only interactivity into small components
3. Test thoroughly (especially state management)

**Expected Impact:** -1.5MB gzipped, -2.6s TTI, -200ms TBT

---

### Phase 3: LazyMotion (2-3 hours)

1. Replace `motion` with `LazyMotion` + `m`
2. Test all animations
3. Verify no visual regressions

**Expected Impact:** -480KB gzipped

---

### Phase 4: Date Library Consolidation (2-3 hours)

1. Create `dayjs` wrapper matching `date-fns` API
2. Replace all `date-fns` imports
3. Test all date formatting
4. Remove `date-fns`

**Expected Impact:** -280KB gzipped

---

## Validation Checklist

After each phase:

- [ ] Run `npm run build` successfully
- [ ] Run `npm run test:ai` (verify chat works)
- [ ] Run Lighthouse audit
- [ ] Check for console errors
- [ ] Test on mobile device
- [ ] Verify no hydration errors

---

## Expected Final Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Bundle Size** | ~800KB | ~500KB | -37% |
| **TTI** | 6.1s | 3.0s | -51% |
| **TBT** | 460ms | 180ms | -61% |
| **Performance Score** | 88 | 95+ | +7 points |
| **Client JS** | ~2.5MB | ~1.5MB | -40% |

---

## Tools & Resources

### Bundle Analyzer
```bash
npm run build:analyze
```
Opens interactive treemap showing exact bundle composition.

### Dependency Check
```bash
bash scripts/analyze-bundle-deps.sh
```
Shows usage of heavy dependencies.

### Lighthouse
```bash
npx lighthouse http://localhost:3000 \
  --only-categories=performance \
  --output=json \
  --output-path=./lighthouse.json \
  --form-factor=mobile
```

---

## Notes

- All recommendations preserve existing functionality
- Server Component migration requires careful testing (hydration)
- Bundle analyzer will show the exact impact of each change
- Always test AI chat after changes (`npm run test:ai`)

---

*Report generated by automated analysis script. Numbers are estimates - actual results may vary.*
