export type PortfolioNodeKind = 'center' | 'intent' | 'concept' | 'gateway' | 'project' | 'lens';
export type PortfolioNodeStatus = 'public' | 'unfinished' | 'external';

export type PortfolioConnection = {
  id: string;
  weight: 1 | 2 | 3;
};

export type PortfolioNode = {
  id: string;
  title: string;
  kind: PortfolioNodeKind;
  status: PortfolioNodeStatus;
  summary?: string;
  kicker?: string;
  purpose?: string;
  connections: PortfolioConnection[];
  repo?: string;
  playUrl?: string;
  localPlayUrl?: string;
  previewSrc?: string;
  route?: string;
  embed?: {
    mode: 'iframe';
    url: string;
    verified: boolean;
    note?: string;
  };
};

const c = (id: string, weight: 1 | 2 | 3 = 2): PortfolioConnection => ({ id, weight });

export const portfolioV2Nodes: PortfolioNode[] = [
  {
    id: 'why',
    title: 'Why I make things',
    kind: 'center',
    status: 'public',
    summary: 'I use interaction to test ideas, make sense of systems, and let someone experience a framework rather than only read about it.',
    connections: [c('embody', 3), c('explore', 3), c('patterns', 3), c('learn-through-play', 3), c('ux-work', 2)]
  },
  {
    id: 'embody',
    title: 'Embody a framework',
    kind: 'intent',
    status: 'public',
    summary: 'Use interacting systems to let someone inhabit a way of experiencing the world.',
    connections: [c('why', 3), c('perspective', 3), c('embodiment', 3), c('interactive-art', 3), c('get-to-the-cafe', 3)]
  },
  {
    id: 'explore',
    title: 'Explore a question',
    kind: 'intent',
    status: 'public',
    summary: 'Build the idea far enough to discover whether it actually makes sense in interaction.',
    connections: [c('why', 3), c('systems', 3), c('game-design', 2), c('letter-river', 2), c('last-reading', 2)]
  },
  {
    id: 'patterns',
    title: 'Find hidden patterns',
    kind: 'intent',
    status: 'public',
    summary: 'Make systems for reading between the lines and finding structure in incomplete information.',
    connections: [c('why', 3), c('systems', 2), c('last-reading', 3), c('perspective', 2)]
  },
  {
    id: 'learn-through-play',
    title: 'Learn through play',
    kind: 'intent',
    status: 'public',
    summary: 'Use games as an experimental medium for understanding how learning happens.',
    connections: [c('why', 3), c('learning', 3), c('language', 3), c('play', 3), c('letter-river', 3)]
  },

  { id: 'disability', title: 'Disability', kind: 'concept', status: 'public', connections: [c('perspective', 3), c('embodiment', 3), c('get-to-the-cafe', 3), c('interactive-art', 2)] },
  { id: 'perspective', title: 'Perspective', kind: 'concept', status: 'public', connections: [c('embody', 3), c('disability', 3), c('interactive-art', 3), c('get-to-the-cafe', 3), c('last-reading', 2)] },
  { id: 'systems', title: 'Systems', kind: 'concept', status: 'public', connections: [c('explore', 3), c('game-design', 3), c('ux-work', 3), c('get-to-the-cafe', 3), c('letter-river', 3), c('last-reading', 2)] },
  { id: 'embodiment', title: 'Embodiment', kind: 'concept', status: 'public', connections: [c('embody', 3), c('disability', 3), c('get-to-the-cafe', 3), c('interactive-art', 2)] },
  { id: 'learning', title: 'Learning', kind: 'concept', status: 'public', connections: [c('learn-through-play', 3), c('language', 3), c('letter-river', 3), c('systems', 2)] },
  { id: 'language', title: 'Language', kind: 'concept', status: 'public', connections: [c('learning', 3), c('letter-river', 3), c('perspective', 2)] },
  { id: 'play', title: 'Play', kind: 'concept', status: 'public', connections: [c('learn-through-play', 3), c('game-design', 3), c('letter-river', 2), c('rotogo', 2), c('gig-duel', 2), c('last-reading', 2)] },
  { id: 'game-design', title: 'Game Design', kind: 'concept', status: 'public', connections: [c('play', 3), c('systems', 3), c('get-to-the-cafe', 3), c('letter-river', 2), c('last-reading', 3), c('rotogo', 2), c('gig-duel', 2)] },
  { id: 'interactive-art', title: 'Interactive Art', kind: 'concept', status: 'public', connections: [c('embody', 3), c('perspective', 3), c('embodiment', 2), c('get-to-the-cafe', 3)] },

  {
    id: 'ux-work',
    title: 'UX Work',
    kind: 'gateway',
    status: 'external',
    summary: 'Professional UX, research, workflow and systems work.',
    connections: [c('why', 2), c('systems', 3)],
    route: '/ux'
  },
  {
    id: 'unfinished',
    title: 'Unfinished',
    kind: 'lens',
    status: 'unfinished',
    summary: 'A separate workshop view for prototypes and ideas that are still being worked through.',
    connections: [c('phase-g', 3), c('splitpulse', 3)]
  },

  {
    id: 'get-to-the-cafe',
    title: 'Get to the Café',
    kind: 'project',
    status: 'public',
    kicker: 'Playable · Disability',
    summary: 'A browser game about the hidden cost of completing an ordinary social task while internal demands accumulate.',
    purpose: 'Built to embody a specific aspect of disabled experience against a simulation of the ordinary world. Layered systems each express that experience differently, allowing players to engage with the idea at different depths.',
    connections: [c('embody', 3), c('disability', 3), c('perspective', 3), c('systems', 3), c('embodiment', 3), c('game-design', 3), c('interactive-art', 3)],
    repo: 'flimmbark-source/CrazyBod',
    playUrl: 'https://whooble.itch.io/gettothecafe',
    localPlayUrl: '/play/get-to-the-cafe',
    previewSrc: '/previews/get-to-the-cafe.gif'
  },
  {
    id: 'letter-river',
    title: 'Letter River',
    kind: 'project',
    status: 'public',
    kicker: 'Playable · Education',
    summary: 'An experimental language-learning game and system.',
    purpose: 'An exploration of games as a medium for learning, using experimentation to ask how and why language is learned rather than treating learning as content delivery.',
    connections: [c('learn-through-play', 3), c('learning', 3), c('language', 3), c('systems', 3), c('play', 2), c('game-design', 2), c('explore', 2)],
    repo: 'flimmbark-source/HebrewLetterRiver',
    playUrl: 'https://letterriver.netlify.app/',
    embed: {
      mode: 'iframe',
      url: 'https://letterriver.netlify.app/',
      verified: false,
      note: 'Current deployment headers block framing; launch externally until that policy is deliberately changed.'
    }
  },
  {
    id: 'last-reading',
    title: 'The Last Reading',
    kind: 'project',
    status: 'public',
    kicker: 'Game · For Fun',
    summary: 'A solitaire-style horror roguelike built around constructing and interpreting five-card tarot readings. Cards score through patterns, Major Arcana can be discarded to trigger abilities, and upgrades let you increasingly manipulate the deck until a single draw can completely reshape a reading.',
    purpose: 'Underneath the card game is a second layer about interpretation itself: reading between the lines, finding patterns in incomplete information, and gradually uncovering secrets hidden inside the deck.',
    connections: [c('patterns', 3), c('game-design', 3), c('play', 2), c('systems', 2), c('perspective', 2), c('explore', 2)],
    repo: 'flimmbark-source/TheLastReading',
    playUrl: 'https://thelastreading.netlify.app/'
  },
  {
    id: 'rotogo',
    title: 'Rotogo',
    kind: 'project',
    status: 'public',
    kicker: 'Game · For Fun',
    summary: 'Rotogo started as a physical game idea and became the project that pulled me into programming. I taught myself React by trying to make the system actually work as a playable digital experience.',
    purpose: 'It matters to me less as a polished technical showcase than as the point where designing rules, interactions, and systems stopped being something I only described and became something I could build directly.',
    connections: [c('play', 2), c('game-design', 2)],
    route: 'https://rotogo.netlify.app/'
  },
  {
    id: 'gig-duel',
    title: 'Venue Rivals',
    kind: 'project',
    status: 'public',
    kicker: 'Game · For Fun',
    summary: 'A small game experiment I came up with while sitting in a shelter, something for my mind to do while hiding from missiles.',
    purpose: 'It is a compact example of how I use game design as a way to think: take an idea, give it rules, make it playable, and see what happens. The project is small on purpose, but the context it came out of is part of why it matters to me.',
    connections: [c('play', 2), c('game-design', 2)],
    playUrl: 'https://gigduel.netlify.app/'
  },

  {
    id: 'phase-g',
    title: 'PhaseG',
    kind: 'project',
    status: 'unfinished',
    kicker: 'Unfinished',
    summary: 'A disability roguelike prototype exploring persistent statuses and abilities across radically different play modes.',
    connections: [c('unfinished', 3), c('disability', 3), c('embodiment', 3), c('systems', 3), c('game-design', 3)],
    repo: 'flimmbark-source/PhaseG'
  },
  {
    id: 'splitpulse',
    title: 'SplitPulse',
    kind: 'project',
    status: 'unfinished',
    kicker: 'Unfinished',
    summary: 'An alchemical action-rhythm vertical slice built around configuring and performing responses in rhythm.',
    connections: [c('unfinished', 3), c('systems', 3), c('game-design', 3), c('play', 2)],
    repo: 'flimmbark-source/SplitPulse'
  }
];

export const portfolioV2NodeMap = new Map(portfolioV2Nodes.map((node) => [node.id, node]));
export const portfolioV2InitialIds = ['why', 'embody', 'explore', 'patterns', 'learn-through-play', 'get-to-the-cafe', 'letter-river', 'last-reading', 'rotogo', 'gig-duel', 'ux-work', 'unfinished'];

export function connectionWeight(a: PortfolioNode, b: PortfolioNode): number {
  return a.connections.find((connection) => connection.id === b.id)?.weight
    ?? b.connections.find((connection) => connection.id === a.id)?.weight
    ?? 0;
}
