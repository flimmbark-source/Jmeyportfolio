// One navigation for the whole portfolio: the threshold homepage, the
// playground, the UX screen, Research, Contact and every case study use this
// list, so nothing moves between them.
//
// While the new homepage and UX screen are previews, Home and UX point at
// their preview routes. To go live: set HOME to '/' and UX to '/ux' (after
// the preview pages have replaced index.astro and ux.astro).
export const HOME = '/home-v2';
export const UX = '/ux-v2';
export const RESUME = '/resume/Jacob_Meyerkopf_Product_UX_Resume.pdf';

// Work leads: it is the reason most visitors are here, and without it a
// visitor who lands on a case study or Research has no way back to the
// portfolio from the nav.
export const navLinks = [
  { label: 'Work', href: UX },
  { label: 'Research', href: '/research' },
  { label: 'Resume', href: RESUME },
  { label: 'Contact', href: '/contact' },
];

// Case-study content JSON predates the shared nav and hardcodes '/ux' and '/'
// in its hero actions. Route those through the constants so the preview
// routes work and the go-live switch stays a one-line change.
const LEGACY_ROUTES: Record<string, string> = {
  '/ux': UX,
  '/': HOME,
};

export const resolveHref = (href: string): string => LEGACY_ROUTES[href] ?? href;
