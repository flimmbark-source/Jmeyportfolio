import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { portfolioV2NodeMap } from '../data/portfolioV2';
import { pickWorkBackground } from '../data/workBackgrounds';
import '../styles/portfolio-v2.css';

const MOTION = {
  ease: [0.22, 1, 0.36, 1],
  majorEase: [0.16, 1, 0.3, 1],
  fast: { duration: 0.14, ease: [0.22, 1, 0.36, 1] },
  interface: { duration: 0.36, ease: [0.22, 1, 0.36, 1] },
  major: { duration: 0.72, ease: [0.16, 1, 0.3, 1] },
};
const publicProjectIds = ['get-to-the-cafe', 'letter-river', 'last-reading', 'rotogo', 'gig-duel'];
const unfinishedProjectIds = ['phase-g', 'splitpulse'];
const allGameIds = [...publicProjectIds, ...unfinishedProjectIds];
const SPHERE_DISPLACEMENT_MAP = 'data:image/png;base64,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';

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

function overviewAnchorStyle(id) {
  const [x, y] = overviewAnchors[id] || [0.5, 0.5];
  return {
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    transform: 'translate(-50%, -50%)',
  };
}

function readProjectFromUrl() {
  if (typeof window === 'undefined') return null;
  const value = new URL(window.location.href).searchParams.get('project');
  const node = value ? portfolioV2NodeMap.get(value) : null;
  if (value === 'wash-dishes') return null;
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

function SphereFilterDefs() {
  return (
    <svg className="pv2-filter-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <filter id="pv2-sphere-distortion" x="-35%" y="-35%" width="170%" height="170%" colorInterpolationFilters="sRGB">
          <feImage
            href={SPHERE_DISPLACEMENT_MAP}
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            result="sphereMap"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="sphereMap"
            scale="20"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

function ProjectVisual({ node, large = false }) {
  const [previewAvailable, setPreviewAvailable] = useState(Boolean(node.previewSrc));

  useEffect(() => {
    setPreviewAvailable(Boolean(node.previewSrc));
  }, [node.id, node.previewSrc]);

  return (
    <div className={`pv2-visual pv2-visual--${node.id}${large ? ' is-large' : ''}`} aria-hidden="true">
      <div className="pv2-visual__surface">
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
    </div>
  );
}

function ProjectTile({ node, placement, index, onSelect, reducedMotion, register, position }) {
  return (
    <div
      ref={(el) => register(node.id, el)}
      className="pv2-float-slot"
      data-node-id={node.id}
      data-placement={placement}
      style={position || overviewAnchorStyle(node.id)}
    >
      <motion.button
        layoutId={`project-${node.id}`}
        type="button"
        className={`pv2-project-tile pv2-project-tile--${placement}`}
        onClick={() => onSelect(node.id)}
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reducedMotion ? undefined : { opacity: 0, scale: 0.92, y: 5 }}
        whileHover={reducedMotion ? undefined : hoverMotion[placement]}
        whileFocus={reducedMotion ? undefined : { y: -4, scale: 1.01 }}
        whileTap={reducedMotion ? undefined : { scale: 0.985 }}
        transition={reducedMotion ? { duration: 0 } : { ...MOTION.interface, delay: 0.04 + index * 0.045 }}
        aria-label={`Open ${node.title}`}
      >
        <ProjectVisual node={node} />
        <span className="pv2-project-tile__caption">
          <strong>{node.title}</strong>
          <span>{node.kicker?.replace('Playable · ', '').replace('Game · ', '') || 'Project'}</span>
        </span>
      </motion.button>
      <span className="pv2-project-hover-meta" aria-hidden="true">
        <strong>{node.title}</strong>
        {node.made && <span>Made {node.made}</span>}
      </span>
    </div>
  );
}

function GatewayLink({ id, className, eyebrow, title, onClick, reducedMotion, delay = 0, register, position }) {
  return (
    <div ref={(el) => register(id, el)} className="pv2-float-slot pv2-float-slot--gateway" style={position || overviewAnchorStyle(id)}>
      <motion.button
        className={`pv2-gateway-link ${className}`}
        type="button"
        onClick={onClick}
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reducedMotion ? undefined : { opacity: 0, scale: 0.96, y: 5 }}
        whileHover={reducedMotion ? undefined : { x: className.includes('unfinished') ? -4 : 4, y: -2 }}
        whileTap={reducedMotion ? undefined : { scale: 0.985 }}
        transition={reducedMotion ? { duration: 0 } : { ...MOTION.interface, delay }}
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
  const [contextProjectId, setContextProjectId] = useState(null);
  const contextNode = contextProjectId ? portfolioV2NodeMap.get(contextProjectId) : null;

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
        // Solve at all widths: the physics script (portfolio-physics-v3.js) now
        // runs the floating game on mobile too, and relies on these absolute
        // positions for the gateway bumpers. The static grid fallback ignores
        // them via the html:not(.pv2-physics-live) CSS scope.
        setPositions(solveOverviewLayout(stage, statement, itemRefs.current));
      });
    };

    // Establish the authored positions synchronously before the browser paints.
    // Subsequent resize work can stay frame-batched.
    setPositions(solveOverviewLayout(stage, statement, itemRefs.current));

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
      exit={reducedMotion ? undefined : { opacity: 1 }}
      transition={reducedMotion ? { duration: 0 } : MOTION.interface}
    >
      <section ref={stageRef} className="pv2-overview__stage" aria-label="Selected work">
        <motion.div
          ref={statementRef}
          className="pv2-overview__statement"
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, scale: 0.97, y: 7 }}
          transition={reducedMotion ? { duration: 0 } : MOTION.interface}
        >
          <p className="pv2-overline"></p>
          <h1>Interactive Designer <br /> & Creative Thinker</h1>
          <p>I create games, interactive art, thought experiments, and UX work, in order to explore how interaction fosters growth, connection, and positive change.</p>
        </motion.div>

        {projects.map((node, index) => (
          <ProjectTile
            key={node.id}
            node={node}
            placement={placements[index]}
            index={index}
            onSelect={setContextProjectId}
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
          title="All Games →"
          onClick={() => onSelect('unfinished')}
          reducedMotion={reducedMotion}
          delay={0.2}
          register={register}
          position={positions.unfinished}
        />
      </section>

      <AnimatePresence>
        {contextNode && (
          <ProjectContextPanel
            key={contextNode.id}
            node={contextNode}
            anchorEl={itemRefs.current[contextNode.id]}
            onClose={() => setContextProjectId(null)}
            reducedMotion={reducedMotion}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}

function ProjectContextPanel({ node, anchorEl, onClose, reducedMotion }) {
  const panelRef = useRef(null);
  const [position, setPosition] = useState(null);
  const primaryUrl = node.localPlayUrl || node.playUrl || node.route;
  const primaryExternal = Boolean(primaryUrl && /^https?:/i.test(primaryUrl) && !node.localPlayUrl);

  useLayoutEffect(() => {
    if (!anchorEl) return undefined;
    const root = document.documentElement;
    root.classList.add('pv2-project-context-open');
    anchorEl.classList.add('is-project-context-open');
    window.dispatchEvent(new CustomEvent('pv2:project-context-pause'));

    return () => {
      root.classList.remove('pv2-project-context-open');
      anchorEl.classList.remove('is-project-context-open');
      window.dispatchEvent(new CustomEvent('pv2:project-context-resume'));
    };
  }, [anchorEl, node.id]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !anchorEl) return undefined;
    let frame = 0;

    const place = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!panel.isConnected || !anchorEl.isConnected) return;
        const sphere = anchorEl.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const navBottom = document.querySelector('.pv2-nav')?.getBoundingClientRect().bottom || 72;
        const mobile = window.innerWidth <= 720;
        const pad = mobile ? 24 : Math.max(48, Math.min(72, window.innerWidth * .045));
        const gap = mobile ? 16 : 26;
        const minTop = navBottom + 14;
        const maxTop = Math.max(minTop, window.innerHeight - pad - panelRect.height);

        if (mobile) {
          const availableWidth = window.innerWidth - pad * 2;
          const left = pad + Math.max(0, (availableWidth - panelRect.width) / 2);
          const sphereCenterY = sphere.top + sphere.height / 2;
          const side = sphereCenterY < window.innerHeight / 2 ? 'mobile-bottom' : 'mobile-top';
          const top = side === 'mobile-bottom'
            ? Math.max(minTop, window.innerHeight - pad - panelRect.height)
            : minTop;
          setPosition({ left, top, side });
          return;
        }

        let side = 'right';
        let left = sphere.right + gap;
        let top = Math.max(minTop, Math.min(maxTop, sphere.top + sphere.height / 2 - panelRect.height / 2));

        if (left + panelRect.width > window.innerWidth - pad) {
          side = 'left';
          left = sphere.left - gap - panelRect.width;
        }
        if (left < pad) {
          side = 'below';
          left = Math.max(pad, Math.min(window.innerWidth - pad - panelRect.width, sphere.left + sphere.width / 2 - panelRect.width / 2));
          top = sphere.bottom + gap;
          if (top + panelRect.height > window.innerHeight - pad) {
            side = 'above';
            top = sphere.top - gap - panelRect.height;
          }
          top = Math.max(minTop, Math.min(maxTop, top));
        }

        setPosition({ left, top, side });
      });
    };

    place();
    const observer = new ResizeObserver(place);
    observer.observe(panel);
    observer.observe(anchorEl);
    window.addEventListener('resize', place);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', place);
    };
  }, [anchorEl, node.id]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <motion.div
      className="pv2-project-context-overlay"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      transition={reducedMotion ? { duration: 0 } : MOTION.fast}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.section
        ref={panelRef}
        className="pv2-project-context-panel"
        data-side={position?.side || 'right'}
        style={position ? { left: position.left, top: position.top } : { left: 0, top: 0, visibility: 'hidden' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={'context-title-' + node.id}
        initial={reducedMotion ? false : { opacity: 0, scale: .975, x: position?.side === 'left' ? 10 : -10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={reducedMotion ? undefined : { opacity: 0, scale: .985, x: position?.side === 'left' ? 8 : -8 }}
        transition={reducedMotion ? { duration: 0 } : MOTION.interface}
      >
        <div className="pv2-project-context-panel__header">
          <p className="pv2-overline">{node.kicker || 'Project'}</p>
          <button type="button" className="pv2-project-context-panel__close" onClick={onClose} aria-label={'Close ' + node.title}>×</button>
        </div>
        <h2 id={'context-title-' + node.id}>{node.title}</h2>
        <p className="pv2-project-context-panel__summary">{node.summary}</p>
        {node.purpose && <p className="pv2-project-context-panel__purpose">{node.purpose}</p>}
        <div className="pv2-project-context-panel__actions">
          {primaryUrl ? (
            <a href={primaryUrl} target={primaryExternal ? '_blank' : undefined} rel={primaryExternal ? 'noreferrer' : undefined}>
              {node.localPlayUrl ? 'Play here →' : node.playUrl ? 'Play in browser ↗' : 'Open project ↗'}
            </a>
          ) : (
            <span>Playable build not connected yet</span>
          )}
          {node.localPlayUrl && node.playUrl && (
            <a className="pv2-project-context-panel__secondary" href={node.playUrl} target="_blank" rel="noreferrer">itch.io ↗</a>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}

function ProjectFocus({ node, onBack, onSelect, reducedMotion }) {
  const siblingIds = node.status === 'unfinished' ? allGameIds : publicProjectIds;
  const primaryPlayUrl = node.localPlayUrl || node.playUrl;
  const primaryPlayExternal = !node.localPlayUrl && Boolean(node.playUrl);

  return (
    <motion.main
      className="pv2-focus"
      initial={false}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 1 }}
      transition={reducedMotion ? { duration: 0 } : MOTION.interface}
    >
      <motion.button
        className="pv2-back"
        type="button"
        onClick={onBack}
        exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
        transition={reducedMotion ? { duration: 0 } : MOTION.fast}
      >
        ← {node.status === 'unfinished' ? 'All Games' : 'All work'}
      </motion.button>

      <section className="pv2-focus__layout">
        <motion.div
          className="pv2-focus__intro"
          initial={reducedMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: 8, transition: MOTION.fast }}
          transition={reducedMotion ? { duration: 0 } : { ...MOTION.interface, delay: 0.38 }}
        >
          <p className="pv2-overline">{node.kicker || 'Project'}</p>
          <motion.h1 layoutId={`title-${node.id}`}>{node.title}</motion.h1>
          <p className="pv2-focus__summary">{node.summary}</p>
          {node.purpose && <p className="pv2-focus__purpose">{node.purpose}</p>}
        </motion.div>

        <motion.div
          className="pv2-focus__artifact"
          layoutId={`project-${node.id}`}
          exit={reducedMotion ? undefined : { opacity: 0.7, scale: 0.99 }}
          transition={reducedMotion ? { duration: 0 } : MOTION.major}
        >
          <ProjectVisual node={node} large />
          <motion.div
            className="pv2-focus__artifact-footer"
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: 4 }}
            transition={reducedMotion ? { duration: 0 } : { ...MOTION.interface, delay: 0.46 }}
          >
            <div>
              <span>Preview</span>
              <strong>{node.status === 'unfinished' ? 'Prototype' : node.previewSrc ? 'Gameplay preview' : 'Project preview'}</strong>
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
          </motion.div>
        </motion.div>
      </section>

      <motion.div
        className="pv2-focus__rail"
        aria-label={node.status === 'unfinished' ? 'Other games' : 'Other projects'}
        exit={reducedMotion ? undefined : { opacity: 0, y: 6 }}
        transition={reducedMotion ? { duration: 0 } : MOTION.fast}
      >
        {siblingIds.filter((id) => id !== node.id).map((id) => {
          const item = portfolioV2NodeMap.get(id);
          return item ? <button key={id} type="button" onClick={() => onSelect(id)}>{item.title}</button> : null;
        })}
      </motion.div>
    </motion.main>
  );
}

