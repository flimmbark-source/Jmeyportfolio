import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { portfolioV2NodeMap } from '../data/portfolioV2';
import '../styles/portfolio-v2.css';

const spring = { type: 'spring', stiffness: 220, damping: 28, mass: 0.9 };
const softSpring = { type: 'spring', stiffness: 180, damping: 24, mass: 0.85 };
const publicProjectIds = ['get-to-the-cafe', 'letter-river', 'last-reading', 'rotogo', 'gig-duel'];
const unfinishedProjectIds = ['phase-g', 'splitpulse', 'wash-dishes'];

const hoverMotion = {
  top: { y: -9, rotate: -0.35, scale: 1.018 },
  left: { x: 4, y: -7, rotate: -0.8, scale: 1.018 },
  right: { x: -4, y: -7, rotate: 0.8, scale: 1.018 },
  'bottom-left': { x: 3, y: -8, rotate: 0.45, scale: 1.018 },
  'bottom-right': { x: -3, y: -8, rotate: -0.45, scale: 1.018 },
};

const overviewAnchors = {
  'get-to-the-cafe': [0.50, 0.10],
  'letter-river': [0.12, 0.43],
  'last-reading': [0.87, 0.42],
  rotogo: [0.31, 0.82],
  'gig-duel': [0.69, 0.82],
  'ux-work': [0.08, 0.18],
  unfinished: [0.90, 0.78],
};

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

function rectsOverlap(a, b, gap = 0) {
  return !(
    a.right + gap <= b.left ||
    a.left >= b.right + gap ||
    a.bottom + gap <= b.top ||
    a.top >= b.bottom + gap
  );
}

function solveOverviewLayout(stage, statement, elements) {
  const stageRect = stage.getBoundingClientRect();
  const statementRect = statement.getBoundingClientRect();
  const edge = 18;
  const itemGap = 22;
  const statementGap = 34;

  const centerBlock = {
    left: statementRect.left - stageRect.left,
    top: statementRect.top - stageRect.top,
    right: statementRect.right - stageRect.left,
    bottom: statementRect.bottom - stageRect.top,
  };
  const centerX = (centerBlock.left + centerBlock.right) / 2;
  const centerY = (centerBlock.top + centerBlock.bottom) / 2;

  const items = Object.entries(elements)
    .filter(([, el]) => el)
    .map(([id, el]) => {
      const rect = el.getBoundingClientRect();
      const anchor = overviewAnchors[id] || [0.5, 0.5];
      return {
        id,
        w: rect.width,
        h: rect.height,
        x: stageRect.width * anchor[0] - rect.width / 2,
        y: stageRect.height * anchor[1] - rect.height / 2,
      };
    });

  const clampItem = (item) => {
    item.x = Math.max(edge, Math.min(stageRect.width - item.w - edge, item.x));
    item.y = Math.max(edge, Math.min(stageRect.height - item.h - edge, item.y));
  };

  const itemRect = (item) => ({
    left: item.x,
    top: item.y,
    right: item.x + item.w,
    bottom: item.y + item.h,
  });

  items.forEach(clampItem);

  for (let pass = 0; pass < 44; pass += 1) {
    items.forEach((item) => {
      const rect = itemRect(item);
      if (rectsOverlap(rect, centerBlock, statementGap)) {
        const itemX = item.x + item.w / 2;
        const itemY = item.y + item.h / 2;
        let dx = itemX - centerX;
        let dy = itemY - centerY;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) dx = 1;
        const length = Math.hypot(dx, dy) || 1;
        const force = 10;
        item.x += (dx / length) * force;
        item.y += (dy / length) * force;
        clampItem(item);
      }
    });

    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        const a = items[i];
        const b = items[j];
        const ar = itemRect(a);
        const br = itemRect(b);
        if (!rectsOverlap(ar, br, itemGap)) continue;

        let dx = (a.x + a.w / 2) - (b.x + b.w / 2);
        let dy = (a.y + a.h / 2) - (b.y + b.h / 2);
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) dx = i % 2 ? 1 : -1;
        const length = Math.hypot(dx, dy) || 1;
        const force = 7;
        a.x += (dx / length) * force;
        a.y += (dy / length) * force;
        b.x -= (dx / length) * force;
        b.y -= (dy / length) * force;
        clampItem(a);
        clampItem(b);
      }
    }
  }

  return Object.fromEntries(items.map((item) => [item.id, { left: item.x, top: item.y }]));
}

function ProjectVisual({ node, large = false }) {
  const [previewAvailable, setPreviewAvailable] = useState(Boolean(node.previewSrc));

  useEffect(() => {
    setPreviewAvailable(Boolean(node.previewSrc));
  }, [node.id, node.previewSrc]);

  return (
    <div className={`pv2-visual pv2-visual--${node.id}${large ? ' is-large' : ''}`} aria-hidden="true">
      {node.previewSrc && previewAvailable && (
        <img
          className="pv2-visual__media"
          src={node.previewSrc}
          alt=""
          loading={large ? 'eager' : 'lazy'}
          onError={() => setPreviewAvailable(false)}
        />
      )}
      <div className={`pv2-visual__frame${node.previewSrc && previewAvailable ? ' has-media' : ''}`}>
        <span className="pv2-visual__mark">{node.title}</span>
        <span className="pv2-visual__status">{node.status === 'unfinished' ? 'in progress' : 'interactive work'}</span>
      </div>
    </div>
  );
}

