import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { portfolioV2NodeMap } from '../data/portfolioV2';
import '../styles/portfolio-v2.css';

const spring = { type: 'spring', stiffness: 220, damping: 28, mass: 0.9 };
const softSpring = { type: 'spring', stiffness: 180, damping: 24, mass: 0.85 };
const publicProjectIds = ['get-to-the-cafe', 'letter-river', 'last-reading', 'rotogo', 'gig-duel'];
const unfinishedProjectIds = ['phase-g', 'splitpulse', 'wash-dishes'];

function readProjectFromUrl() {
  if (typeof window === 'undefined') return null;
  const value = new URL(window.location.href).searchParams.get('project');
  const node = value ? portfolioV2NodeMap.get(value) : null;
  return node?.kind === 'project' || node?.kind === 'gateway' || node?.id === 'unfinished' ? value : null;
}

function writeProjectToUrl(id, replace = false) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (id) url.searchParams.set('project', id);
  else url.searchParams.delete('project');
  url.searchParams.delete('focus');
  window.history[replace ? 'replaceState' : 'pushState']({ project: id }, '', url);
}

function ProjectVisual({ node, large = false }) {
  return (
    <div className={`pv2-visual pv2-visual--${node.id}${large ? ' is-large' : ''}`} aria-hidden="true">
      <div className="pv2-visual__frame">
        <span className="pv2-visual__mark">{node.title}</span>
        <span className="pv2-visual__status">{node.status === 'unfinished' ? 'in progress' : 'interactive work'}</span>
      </div>
    </div>
  );
}

function ProjectTile({ node, placement, index, onSelect, reducedMotion }) {
  return (
    <motion.button
      layoutId={`project-${node.id}`}
      type="button"
      className={`pv2-project-tile pv2-project-tile--${placement}`}
      onClick={() => onSelect(node.id)}
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reducedMotion ? undefined : { y: -7, rotate: placement === 'left' ? -0.55 : placement === 'right' ? 0.55 : 0 }}
      whileFocus={reducedMotion ? undefined : { y: -4 }}
      whileTap={reducedMotion ? undefined : { scale: 0.985 }}
      transition={reducedMotion ? { duration: 0 } : { ...softSpring, delay: 0.04 + index * 0.045 }}
      aria-label={`Open ${node.title}`}
    >
      <ProjectVisual node={node} />
      <span className="pv2-project-tile__caption">
        <strong>{node.title}</strong>
        <span>{node.kicker?.replace('Playable · ', '').replace('Game · ', '') || 'Project'}</span>
      </span>
    </motion.button>
  );
}

function GatewayLink({ className, eyebrow, title, onClick, reducedMotion, delay = 0 }) {
  return (
    <motion.button
      className={`pv2-gateway-link ${className}`}
      type="button"
      onClick={onClick}
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reducedMotion ? undefined : { x: className.includes('unfinished') ? -4 : 4 }}
      whileTap={reducedMotion ? undefined : { scale: 0.985 }}
      transition={reducedMotion ? { duration: 0 } : { ...softSpring, delay }}
    >
      <span>{eyebrow}</span>
      <strong>{title}</strong>
    </motion.button>
  );
}

function Overview({ onSelect, reducedMotion }) {
  const projects = publicProjectIds.map((id) => portfolioV2NodeMap.get(id)).filter(Boolean);
  const placements = ['top', 'left', 'right', 'bottom-left', 'bottom-right'];

  return (
    <motion.main
      className="pv2-overview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.22 }}
    >
      <section className="pv2-overview__stage" aria-label="Selected work">
        <motion.div
          className="pv2-overview__statement"
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="pv2-overline">Interactive work · systems · perspective</p>
          <h1>I make systems<br />you can step inside.</h1>
          <p>I create games, interactive art, learning experiments, and UX work to explore how people experience the world.</p>
        </motion.div>

        {projects.map((node, index) => (
          <ProjectTile
            key={node.id}
            node={node}
            placement={placements[index]}
            index={index}
            onSelect={onSelect}
            reducedMotion={reducedMotion}
          />
        ))}

        <GatewayLink
          className="pv2-gateway-link--ux"
          eyebrow="Professional work"
          title="UX Work ↗"
          onClick={() => onSelect('ux-work')}
          reducedMotion={reducedMotion}
          delay={0.15}
        />

        <GatewayLink
          className="pv2-gateway-link--unfinished"
          eyebrow="Workshop"
          title="Unfinished →"
          onClick={() => onSelect('unfinished')}
          reducedMotion={reducedMotion}
          delay={0.2}
        />
      </section>
    </motion.main>
  );
}

