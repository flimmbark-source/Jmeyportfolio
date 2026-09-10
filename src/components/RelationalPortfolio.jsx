import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { portfolioV2InitialIds, portfolioV2NodeMap } from '../data/portfolioV2';
import '../styles/portfolio-v2.css';

const transition = { type: 'spring', stiffness: 260, damping: 28, mass: 0.8 };

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

function NodeCard({ node, active, dimmed, onSelect, reducedMotion }) {
  const isProject = node.kind === 'project';

  return (
    <motion.button
      layout
      layoutId={`node-${node.id}`}
      type="button"
      className={`pv2-node pv2-node--${node.kind} pv2-node--${node.status}${active ? ' is-active' : ''}${dimmed ? ' is-dimmed' : ''}`}
      onClick={() => onSelect(node.id)}
      transition={reducedMotion ? { duration: 0 } : transition}
      whileHover={reducedMotion ? undefined : { y: -4 }}
      whileTap={reducedMotion ? undefined : { scale: 0.985 }}
      aria-pressed={active}
    >
      <span className="pv2-node__meta">
        {node.kicker || (isProject ? node.status : node.kind)}
      </span>
      <span className="pv2-node__title">{node.title}</span>
      {node.summary && <span className="pv2-node__summary">{node.summary}</span>}
      <span className="pv2-node__hint">{isProject ? 'Open work' : 'Explore'}</span>
    </motion.button>
  );
}

function DetailPanel({ node, onSelect, onClose, reducedMotion }) {
  const connected = node.connections
    .map((id) => portfolioV2NodeMap.get(id))
    .filter(Boolean)
    .slice(0, 6);

  return (
    <motion.section
      layout
      className="pv2-detail"
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? undefined : { opacity: 0, y: 12 }}
      transition={reducedMotion ? { duration: 0 } : transition}
      aria-live="polite"
    >
      <div className="pv2-detail__topline">
        <span>{node.kicker || node.kind}</span>
        <button type="button" className="pv2-text-button" onClick={onClose}>Close</button>
      </div>

      <h2>{node.title}</h2>
      {node.summary && <p className="pv2-detail__summary">{node.summary}</p>}

      {node.kind === 'project' && (
        <div className="pv2-detail__actions">
          {node.playUrl && (
            <a className="pv2-action pv2-action--primary" href={node.playUrl} target="_blank" rel="noreferrer">
              Play / open product
            </a>
          )}
          {node.route && (
            <a className="pv2-action" href={node.route}>Open</a>
          )}
          {node.repo && (
            <a className="pv2-action" href={`https://github.com/${node.repo}`} target="_blank" rel="noreferrer">
              Source
            </a>
          )}
        </div>
      )}

      {node.id === 'ux-work' && (
        <div className="pv2-detail__actions">
          <a className="pv2-action pv2-action--primary" href={node.route || '/'}>Enter classic UX portfolio</a>
        </div>
      )}

      {node.embed && !node.embed.verified && (
        <p className="pv2-note">Embedded play is intentionally not enabled yet. {node.embed.note}</p>
      )}

      {(node.themes?.length || node.practices?.length || node.mediums?.length) && (
        <div className="pv2-tags" aria-label="Project relationships">
          {[...(node.themes || []), ...(node.practices || []), ...(node.mediums || [])].map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}

      {connected.length > 0 && (
        <div className="pv2-related">
          <p className="pv2-related__label">Connected to</p>
          <div className="pv2-related__items">
            {connected.map((related) => (
              <button type="button" key={related.id} onClick={() => onSelect(related.id)}>
                {related.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}

export default function RelationalPortfolio() {
  const reducedMotion = useReducedMotion();
  const [focusId, setFocusId] = useState(null);
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    const initialFocus = readFocusFromUrl();
    if (initialFocus) setFocusId(initialFocus);

    const onPopState = () => {
      setFocusId(readFocusFromUrl());
      setTrail([]);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const focusNode = focusId ? portfolioV2NodeMap.get(focusId) : null;

  const visibleNodes = useMemo(() => {
    if (!focusNode) {
      return portfolioV2InitialIds.map((id) => portfolioV2NodeMap.get(id)).filter(Boolean);
    }

    const ids = [focusNode.id, ...focusNode.connections];
    return [...new Set(ids)]
      .map((id) => portfolioV2NodeMap.get(id))
      .filter(Boolean);
  }, [focusNode]);

  const selectNode = (id) => {
    if (!portfolioV2NodeMap.has(id) || id === focusId) return;
    setTrail((current) => (focusId ? [...current, focusId] : current));
    setFocusId(id);
    writeFocusToUrl(id);
  };

  const goBack = () => {
    if (trail.length === 0) {
      setFocusId(null);
      writeFocusToUrl(null);
      return;
    }
    const nextTrail = [...trail];
    const previous = nextTrail.pop() || null;
    setTrail(nextTrail);
    setFocusId(previous);
    writeFocusToUrl(previous);
  };

  const closeFocus = () => {
    setTrail([]);
    setFocusId(null);
    writeFocusToUrl(null);
  };

  return (
    <div className="pv2-shell">
      <header className="pv2-intro">
        <div>
          <p className="pv2-eyebrow">Jacob Meyerkopf · design through experience</p>
          <h1>I create interactive art, games, and experiences that let people step into another way of seeing the world.</h1>
        </div>
        <p className="pv2-intro__aside">
          Select something. The field reorganizes around what it connects to.
        </p>
      </header>

      <div className="pv2-toolbar">
        <button type="button" className="pv2-text-button" onClick={goBack} disabled={!focusId}>
          ← Back
        </button>
        <span className="pv2-context">{focusNode ? `Viewing through: ${focusNode.title}` : 'Open field'}</span>
      </div>

      <LayoutGroup>
        <main className={`pv2-field${focusNode ? ' has-focus' : ''}`}>
          <div className="pv2-field__nodes">
            <AnimatePresence mode="popLayout">
              {visibleNodes.map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  active={node.id === focusId}
                  dimmed={Boolean(focusNode && node.id !== focusId && !focusNode.connections.includes(node.id))}
                  onSelect={selectNode}
                  reducedMotion={reducedMotion}
                />
              ))}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {focusNode && (
              <DetailPanel
                key={focusNode.id}
                node={focusNode}
                onSelect={selectNode}
                onClose={closeFocus}
                reducedMotion={reducedMotion}
              />
            )}
          </AnimatePresence>
        </main>
      </LayoutGroup>

      <footer className="pv2-footer">
        <span>This is the interaction shell, not final visual styling.</span>
        <a href="/">Classic UX portfolio</a>
      </footer>
    </div>
  );
}
