// One navigation for the whole portfolio: the threshold homepage, the
// playground, the UX screen and every case study use this list, so nothing
// moves between them.
//
// While the new homepage and UX screen are previews, Home and UX point at
// their preview routes. To go live: set HOME to '/' and UX to '/ux' (after
// the preview pages have replaced index.astro and ux.astro).
export const HOME = '/home-v2';
export const UX = '/ux-v2';
export const RESUME = '/resume/Jacob_Meyerkopf_Product_UX_Resume.pdf';

export const navLinks = [
  { label: 'Home', href: HOME },
  { label: 'Research', href: '/research' },
  { label: 'Resume', href: RESUME },
  { label: 'Contact', href: '/contact' },
];
