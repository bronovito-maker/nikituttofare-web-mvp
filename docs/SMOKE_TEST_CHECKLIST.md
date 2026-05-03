# Smoke Test Checklist (Pre-Merge)

## Chat
1. Open `/chat`.
2. Start a new request in Italian.
3. Verify flow order:
   - category selection
   - diagnosis
   - price range shown
   - only after acceptance asks personal data
4. Confirm no runtime errors in UI.

## Auth
1. Open `/login`.
2. Login as customer and verify redirect to `/dashboard`.
3. Logout flow from `/auth/signout`.
4. Login as technician and verify access to `/technician/*`.

## Dashboard
1. Open `/dashboard` as customer:
   - ticket list renders
   - profile page renders
2. Open `/technician/dashboard` as technician:
   - jobs list renders
   - claim/open actions visible
3. Verify no broken links in top nav/mobile nav.

## SEO/Indexing Spot Check
1. `GET /robots.txt` returns route-based robots.
2. `GET /sitemap.xml` returns route-based sitemap.
3. Canonical URLs use `https://www.nikituttofare.com`.
