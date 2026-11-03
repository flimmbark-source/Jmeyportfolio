import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// `site` is what makes canonical URLs and social-card image URLs absolute.
// Without it, og:image is relative and no platform will render the card.
const SITE = 'https://jacobmeyportfolio.netlify.app';

// The only route kept out of the sitemap is the redirect stub that keeps
// shared /playground links working.
const EXCLUDED = ['/playground'];

export default defineConfig({
  site: SITE,
  integrations: [
    tailwind({
      applyBaseStyles: false
    }),
    react(),
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/$/, '');
        return !EXCLUDED.includes(path);
      }
    })
  ]
});
