# Fix: `i.ibb.co` external image hostname not configured

## Plan
- [x] `next.config.mjs` — Add `i.ibb.co` to `images.remotePatterns`
- [x] Restart Next.js dev server to apply config change
- [x] Verify home page, tours list, and tour detail pages load without the runtime error
