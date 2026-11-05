# Landing page

The public page explains school records before introducing synchronization. The attendance preview and the 3D network are explicitly illustrative; neither reads or writes workspace data.

Design references: [Linear](https://linear.app) for product-first sections and typographic hierarchy, and [Stripe](https://stripe.com) for showing a workflow visually. The layout, copy, assets and Three.js scene are original. No third-party logos, testimonials or adoption numbers are used.

The Three.js scene is a separate dynamic import. It loads when the illustration enters the viewport, caps pixel density at 1.5, runs at up to 30 frames per second, stops offscreen or in hidden tabs, and disposes its resources on unmount. Reduced-motion preferences produce a still scene. Save-Data connections retain the HTML/CSS illustration without downloading Three.js. WebGL and download failures retain the same fallback. Pause and connection controls affect only the illustration.

Public HTML is generated at build time. The local hub serves it through its existing public-page renderer; Vercel rewrites `/` to the generated `landing.html`. The private app shell stays separate. The home page hydrates without loading workspace encryption, storage or validation code. Three.js is excluded from the service worker’s mandatory precache.

Run `npm run build`, `npm test`, and `npm run test:e2e -- tests/e2e/landing.spec.ts tests/e2e/site-quality.spec.ts`. Browser tests use an isolated local SQLite hub, not the public demo.
