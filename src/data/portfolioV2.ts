export type PortfolioNodeKind = 'gateway' | 'cluster' | 'project';
export type PortfolioNodeStatus = 'public' | 'unfinished' | 'external';

export type PortfolioNode = {
  id: string;
  title: string;
  kind: PortfolioNodeKind;
  status: PortfolioNodeStatus;
  summary?: string;
  kicker?: string;
  themes?: string[];
  practices?: string[];
  mediums?: string[];
  connections: string[];
  repo?: string;
  playUrl?: string;
  route?: string;
  embed?: {
    mode: 'iframe';
    url: string;
    verified: boolean;
    note?: string;
  };
};

export const portfolioV2Nodes: PortfolioNode[] = [
  {
    id: 'ux-work',
    title: 'UX Work',
    kind: 'gateway',
    status: 'external',
    summary: 'Professional UX, research, workflow and systems work.',
    kicker: 'Classic portfolio',
    connections: ['games'],
    route: '/'
  },
  {
    id: 'games',
    title: 'Games',
    kind: 'cluster',
    status: 'public',
    summary: 'Interactive work built to be experienced rather than explained.',
    connections: ['disability', 'education', 'for-fun', 'unfinished', 'ux-work']
  },
  {
    id: 'disability',
    title: 'Disability',
    kind: 'cluster',
    status: 'public',
    summary: 'Experiences that translate disabled perspective into mechanics and interaction.',
    connections: ['games', 'get-to-the-cafe', 'unfinished']
  },
  {
    id: 'education',
    title: 'Education',
    kind: 'cluster',
    status: 'public',
    summary: 'Interactive systems for learning through doing.',
    connections: ['games', 'letter-river', 'for-fun']
  },
  {
    id: 'for-fun',
    title: 'For Fun',
    kind: 'cluster',
    status: 'public',
    summary: 'Games made to explore mechanics, tone and play.',
    connections: ['games', 'rotogo', 'gig-duel', 'last-reading', 'education']
  },
  {
    id: 'unfinished',
    title: 'Unfinished',
    kind: 'cluster',
    status: 'unfinished',
    summary: 'Work in progress: prototypes, slices and ideas still being worked through.',
    connections: ['games', 'phase-g', 'splitpulse', 'wash-dishes', 'disability']
  },
  {
    id: 'get-to-the-cafe',
    title: 'Get to the Café',
    kind: 'project',
    status: 'public',
    kicker: 'Disability',
    summary: 'A browser game about managing accumulating internal demands while trying to complete an ordinary social task.',
    themes: ['disability', 'perspective', 'overload', 'embodiment'],
    practices: ['game design', 'interaction design', 'systems design'],
    mediums: ['browser game', '3D'],
    connections: ['disability', 'games', 'phase-g', 'wash-dishes'],
    repo: 'flimmbark-source/CrazyBod',
    playUrl: 'https://whooble.itch.io/gettothecafe'
  },
  {
    id: 'letter-river',
    title: 'Letter River',
    kind: 'project',
    status: 'public',
    kicker: 'Education',
    summary: 'A language-learning system built around repeated interaction, accessibility and adaptive practice.',
    themes: ['language', 'learning', 'accessibility'],
    practices: ['educational design', 'systems design', 'prototyping'],
    mediums: ['web app', 'PWA'],
    connections: ['education', 'games', 'for-fun'],
    repo: 'flimmbark-source/HebrewLetterRiver',
    playUrl: 'https://letterriver.netlify.app/',
    embed: {
      mode: 'iframe',
      url: 'https://letterriver.netlify.app/',
      verified: false,
      note: 'Current deployment headers block framing; keep as launch link until that policy is deliberately changed.'
    }
  },
  {
    id: 'rotogo',
    title: 'Rotogo',
    kind: 'project',
    status: 'public',
    kicker: 'For Fun',
    summary: 'A game/app project currently retained from the existing portfolio roster.',
    connections: ['for-fun', 'games'],
    route: '/rotogo'
  },
  {
    id: 'gig-duel',
    title: 'Gig Duel',
    kind: 'project',
    status: 'public',
    kicker: 'For Fun',
    summary: 'Public roster item. Repository and playable source are still unresolved.',
    connections: ['for-fun', 'games']
  },
  {
    id: 'last-reading',
    title: 'The Last Reading',
    kind: 'project',
    status: 'public',
    kicker: 'For Fun',
    summary: 'A tarot-inspired card game with single-player readings and multiplayer duel systems.',
    themes: ['ritual', 'cards', 'interpretation'],
    practices: ['game design', 'systems design', '3D interaction'],
    mediums: ['browser game', '3D'],
    connections: ['for-fun', 'games', 'splitpulse'],
    repo: 'flimmbark-source/TheLastReading'
  },
  {
    id: 'phase-g',
    title: 'PhaseG',
    kind: 'project',
    status: 'unfinished',
    kicker: 'Unfinished',
    summary: 'A disability roguelike prototype exploring persistent statuses and abilities across radically different play modes.',
    themes: ['disability', 'embodiment', 'state'],
    practices: ['systems design', 'game design', 'prototyping'],
    mediums: ['browser prototype', '3D'],
    connections: ['unfinished', 'disability', 'get-to-the-cafe'],
    repo: 'flimmbark-source/PhaseG'
  },
  {
    id: 'splitpulse',
    title: 'SplitPulse',
    kind: 'project',
    status: 'unfinished',
    kicker: 'Unfinished',
    summary: 'An alchemical action-rhythm vertical slice built around configuring and performing responses in rhythm.',
    themes: ['systems', 'rhythm', 'combination'],
    practices: ['interaction design', 'game design', 'systems design'],
    mediums: ['browser prototype', '3D', 'audio'],
    connections: ['unfinished', 'last-reading', 'games'],
    repo: 'flimmbark-source/SplitPulse'
  },
  {
    id: 'wash-dishes',
    title: 'Just Wash the Dishes',
    kind: 'project',
    status: 'unfinished',
    kicker: 'Unfinished',
    summary: 'A disability-focused interactive concept about endurance, burnout and the hidden cost of an ordinary task.',
    themes: ['disability', 'endurance', 'burnout', 'embodiment'],
    practices: ['experience design', 'game design'],
    mediums: ['design document'],
    connections: ['unfinished', 'disability', 'get-to-the-cafe'],
    repo: 'flimmbark-source/WashDishes'
  }
];

export const portfolioV2NodeMap = new Map(portfolioV2Nodes.map((node) => [node.id, node]));

export const portfolioV2InitialIds = ['ux-work', 'games', 'unfinished'];
