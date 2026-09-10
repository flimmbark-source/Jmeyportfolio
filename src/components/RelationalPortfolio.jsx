import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
  connectionWeight,
  portfolioV2InitialIds,
  portfolioV2NodeMap,
} from '../data/portfolioV2';
import '../styles/portfolio-v2.css';

const spring = { type: 'spring', stiffness: 210, damping: 26, mass: 0.9 };

const initialPositions = {
  why: [50, 43],
  embody: [24, 24],
  explore: [48, 17],
  patterns: [72, 25],
  'learn-through-play': [79, 55],
  'get-to-the-cafe': [24, 61],
  'letter-river': [48, 73],
  'last-reading': [68, 78],
  rotogo: [11, 82],
  'gig-duel': [88, 83],
  'ux-work': [8, 42],
  unfinished: [92, 38],
};

function readFocusFromUrl() {
  if (typeof window === 'undefined') return null;
  const value = new URL(window.location.href).searchParams.get('focus');
  return value && portfolioV2NodeMap.has(value) ? value : null;
}

function writeFocusToUrl(id, replace = false) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (id) url.searchParams.set('focus', id);
  else url.searchParams.delete('focus');
  window.history[replace ? 'replaceState' : 'pushState']({ focus: id }, '', url);
}

function getVisibleNodes(focusNode) {
  if (!focusNode) {
    return portfolioV2InitialIds.map((id) => portfolioV2NodeMap.get(id)).filter(Boolean);
  }

  if (focusNode.id === 'unfinished' || focusNode.status === 'unfinished') {
    const ids = focusNode.id === 'unfinished'
      ? ['unfinished', ...focusNode.connections.map((item) => item.id)]
      : ['unfinished', focusNode.id, ...focusNode.connections.map((item) => item.id)];
    return [...new Set(ids)]
      .map((id) => portfolioV2NodeMap.get(id))
      .filter(Boolean)
      .filter((node) => node.id === 'unfinished' || node.status === 'unfinished' || node.kind === 'concept');
  }

  const ids = [focusNode.id, ...focusNode.connections.map((item) => item.id), 'why', 'unfinished'];
  return [...new Set(ids)]
    .map((id) => portfolioV2NodeMap.get(id))
    .filter(Boolean)
    .filter((node) => node.status !== 'unfinished' || node.id === 'unfinished');
}

function getPositions(nodes, focusNode) {
  if (!focusNode) {
    return new Map(nodes.map((node, index) => [node.id, initialPositions[node.id] || [15 + (index % 5) * 18, 20 + Math.floor(index / 5) * 30]]));
  }

  const positions = new Map([[focusNode.id, [50, 48]]]);
  const others = nodes.filter((node) => node.id !== focusNode.id);
  const count = Math.max(others.length, 1);

  others.forEach((node, index) => {
    const weight = connectionWeight(focusNode, node);
    const radius = weight === 3 ? 24 : weight === 2 ? 33 : 40;
    const angle = (-Math.PI / 2) + (index / count) * Math.PI * 2;
    const x = 50 + Math.cos(angle) * radius;
    const y = 48 + Math.sin(angle) * radius * 0.72;
    positions.set(node.id, [Math.max(8, Math.min(92, x)), Math.max(10, Math.min(88, y))]);
  });

  return positions;
}

function GraphNode({ node, position, activeId, previewId, onSelect, onPreview, reducedMotion }) {
  const active = node.id === activeId;
  const previewNode = previewId ? portfolioV2NodeMap.get(previewId) : null;
  const previewWeight = previewNode ? connectionWeight(previewNode, node) : 0;
  const dimmed = Boolean(previewNode && node.id !== previewId && previewWeight === 0);
  const related = Boolean(previewNode && previewWeight > 0);

  return (
    <motion.div
      className="pv2-orbit"
      initial={false}
      animate={{ left: `${position[0]}%`, top: `${position[1]}%`, opacity: dimmed ? 0.18 : 1 }}
      transition={reducedMotion ? { duration: 0 } : spring}
    >
      <motion.button
        type="button"
        className={`pv2-object pv2-object--${node.kind} pv2-object--${node.status}${active ? ' is-active' : ''}${related ? ' is-related' : ''}`}
        onClick={() => onSelect(node.id)}
        onMouseEnter={() => onPreview(node.id)}
        onMouseLeave={() => onPreview(null)}
        onFocus={() => onPreview(node.id)}
        onBlur={() => onPreview(null)}
        whileHover={reducedMotion ? undefined : { scale: active ? 1.03 : 1.08 }}
        whileTap={reducedMotion ? undefined : { scale: 0.97 }}
        aria-pressed={active}
        aria-label={`${node.title}. ${node.summary || 'Explore connection.'}`}
      >
        <span className="pv2-object__type">{node.kicker || node.kind}</span>
        <span className="pv2-object__title">{node.title}</span>
      </motion.button>
    </motion.div>
  );
}

