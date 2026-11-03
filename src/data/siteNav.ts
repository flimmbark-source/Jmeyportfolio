// One navigation for the whole portfolio: the threshold homepage, the
// playground, the UX screen, Research, Contact and every case study use this
// list, so nothing moves between them.
//
export const HOME = '/';
export const UX = '/ux';
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

// Case-study content JSON hardcodes '/ux' and '/' in its hero actions, which
// predates the shared nav. Everything that renders a stored href routes it
// through here, so moving a route again stays a change in this file.
const LEGACY_ROUTES: Record<string, string> = {
  '/ux': UX,
  '/': HOME,
};

export const resolveHref = (href: string): string => LEGACY_ROUTES[href] ?? href;