function ProjectTile({ node, placement, index, onSelect, reducedMotion, register, position }) {
  return (
    <div ref={(el) => register(node.id, el)} className="pv2-float-slot" style={position || undefined}>
      <motion.button
        layoutId={`project-${node.id}`}
        type="button"
        className={`pv2-project-tile pv2-project-tile--${placement}`}
        onClick={() => onSelect(node.id)}
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={reducedMotion ? undefined : hoverMotion[placement]}
        whileFocus={reducedMotion ? undefined : { y: -4, scale: 1.01 }}
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
    </div>
  );
}

function GatewayLink({ id, className, eyebrow, title, onClick, reducedMotion, delay = 0, register, position }) {
  return (
    <div ref={(el) => register(id, el)} className="pv2-float-slot pv2-float-slot--gateway" style={position || undefined}>
      <motion.button
        className={`pv2-gateway-link ${className}`}
        type="button"
        onClick={onClick}
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={reducedMotion ? undefined : { x: className.includes('unfinished') ? -4 : 4, y: -2 }}
        whileTap={reducedMotion ? undefined : { scale: 0.985 }}
        transition={reducedMotion ? { duration: 0 } : { ...softSpring, delay }}
      >
        <span>{eyebrow}</span>
        <strong>{title}</strong>
      </motion.button>
    </div>
  );
}

function Overview({ onSelect, reducedMotion }) {
  const projects = publicProjectIds.map((id) => portfolioV2NodeMap.get(id)).filter(Boolean);
  const placements = ['top', 'left', 'right', 'bottom-left', 'bottom-right'];
  const stageRef = useRef(null);
  const statementRef = useRef(null);
  const itemRefs = useRef({});
  const [positions, setPositions] = useState({});

  const register = useCallback((id, element) => {
    if (element) itemRefs.current[id] = element;
    else delete itemRefs.current[id];
  }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const statement = statementRef.current;
    if (!stage || !statement) return undefined;

    let frame = 0;
    const recalculate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (window.innerWidth <= 720) {
          setPositions({});
          return;
        }
        setPositions(solveOverviewLayout(stage, statement, itemRefs.current));
      });
    };

    recalculate();
    const observer = new ResizeObserver(recalculate);
    observer.observe(stage);
    observer.observe(statement);
    Object.values(itemRefs.current).forEach((element) => observer.observe(element));
    window.addEventListener('resize', recalculate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', recalculate);
    };
  }, []);

  return (
    <motion.main
      className="pv2-overview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.22 }}
    >
      <section ref={stageRef} className="pv2-overview__stage" aria-label="Selected work">
        <motion.div
          ref={statementRef}
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
            register={register}
            position={positions[node.id]}
          />
        ))}

        <GatewayLink
          id="ux-work"
          className="pv2-gateway-link--ux"
          eyebrow="Professional work"
          title="UX Work ↗"
          onClick={() => onSelect('ux-work')}
          reducedMotion={reducedMotion}
          delay={0.15}
          register={register}
          position={positions['ux-work']}
        />

        <GatewayLink
          id="unfinished"
          className="pv2-gateway-link--unfinished"
          eyebrow="Workshop"
          title="Unfinished →"
          onClick={() => onSelect('unfinished')}
          reducedMotion={reducedMotion}
          delay={0.2}
          register={register}
          position={positions.unfinished}
        />
      </section>
    </motion.main>
  );
}

function ProjectFocus({ node, onBack, onSelect, reducedMotion }) {
  const siblingIds = node.status === 'unfinished' ? unfinishedProjectIds : publicProjectIds;
  const primaryPlayUrl = node.localPlayUrl || node.playUrl;
  const primaryPlayExternal = !node.localPlayUrl && Boolean(node.playUrl);

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
              <strong>{node.previewSrc ? 'Gameplay preview' : node.status === 'unfinished' ? 'Prototype preview asset can live here' : 'Gameplay preview asset can live here'}</strong>
            </div>
            <div className="pv2-focus__actions">
              {primaryPlayUrl && (
                <a href={primaryPlayUrl} target={primaryPlayExternal ? '_blank' : undefined} rel={primaryPlayExternal ? 'noreferrer' : undefined}>
                  {node.localPlayUrl ? 'Play here →' : 'Play in browser ↗'}
                </a>
              )}
              {node.localPlayUrl && node.playUrl && (
                <a className="pv2-secondary-action" href={node.playUrl} target="_blank" rel="noreferrer">Open itch.io ↗</a>
              )}
              {!primaryPlayUrl && node.route && <a href={node.route}>Open project →</a>}
              {!primaryPlayUrl && !node.route && <span className="pv2-focus__pending">Playable build not connected yet</span>}
            </div>
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
            whileHover={reducedMotion ? undefined : { y: -5, rotate: index % 2 ? 0.3 : -0.3 }}
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