function RelationshipLines({ nodes, positions, focusId, previewId }) {
  const sourceId = previewId || focusId;
  const source = sourceId ? portfolioV2NodeMap.get(sourceId) : null;
  if (!source) return null;
  const sourcePos = positions.get(source.id);
  if (!sourcePos) return null;

  return (
    <svg className="pv2-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {nodes.map((node) => {
        if (node.id === source.id) return null;
        const weight = connectionWeight(source, node);
        const targetPos = positions.get(node.id);
        if (!weight || !targetPos) return null;
        return (
          <motion.line
            key={`${source.id}-${node.id}`}
            x1={sourcePos[0]}
            y1={sourcePos[1]}
            x2={targetPos[0]}
            y2={targetPos[1]}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.18 + weight * 0.18 }}
            strokeWidth={0.08 + weight * 0.055}
          />
        );
      })}
    </svg>
  );
}

function ProjectTakeover({ node, onBack, onSelect, reducedMotion }) {
  const conceptualConnections = node.connections
    .map(({ id, weight }) => ({ node: portfolioV2NodeMap.get(id), weight }))
    .filter(({ node: item }) => item && item.kind !== 'project' && item.id !== 'unfinished')
    .sort((a, b) => b.weight - a.weight);

  return (
    <motion.section
      className="pv2-takeover"
      initial={reducedMotion ? false : { opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0, scale: 0.99 }}
      transition={reducedMotion ? { duration: 0 } : spring}
      aria-labelledby="pv2-project-title"
    >
      <div className="pv2-takeover__bar">
        <button type="button" className="pv2-control" onClick={onBack}>← Back to field</button>
        <span>{node.kicker || 'Project'}</span>
      </div>

      <div className="pv2-takeover__body">
        <div className="pv2-takeover__identity">
          <p className="pv2-label">Experience the work</p>
          <h2 id="pv2-project-title">{node.title}</h2>
          {node.summary && <p className="pv2-takeover__summary">{node.summary}</p>}
        </div>

        <div className="pv2-artifact">
          <div className="pv2-artifact__field">
            <span className="pv2-artifact__ghost">{node.title}</span>
            <div className="pv2-artifact__actions">
              {node.playUrl && (
                <a className="pv2-primary-action" href={node.playUrl} target="_blank" rel="noreferrer">
                  Enter the work ↗
                </a>
              )}
              {node.route && <a className="pv2-primary-action" href={node.route}>Open project →</a>}
              {!node.playUrl && !node.route && <span className="pv2-unavailable">Playable presentation not connected yet.</span>}
            </div>
          </div>
        </div>

        {node.purpose && (
          <div className="pv2-purpose">
            <p className="pv2-label">Why it exists</p>
            <p>{node.purpose}</p>
          </div>
        )}

        {conceptualConnections.length > 0 && (
          <div className="pv2-connections" aria-label="Conceptual connections">
            <p className="pv2-label">Read it another way</p>
            <div>
              {conceptualConnections.map(({ node: related }) => (
                <button type="button" key={related.id} onClick={() => onSelect(related.id)}>{related.title}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function GatewayTakeover({ node, onBack, reducedMotion }) {
  return (
    <motion.section
      className="pv2-takeover pv2-takeover--gateway"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      aria-labelledby="pv2-project-title"
    >
      <div className="pv2-takeover__bar">
        <button type="button" className="pv2-control" onClick={onBack}>← Back to field</button>
        <span>Professional work</span>
      </div>
      <div className="pv2-gateway">
        <p className="pv2-label">A different way of reading the work</p>
        <h2 id="pv2-project-title">UX Work</h2>
        <p>{node.summary}</p>
        <a className="pv2-primary-action" href={node.route || '/'}>Enter classic UX portfolio →</a>
      </div>
    </motion.section>
  );
}

export default function RelationalPortfolio() {
  const reducedMotion = useReducedMotion();
  const [focusId, setFocusId] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    const initialFocus = readFocusFromUrl();
    if (initialFocus) setFocusId(initialFocus);

    const onPopState = () => {
      setFocusId(readFocusFromUrl());
      setTrail([]);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && readFocusFromUrl()) window.history.back();
    };
    window.addEventListener('popstate', onPopState);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const focusNode = focusId ? portfolioV2NodeMap.get(focusId) : null;
  const takeover = focusNode?.kind === 'project' || focusNode?.kind === 'gateway';
  const visibleNodes = useMemo(() => getVisibleNodes(focusNode), [focusNode]);
  const positions = useMemo(() => getPositions(visibleNodes, focusNode), [visibleNodes, focusNode]);

  const selectNode = (id) => {
    if (!portfolioV2NodeMap.has(id) || id === focusId) return;
    setTrail((current) => (focusId ? [...current, focusId] : current));
    setFocusId(id);
    setPreviewId(null);
    writeFocusToUrl(id);
  };

  const goBack = () => {
    if (trail.length) {
      const nextTrail = [...trail];
      const previous = nextTrail.pop() || null;
      setTrail(nextTrail);
      setFocusId(previous);
      setPreviewId(null);
      writeFocusToUrl(previous);
      return;
    }
    setFocusId(null);
    setPreviewId(null);
    writeFocusToUrl(null);
  };

  return (
    <div className="pv2-shell">
      <header className="pv2-masthead">
        <div>
          <p className="pv2-kicker">Jacob Meyerkopf</p>
          <h1>Things I make, and why.</h1>
        </div>
        <p className="pv2-thesis">I create interactive art, games, and experiences that let people step into another way of seeing the world.</p>
      </header>

      <AnimatePresence mode="wait">
        {takeover && focusNode ? (
          focusNode.kind === 'gateway'
            ? <GatewayTakeover key={focusNode.id} node={focusNode} onBack={goBack} reducedMotion={reducedMotion} />
            : <ProjectTakeover key={focusNode.id} node={focusNode} onBack={goBack} onSelect={selectNode} reducedMotion={reducedMotion} />
        ) : (
          <motion.main
            key="field"
            className="pv2-field"
            initial={false}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
          >
            <div className="pv2-field__chrome">
              <button type="button" className="pv2-control" onClick={goBack} disabled={!focusNode}>← Back</button>
              <div className="pv2-field__status" aria-live="polite">
                {previewId
                  ? `Previewing connections from ${portfolioV2NodeMap.get(previewId)?.title}`
                  : focusNode
                    ? `Viewing through ${focusNode.title}`
                    : 'Move through the field. Hover previews; click changes the lens.'}
              </div>
            </div>

            <div className="pv2-canvas" onMouseLeave={() => setPreviewId(null)}>
              <RelationshipLines nodes={visibleNodes} positions={positions} focusId={focusId} previewId={previewId} />
              {visibleNodes.map((node) => (
                <GraphNode
                  key={node.id}
                  node={node}
                  position={positions.get(node.id)}
                  activeId={focusId}
                  previewId={previewId}
                  onSelect={selectNode}
                  onPreview={setPreviewId}
                  reducedMotion={reducedMotion}
                />
              ))}
            </div>

            <aside className="pv2-reading">
              <p className="pv2-label">{focusNode ? 'Current lens' : 'How to read this'}</p>
              <h2>{focusNode ? focusNode.title : 'The same work can mean different things depending on what you look through.'}</h2>
              <p>{focusNode?.summary || 'Hover or keyboard-focus an object to preview its relationships. Select an idea to reorganize the field. Select a finished project to experience the work itself.'}</p>
            </aside>
          </motion.main>
        )}
      </AnimatePresence>

      <footer className="pv2-footer">
        <span>Unfinished work is kept in its own workshop lens rather than mixed into finished project paths.</span>
        <a href="/">Classic UX portfolio</a>
      </footer>
    </div>
  );
}
