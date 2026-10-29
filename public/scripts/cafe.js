(() => {
  'use strict';
  const dataNode = document.getElementById('cafe-project-data');
  if (!dataNode) return;
  const projects = JSON.parse(dataNode.textContent || '[]');
  const byId = new Map(projects.map(project => [project.id, project]));
  const categories = {
    selected: {title:'Selected Work', kicker:'A FEW FAVORITES',desc:'A starting point across interactive experiences, UX, and game design.'},
    games: {title:'Games & Experiences', kicker:'THINGS TO PLAY',desc:'Built experiences, game systems, and playful experiments.'},
    ux: {title:'UX Work', kicker:'RESEARCH & DESIGN',desc:'Client work, interfaces, systems, and design engineering.'},
    research: {title:'Research', kicker:'CURRENT QUESTIONS',desc:'Research questions, evidence, and ongoing investigation.'},
    unfinished: {title:'In Progress', kicker:'THE WORKSHOP',desc:'Prototypes and ideas still being developed. These are not finished releases.'}
  };
  const featured = new Set(['get-to-the-cafe','letter-river','last-reading','ux-earth-hero']);
  const get = id => document.getElementById(id);
  const world = get('cafe-world'), scene = get('cafe-scene');
  const overlay = get('cafe-overlay'), dialog = get('cafe-dialog');
  const book = get('cafe-book'), preview = get('cafe-preview'), focus = get('cafe-focus'), lens = get('cafe-lens');
  const objects = get('cafe-objects');
  const header = document.querySelector('.cafe-header');
  const hint = get('cafe-hint');
  const lookToggle = get('cafe-look-toggle');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let depth = 0;
  let lastSceneFocus = null;
  let lookMode = false;
  let dragging = false;
  let originX = 0, originY = 0, baseX = 0, baseY = 0;
  let lookX = 0, lookY = 0;

  function stateFromUrl() {
    const q = new URLSearchParams(location.search);
    const raw = q.get('view') || 'scene';
    return {
      view: ['scene','menu','preview','focus','lens'].includes(raw) ? raw : 'scene',
      category: categories[q.get('category')] ? q.get('category') : 'selected',
      project: byId.has(q.get('project')) ? q.get('project') : 'get-to-the-cafe'
    };
  }
  function buildUrl(state) {
    const url = new URL(location.href);
    url.search = '';
    if (state.view !== 'scene') url.searchParams.set('view',state.view);
    if (state.view === 'menu' || state.view === 'preview' || state.view === 'focus')
      url.searchParams.set('category',state.category || 'selected');
    if (state.view === 'preview' || state.view === 'focus')
      url.searchParams.set('project',state.project || 'get-to-the-cafe');
    return url;
  }
  function navigate(state, replace = false) {
    history[replace ? 'replaceState':'pushState']({cafe:true},'',buildUrl(state));
    if (!replace) depth += 1;
    render();
  }
  function openMenu(category = 'selected') {
    if (stateFromUrl().view === 'scene') lastSceneFocus = document.activeElement;
    navigate({view:'menu',category});
  }
  function previous() {
    const state = stateFromUrl();
    if (state.view === 'scene') return;
    if (depth > 0) {
      history.back();
      return;
    }
    if (state.view === 'focus') navigate({view:'preview',category:state.category,project:state.project},true);
    else if (state.view === 'preview') navigate({view:'menu',category:state.category},true);
    else navigate({view:'scene'},true);
  }

  function element(tag,className,text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }
  function media(project,className) {
    if (!project.media) return element('div',className + ' cafe-card-fallback','✦');
    const img = element('img',className);
    img.src = project.media;
    img.alt = project.mediaAlt || project.title;
    img.loading = 'lazy';
    img.addEventListener('error',() => img.replaceWith(element('div',className + ' cafe-card-fallback','✦')),{once:true});
    return img;
  }
  function action(label,href,primary = false) {
    const el = element('a','cafe-action' + (primary ? ' cafe-action--primary':''),label);
    el.href = href;
    if (/^https?:\/\//.test(href)) {
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
    }
    return el;
  }
  function renderBook(category) {
    const cfg = categories[category];
    get('cafe-category-kicker').textContent = cfg.kicker;
    get('cafe-category-title').textContent = cfg.title;
    get('cafe-category-desc').textContent = cfg.desc;
    document.querySelectorAll('#cafe-categories [data-category]').forEach(btn => {
      if (btn.dataset.category === category) btn.setAttribute('aria-current','true');
      else btn.removeAttribute('aria-current');
    });
    const list = get('cafe-projects');
    list.replaceChildren();
    const matches = projects.filter(p => {
      if (category === 'selected') return featured.has(p.id);
      if (category === 'ux') return p.group === 'ux' || p.id === 'letter-river';
      return p.group === category;
    });
    for (const project of matches) {
      const btn = element('button','cafe-project-card');
      btn.type = 'button';
      btn.dataset.project = project.id;
      btn.setAttribute('aria-label','Preview ' + project.title);
      btn.append(media(project,'cafe-card-media'));
      const copy = element('span','cafe-card-copy');
      copy.append(
        element('strong','',project.title),
        element('small','',project.kind || (project.status === 'unfinished' ? 'In progress' : 'Project')),
        element('span','',project.summary)
      );
      btn.append(copy,element('span','cafe-card-arrow','→'));
      btn.addEventListener('click',() => navigate({view:'preview',category,project:project.id}));
      list.append(btn);
    }
  }
  function renderPreview(project,category) {
    get('cafe-preview-kind').textContent = project.kind || project.status;
    get('cafe-preview-title').textContent = project.title;
    get('cafe-preview-summary').textContent = project.summary;
    get('cafe-preview-media').replaceChildren(media(project,'cafe-preview-image'));
    const actions = get('cafe-preview-actions');
    actions.replaceChildren();
    const read = element('button','cafe-action cafe-action--primary','Read overview');
    read.type = 'button';
    read.addEventListener('click',()=> navigate({view:'focus',category,project:project.id}));
    actions.append(read);
    if (project.play) actions.append(action('Play / open project ↗',project.play));
    if (project.read) actions.append(action(project.group === 'research' ? 'Full research page ↗' : 'Full case study ↗',project.read));
  }
  function renderFocus(project) {
    get('cafe-focus-kind').textContent = project.kind || project.status;
    get('cafe-focus-title').textContent = project.title;
    get('cafe-focus-summary').textContent = project.summary;
    const actions = get('cafe-focus-actions');
    actions.replaceChildren();
    if (project.play) actions.append(action('Play / open project ↗',project.play,true));
    if (project.read) actions.append(action(project.group === 'research'?'Open research page ↗':'Read full case study ↗',project.read,!project.play));
    const body = get('cafe-focus-body');
    body.replaceChildren();
    if (project.media) body.append(media(project,'cafe-focus-hero'));
    if (project.purpose) {
      body.append(element('h3','','Why it exists'),element('p','',project.purpose));
    }
    for (const section of project.sections || []) {
      if (!section.text || section.text === project.purpose) continue;
      body.append(element('h3','',section.title),element('p','',section.text));
    }
    if (project.highlights?.length) {
      body.append(element('h3','','Highlights'));
      const ul = element('ul');
      for (const item of project.highlights) ul.append(element('li','',item));
      body.append(ul);
    }
    if (project.status === 'unfinished') {
      body.append(element('h3','','Status'),element('p','','This is an unfinished prototype or design exploration, not a completed public release.'));
    }
    if (project.group === 'research') body.append(element('p','','The research page records questions and evidence status separately. No study findings are claimed here.'));
    if (!project.purpose && !project.sections?.length && !project.highlights?.length) {
      body.append(element('h3','','About this project'),element('p','',project.summary));
    }
  }
  function render() {
    const s = stateFromUrl();
    const visible = s.view !== 'scene';
    overlay.hidden = !visible;
    header.inert = visible;
    objects.inert = visible;
    hint.hidden = visible;
    lookToggle.inert = visible;
    book.hidden = s.view !== 'menu';
    preview.hidden = s.view !== 'preview';
    focus.hidden = s.view !== 'focus';
    lens.hidden = s.view !== 'lens';
    dialog.classList.toggle('is-focus',s.view === 'focus');
    world.classList.toggle('is-lensed',s.view === 'lens');
    if (visible) {
      if (s.view === 'menu') {
        get('cafe-crumb').textContent = 'The Menu / ' + categories[s.category].title;
        renderBook(s.category);
      } else if (s.view === 'lens') {
        get('cafe-crumb').textContent = 'Sunglasses / Another perspective';
      } else {
        const project = byId.get(s.project);
        get('cafe-crumb').textContent = (s.view === 'focus' ? 'Reading / ' : 'Preview / ') + project.title;
        if (s.view === 'preview') renderPreview(project,s.category);
        else renderFocus(project);
      }
      dialog.focus({preventScroll:true});
    } else if (lastSceneFocus?.isConnected) lastSceneFocus.focus({preventScroll:true});
  }

  document.querySelectorAll('[data-menu-open]').forEach(btn => btn.addEventListener('click',()=>openMenu()));
  document.querySelectorAll('[data-category-open]').forEach(btn => btn.addEventListener('click',()=>openMenu(btn.dataset.categoryOpen)));
  get('cafe-categories').addEventListener('click',event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    navigate({view:'menu',category:button.dataset.category},true);
  });
  get('cafe-back').addEventListener('click',previous);
  overlay.querySelector('[data-dismiss]').addEventListener('click',previous);
  document.addEventListener('keydown',event => {
    if (event.key === 'Escape' && stateFromUrl().view !== 'scene') { event.preventDefault(); previous(); }
    if (event.key === 'Tab' && !overlay.hidden) {
      const focusables = [...dialog.querySelectorAll('a[href], button:not([disabled])')].filter(el => el.getClientRects().length && !el.closest('[hidden]'));
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length-1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {event.preventDefault();last.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
    }
  });
  window.addEventListener('popstate',() => {depth = Math.max(0,depth-1);render();});

  const coffee = document.querySelector('[data-object="coffee"]');
  coffee.addEventListener('click',() => {
    const transition = get('cafe-transition');
    transition.classList.add('is-active');
    window.setTimeout(() => window.location.assign('/'), reduced.matches ? 10 : 550);
  });
  document.querySelector('[data-object="menu"]').addEventListener('click',()=>openMenu());
  document.querySelector('[data-object="glasses"]').addEventListener('click',() => {
    lastSceneFocus = document.activeElement;
    navigate({view:'lens'});
  });

  function applyLook(x,y) {
    lookX = Math.max(-1,Math.min(1,x));
    lookY = Math.max(-1,Math.min(1,y));
    world.style.setProperty('--look-x',String(lookX));
    world.style.setProperty('--look-y',String(lookY));
    world.style.setProperty('--camera-x',(-lookX * 10) + 'px');
    world.style.setProperty('--camera-y',(-lookY * 5) + 'px');
    world.style.setProperty('--foreground-x',(-lookX * 4) + 'px');
    world.style.setProperty('--foreground-y',(-lookY * 3) + 'px');
  }
  lookToggle.addEventListener('click',() => {
    lookMode = !lookMode;
    lookToggle.setAttribute('aria-pressed',String(lookMode));
    lookToggle.textContent = lookMode ? 'Stop looking' : 'Look around';
    if (!lookMode) applyLook(0,0);
  });
  world.addEventListener('pointerdown',event => {
    if (event.target.closest('button,a,#cafe-overlay') || event.pointerType === 'touch' || !overlay.hidden) return;
    dragging = true; originX = event.clientX;originY = event.clientY;baseX = lookX;baseY = lookY;
  });
  window.addEventListener('pointerup',()=>{dragging = false;});
  window.addEventListener('pointermove',event => {
    if (reduced.matches || !overlay.hidden || event.pointerType === 'touch') return;
    if (dragging || lookMode) {
      const dx = dragging ? event.clientX-originX : event.clientX-innerWidth/2;
      const dy = dragging ? event.clientY-originY : event.clientY-innerHeight/2;
      applyLook((dragging?baseX:0)+dx/(dragging?300:innerWidth/2),(dragging?baseY:0)+dy/(dragging?300:innerHeight/2));
    } else applyLook((event.clientX/innerWidth-.5)*.5,(event.clientY/innerHeight-.5)*.35);
  });
  render();
})();