function Workshop({ onBack, onSelect, reducedMotion }) {
  const projects = allGameIds.map((id) => portfolioV2NodeMap.get(id)).filter(Boolean);
  return (
    <motion.main
      className="pv2-workshop"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      transition={reducedMotion ? { duration: 0 } : MOTION.fast}
    >
      <button className="pv2-back" type="button" onClick={onBack}>← All work</button>
      <div className="pv2-workshop__intro">
        <p className="pv2-overline">Workshop</p>
        <h1>All Games.</h1>
        <p>Finished games, experiments, prototypes, and things still being worked through.</p>
      </div>
      <div className="pv2-workshop__grid">
        {projects.map((node, index) => (
          <motion.button
            key={node.id}
            type="button"
            className="pv2-workshop-card"
            onClick={() => onSelect(node.id)}
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={reducedMotion ? undefined : { y: -5, rotate: index % 2 ? 0.3 : -0.3 }}
            whileTap={reducedMotion ? undefined : { scale: 0.99 }}
            transition={reducedMotion ? { duration: 0 } : { ...MOTION.interface, delay: index * 0.012 }}
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
        <a href="/ux">Enter classic UX portfolio →</a>
      </div>
    </main>
  );
}

function WorkBackdrop({ reducedMotion, content = false }) {
  const [background, setBackground] = useState(null);

  useEffect(() => {
    // The image is a local public asset. Let CSS load it directly rather than
    // gating the entire backdrop on a separate Image.onload event: a stalled
    // preload must never leave the portfolio with a permanently transparent
    // background.
    setBackground(pickWorkBackground());
  }, []);

  // The wrapper always renders, even before a backdrop is picked: returning
  // null here would leave AnimatePresence without a child to exit, and the
  // layer would stay mounted after the visitor opens a project.
  return (
    <motion.div
      className={`pv2-work-backdrop${content ? ' pv2-work-backdrop--content' : ''}`}
      aria-hidden="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: background ? 1 : 0, scale: 1, filter: 'blur(0px)' }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.015, filter: 'blur(7px)' }}
      transition={reducedMotion ? { duration: 0 } : MOTION.major}
    >
      {background && (
        <div
          className="pv2-work-backdrop__art"
          style={{ backgroundImage: `url("${background.src}")`, backgroundPosition: background.position }}
        />
      )}
      <div className="pv2-work-backdrop__scrim" />
    </motion.div>
  );
}

function WorkBackdropCredit({ reducedMotion }) {
  return (
    <motion.div
      className="pv2-credit-drawer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={reducedMotion ? { duration: 0 } : MOTION.interface}
    >
      <button
        className="pv2-credit-drawer__trigger"
        type="button"
        aria-label="Background image attribution"
      >
        ?
      </button>
      <span className="pv2-credit-drawer__reveal">
        <span className="pv2-credit-drawer__text">
          Images supplied by The Met Open Access Collection. All Images are Public Domain.
        </span>
      </span>
    </motion.div>
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
    <>
      <SphereFilterDefs />
      <div className="pv2-site">
      <header className="pv2-nav">
        <a href="/" className="pv2-nav__name">Jacob Meyerkopf</a>
        <nav aria-label="Portfolio navigation">
          <button type="button" onClick={() => { setSelectedId(null); writeProjectToUrl(null); }}>Playground</button>
          <button type="button" onClick={() => select('unfinished')}>Work</button>
          <a href="/research">Research</a>
          <a href="/ux">UX</a>
          <a href="/contact">Contact</a>
        </nav>
      </header>

      <AnimatePresence initial={false}>
        {(!selected || selected?.id === 'unfinished') && (
          <WorkBackdrop
            key={selected?.id === 'unfinished' ? 'playground-backdrop' : 'work-backdrop'}
            reducedMotion={reducedMotion}
            content={selected?.id === 'unfinished'}
          />
        )}
        {(!selected || selected?.id === 'unfinished') && (
          <WorkBackdropCredit
            key={selected?.id === 'unfinished' ? 'playground-credit' : 'work-credit'}
            reducedMotion={reducedMotion}
          />
        )}
      </AnimatePresence>

      <AnimatePresence initial={false} mode="sync">
        {!selected && <Overview key="overview" onSelect={select} reducedMotion={reducedMotion} />}
        {selected?.kind === 'project' && <ProjectFocus key={selected.id} node={selected} onBack={back} onSelect={select} reducedMotion={reducedMotion} />}
        {selected?.id === 'unfinished' && <Workshop key="unfinished" onBack={back} onSelect={select} reducedMotion={reducedMotion} />}
        {selected?.id === 'ux-work' && <UXGateway key="ux" onBack={back} />}
      </AnimatePresence>
      </div>
    </>
  );
}
