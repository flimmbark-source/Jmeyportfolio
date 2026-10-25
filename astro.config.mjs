import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// `site` is what makes canonical URLs and social-card image URLs absolute.
// Without it, og:image is relative and no platform will render the card.
const SITE = 'https://jacobmeyportfolio.netlify.app';

// Routes kept out of the sitemap: previews of the new homepage and Work
// screen, the sidelined carousel, and the redirect stubs.
const EXCLUDED = ['/home-v2', '/ux-v2', '/start', '/v2', '/playground'];

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
