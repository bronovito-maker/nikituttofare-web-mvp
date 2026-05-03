# AI Quality Focus Plan (Climate + Tourist/Confused)

## Baseline
- Overall pass rate around 53% on current synthetic suite.
- Weak areas:
  - category `climate`
  - user types `tourist` and `confused`

## Iteration Plan
1. Add 30-50 new simulated examples focused on:
   - HVAC vocabulary variants (IT + EN mixed)
   - vague location references from tourists
   - ambiguous intent with low-context phrasing
2. Update normalization rules for climate keywords:
   - cold room / fridge / fan-coil / split / heating failure variants
3. Add ambiguity escalation rules:
   - if tourist/confused + weak category confidence, ask one clarifying question before classification lock.
4. Re-run:
   - `npm run test:ai`
   - `npm run test:ai:category`
   - `npm run test:ai:emergency`

## Acceptance Criteria
- category accuracy `climate` >= 65%
- tourist user-type pass rate >= 50%
- confused user-type pass rate >= 45%
- no regression > 3% on plumbing/electric/locksmith.