function ProjectFocus({ node, onBack, onSelect, reducedMotion }) {
  const siblingIds = node.status === 'unfinished' ? unfinishedProjectIds : publicProjectIds;

  return (
    <motion.main
      className="pv2-focus"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.2 }}
    >
      <button className="pv2-back" type="button" onClick={onBack}>← {node.status === 'unfinished' ? 'Workshop' : 'All work'}</button>

      <section className="pv2-focus__layout">
        <motion.div
          className="pv2-focus__intro"
          initial={reducedMotion ? false : { opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="pv2-overline">{node.kicker || 'Project'}</p>
          <motion.h1 layoutId={`title-${node.id}`}>{node.title}</motion.h1>
          <p className="pv2-focus__summary">{node.summary}</p>
          {node.purpose && <p className="pv2-focus__purpose">{node.purpose}</p>}
        </motion.div>

        <motion.div className="pv2-focus__artifact" layoutId={`project-${node.id}`} transition={reducedMotion ? { duration: 0 } : spring}>
          <ProjectVisual node={node} large />
          <div className="pv2-focus__artifact-footer">
            <div>
              <span>Preview</span>
              <strong>{node.status === 'unfinished' ? 'Prototype preview asset can live here' : 'Gameplay preview asset can live here'}</strong>
            </div>
            {node.playUrl && (
              <a href={node.playUrl} target="_blank" rel="noreferrer">Play in browser ↗</a>
            )}
            {!node.playUrl && node.route && <a href={node.route}>Open project →</a>}
            {!node.playUrl && !node.route && <span className="pv2-focus__pending">Playable build not connected yet</span>}
          </div>
        </motion.div>
      </section>

      <div className="pv2-focus__rail" aria-label={node.status === 'unfinished' ? 'Other unfinished projects' : 'Other projects'}>
        {siblingIds.filter((id) => id !== node.id).map((id) => {
          const item = portfolioV2NodeMap.get(id);
          return item ? <button key={id} type="button" onClick={() => onSelect(id)}>{item.title}</button> : null;
        })}
      </div>
    </motion.main>
  );
}

function Workshop({ onBack, onSelect, reducedMotion }) {
  const projects = unfinishedProjectIds.map((id) => portfolioV2NodeMap.get(id)).filter(Boolean);
  return (
    <motion.main className="pv2-workshop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button className="pv2-back" type="button" onClick={onBack}>← All work</button>
      <div className="pv2-workshop__intro">
        <p className="pv2-overline">Workshop</p>
        <h1>Unfinished things.</h1>
        <p>Prototypes, slices, and ideas that are still being worked through.</p>
      </div>
      <div className="pv2-workshop__grid">
        {projects.map((node, index) => (
          <motion.button
            key={node.id}
            type="button"
            className="pv2-workshop-card"
            onClick={() => onSelect(node.id)}
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={reducedMotion ? undefined : { y: -5 }}
            whileTap={reducedMotion ? undefined : { scale: 0.99 }}
            transition={reducedMotion ? { duration: 0 } : { ...softSpring, delay: index * 0.05 }}
          >
            <ProjectVisual node={node} />
            <strong>{node.title}</strong>
            <span>{node.summary}</span>
          </motion.button>
        ))}
      </div>
    </motion.main>
  );
}

function UXGateway({ onBack }) {
  const node = portfolioV2NodeMap.get('ux-work');
  return (
    <main className="pv2-ux-gateway">
      <button className="pv2-back" type="button" onClick={onBack}>← All work</button>
      <div>
        <p className="pv2-overline">Professional portfolio</p>
        <h1>UX Work</h1>
        <p>{node?.summary}</p>
        <a href={node?.route || '/'}>Enter classic UX portfolio →</a>
      </div>
    </main>
  );
}

export default function RelationalPortfolio() {
  const reducedMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    setSelectedId(readProjectFromUrl());
    const onPopState = () => setSelectedId(readProjectFromUrl());
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && readProjectFromUrl()) window.history.back();
    };
    window.addEventListener('popstate', onPopState);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const selected = useMemo(() => selectedId ? portfolioV2NodeMap.get(selectedId) : null, [selectedId]);

  const select = (id) => {
    setSelectedId(id);
    writeProjectToUrl(id);
  };

  const back = () => {
    if (selected?.status === 'unfinished' && selected.id !== 'unfinished') {
      setSelectedId('unfinished');
      writeProjectToUrl('unfinished');
      return;
    }
    setSelectedId(null);
    writeProjectToUrl(null);
  };

  return (
    <div className="pv2-site">
      <header className="pv2-nav">
        <a href="/v2" className="pv2-nav__name">Jacob Meyerkopf</a>
        <nav aria-label="Portfolio navigation">
          <button type="button" onClick={() => { setSelectedId(null); writeProjectToUrl(null); }}>Work</button>
          <button type="button" onClick={() => select('unfinished')}>Playground</button>
          <a href="/">UX</a>
          <a href="mailto:jmeyerkopf@gmail.com">Contact</a>
        </nav>
      </header>

      <AnimatePresence mode="wait">
        {!selected && <Overview key="overview" onSelect={select} reducedMotion={reducedMotion} />}
        {selected?.kind === 'project' && <ProjectFocus key={selected.id} node={selected} onBack={back} onSelect={select} reducedMotion={reducedMotion} />}
        {selected?.id === 'unfinished' && <Workshop key="unfinished" onBack={back} onSelect={select} reducedMotion={reducedMotion} />}
        {selected?.id === 'ux-work' && <UXGateway key="ux" onBack={back} />}
      </AnimatePresence>
    </div>
  );
}
