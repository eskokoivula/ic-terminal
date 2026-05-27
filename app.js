/* ============================================================
   IC_TERMINAL · v4
   - 2-phrase hero rotator (word-stagger blur + fade)
   - Per-scene reveal host (CSS-driven, --i staggers)
   - Autoplay nudge for ambient videos
   - Live --tempo lookup so Tweaks panel re-tunes motion w/o reload
   ============================================================ */

(() => {
  /* ──────────  NAV — sticky glass capsules + scroll behavior  ────────── */
  const nav = document.getElementById('nav');
  if (nav) {
    let ticking = false;
    const update = () => {
      // Just solidify the glass once the user scrolls past the hero fold.
      // The bar stays visible at all times (no hide-on-down).
      nav.classList.toggle('is-scrolled', window.scrollY > 24);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();

    // Menu dropdown
    const menuBtn = document.getElementById('nav-menu-btn');
    const panel   = document.getElementById('nav-panel');
    if (menuBtn && panel) {
      const close = () => {
        menuBtn.setAttribute('aria-expanded', 'false');
        panel.classList.remove('is-open');
        // Defer the hidden flip so the transition can run
        setTimeout(() => {
          if (menuBtn.getAttribute('aria-expanded') === 'false') panel.hidden = true;
        }, 260);
      };
      const open = () => {
        panel.hidden = false;
        // Force reflow so the transition fires from initial state
        void panel.offsetWidth;
        menuBtn.setAttribute('aria-expanded', 'true');
        panel.classList.add('is-open');
      };
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
        if (isOpen) close(); else open();
      });
      panel.addEventListener('click', (e) => { if (e.target.tagName === 'A') close(); });
      document.addEventListener('click', (e) => {
        if (!nav.contains(e.target)) close();
      });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    }
  }
})();

(() => {
  const slots = Array.from(document.querySelectorAll('.rotator__slot'));
  const indices = Array.from(document.querySelectorAll('.px'));
  const bar = document.getElementById('rotator-bar');
  const CYCLE_MS = 3000;
  const WORD_STAGGER = 95;

  // Read --tempo live so Tweaks can re-pace motion without reload.
  const tempo = () => {
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tempo'));
    return Number.isFinite(v) && v > 0 ? v : 1;
  };
  const cycle = () => Math.round(CYCLE_MS * tempo());

  if (slots.length) {
    // Wrap each word in a span for staggered reveal.
    slots.forEach(slot => {
      slot.querySelectorAll('.phrase__line').forEach(line => {
        const raw = line.textContent;
        line.textContent = '';
        raw.split(/(\s+)/).forEach(part => {
          if (/\S/.test(part)) {
            const span = document.createElement('span');
            span.className = 'word';
            span.textContent = part;
            line.appendChild(span);
          } else {
            line.appendChild(document.createTextNode(part));
          }
        });
      });
    });

    function activate(n) {
      slots.forEach((s, i) => {
        if (i !== n) {
          s.classList.remove('is-active');
          s.querySelectorAll('.word').forEach(w => { w.style.transitionDelay = ''; });
        }
      });
      const slot = slots[n];
      slot.querySelectorAll('.word').forEach((w, j) => {
        w.style.transitionDelay = `${j * WORD_STAGGER * tempo()}ms`;
      });
      void slot.offsetWidth;
      slot.classList.add('is-active');

      indices.forEach((px, i) => px.classList.toggle('is-active', i === n));

      if (bar) {
        bar.style.transition = 'none';
        bar.style.width = '0%';
        void bar.offsetWidth;
        bar.style.transition = `width ${cycle()}ms linear`;
        bar.style.width = '100%';
      }
    }

    let current = 0;
    activate(current);

    let timer = null;
    const tick = () => {
      current = (current + 1) % slots.length;
      activate(current);
      timer = setTimeout(tick, cycle());
    };
    const start = () => { if (!timer) timer = setTimeout(tick, cycle()); };
    const stop  = () => { if (timer)  { clearTimeout(timer); timer = null; } };

    start();

    // pause when hero is out of view
    const hero = document.querySelector('.hero');
    if (hero) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) start(); else stop();
      }, { threshold: 0.1 }).observe(hero);
    }

    // click an index to jump
    indices.forEach((px, i) => {
      px.addEventListener('click', () => {
        current = i;
        activate(current);
      });
    });

    // expose so Tweaks can restart on tempo change
    window.__icTerminalRotator = { restart: () => { stop(); start(); } };
  }

  /* ──────────  AMBIENT VIDEO AUTOPLAY  ────────── */
  document.querySelectorAll('video').forEach(v => {
    v.muted = true; v.playsInline = true;
    const tryPlay = () => v.play().catch(() => {});
    v.addEventListener('canplay', tryPlay, { once: true });
    document.addEventListener('pointerdown', tryPlay, { once: true });
  });

  /* ──────────  DEMO SIMULATOR — 9-phase framework run  ────────── */
  (() => {
    const sim = document.getElementById('demo-sim');
    const dt  = document.getElementById('demo-time');
    if (!sim) return;

    const PHASES = [
      {
        id: 'A.01', name: 'Market',
        desc: 'Sizes the addressable market from primary sources. Tests TAM claims. Maps adjacent demand pools.',
        tag: 'MAPPING · TAM', status: 'scanning · primary sources',
        kind: 'bars',
        feed: [
          ['IDC.2025.q3',      'parsed · 482 segments',        'ok'],
          ['gartner.synthesis','TAM bound · $14.2B – $19.6B',  'ok'],
          ['founder.deck',     'claim · $42B TAM',             'warn'],
          ['triangulate',      'gap · 2.3× vs primary',        'warn'],
          ['adjacent.pools',   'mapped · 6 demand corridors',  'ok'],
          ['confidence',       'TAM 0.71 · SAM 0.62',          'ok'],
        ],
      },
      {
        id: 'A.02', name: 'Competitors',
        desc: 'Builds the live competitor map. Tracks funding posture. Isolates defensible wedges and overlap risk.',
        tag: 'PLOTTING · OVERLAP', status: 'mapping · live competitor field',
        kind: 'scatter',
        feed: [
          ['crunchbase',     'pulled · 38 funded entrants',  'ok'],
          ['cluster.dense',  'commodity layer · 11 firms',   'warn'],
          ['wedge.detect',   'defensible · 2 of 38',         'ok'],
          ['posture',        'last_round · median 14 mo',    'ok'],
          ['talent.flow',    'inflow + 23 from META/G',      'ok'],
          ['overlap',        'feature-set 0.62',             'warn'],
        ],
      },
      {
        id: 'A.03', name: 'Technical',
        desc: 'Reviews architecture claims, dependency risk, and the gap between marketing language and shipping code.',
        tag: 'PARSING · ARCHITECTURE', status: 'inspecting · stack + dependencies',
        kind: 'tree',
        feed: [
          ['repo.public',   '4 packages · 2 stale',          'warn'],
          ['stack',         'pgvector + nextjs + bun',       'ok'],
          ['vendor.lock',   '1 hard dep · openai',           'warn'],
          ['benchmarks',    'p95 latency 312ms',             'ok'],
          ['marketing.gap', 'claim vs code · 2 mismatches',  'warn'],
          ['shippable',     'audit · architecture sound',    'ok'],
        ],
      },
      {
        id: 'A.04', name: 'Product',
        desc: 'Walks the product like a user. Scores feature depth. Where the demo ends and the product begins.',
        tag: 'PROBING · FEATURE DEPTH', status: 'walking · product as user',
        kind: 'checklist',
        feed: [
          ['onboarding',   'completed · 4 min 12 s',     'ok'],
          ['core.loop',    '7 of 9 surfaces shipping',   'ok'],
          ['demo.gap',     'screen 04 · pre-rendered',   'warn'],
          ['integrations', '3 live · 6 claimed',         'warn'],
          ['polish',       'IA depth · 0.78',            'ok'],
          ['empty.states', 'covered · 11 of 14',         'ok'],
        ],
      },
      {
        id: 'A.05', name: 'Traction',
        desc: 'Reconstructs growth from primary signals. Triangulates the numbers — not founder narration.',
        tag: 'PLOTTING · COHORTS', status: 'reconstructing · cohort series',
        kind: 'line',
        feed: [
          ['stripe.feed',     'MRR 312k → 504k · 6 mo',   'ok'],
          ['cohort.m3',       'retention 78% · M3',       'ok'],
          ['narrate.claim',   '4× YoY · checks 2.6×',     'warn'],
          ['logos',           '14 paid · 11 verified',    'ok'],
          ['churn',           'gross 4.2% / mo',          'warn'],
          ['expansion',       'NDR 124%',                 'ok'],
        ],
      },
      {
        id: 'A.06', name: 'Economics',
        desc: 'Models pricing, retention, CAC, margins and unit economics across scenarios. Uncertainty stays visible.',
        tag: 'MODELING · UNIT ECON', status: 'modeling · pricing + CAC',
        kind: 'table',
        feed: [
          ['acv',           'median 38k · band ±12k',   'ok'],
          ['cac',           'blended 9.4k',             'ok'],
          ['payback',       '7.2 mo · stress 11.4 mo',  'warn'],
          ['gross.margin',  '74% · trending +',         'ok'],
          ['ltv.cac',       '4.1× base · 2.6× stress',  'ok'],
          ['scenario',      '3 paths modeled',          'ok'],
        ],
      },
      {
        id: 'A.07', name: 'Team',
        desc: 'Builds the operator graph. Prior roles, outcomes, collaborators, founder–market fit, and what the CV omits.',
        tag: 'BUILDING · OPERATOR GRAPH', status: 'building · operator graph',
        kind: 'graph',
        feed: [
          ['founders.2',    'prior exit · 1 of 2',         'ok'],
          ['network',       '184 collaborators mapped',    'ok'],
          ['fmf.score',     'founder-market fit · 0.82',   'ok'],
          ['cv.gap',        '14 mo · 2018 · unstated',     'warn'],
          ['talent.bench',  'eng 9 · gtm 4 · ds 2',        'ok'],
          ['advisors',      '3 of 5 active in field',      'ok'],
        ],
      },
      {
        id: 'A.08', name: 'Risk',
        desc: 'Adversarial. Searches for disconfirming evidence — regulatory, structural, narrative, execution.',
        tag: 'TESTING · DISCONFIRMING', status: 'adversarial · seeking counter-evidence',
        kind: 'heat',
        feed: [
          ['regulatory',     'EU AI Act · tier 2 exposure',   'warn'],
          ['structural',     'platform risk · openai',        'warn'],
          ['narrative',      '2 founder claims unverified',   'warn'],
          ['execution',      'velocity stable · 11 sprints',  'ok'],
          ['concentration',  'top 3 = 41% revenue',           'warn'],
          ['fail.modes',     '7 catalogued · 2 critical',     'warn'],
        ],
      },
      {
        id: 'A.09', name: 'IC Narrative',
        desc: 'Compresses the research surface into the IC memo. Conclusions earn their place; every claim is sourced.',
        tag: 'COMPOSING · MEMO', status: 'composing · IC narrative',
        kind: 'memo',
        feed: [
          ['compress',     '14,212 nodes → memo',         'ok'],
          ['sources',      '312 attached · all cited',    'ok'],
          ['assumptions',  '11 named · 4 load-bearing',   'ok'],
          ['risks',        '7 open · 2 critical',         'warn'],
          ['conviction',   '0.68 · proceed to vote',      'ok'],
          ['memo.ready',   'IC packet · 14 pp',           'ok'],
        ],
      },
    ];

    // ── DOM refs ─────────
    const rail   = document.getElementById('ds-rail');
    const pips   = Array.from(rail.querySelectorAll('.dsim__pip'));
    const aid    = document.getElementById('ds-aid');
    const aname  = document.getElementById('ds-aname');
    const adesc  = document.getElementById('ds-adesc');
    const status = document.getElementById('ds-status');
    const dsSrc  = document.getElementById('ds-src');
    const dsEv   = document.getElementById('ds-ev');
    const dsCc   = document.getElementById('ds-cc');
    const tag    = document.getElementById('ds-tag');
    const meta   = document.getElementById('ds-meta');
    const stage  = document.getElementById('ds-stage');
    const feed   = document.getElementById('ds-feed');

    // ── Helpers ─────────
    const pad = (n, w = 2) => String(Math.floor(n)).padStart(w, '0');
    const NS = 'http://www.w3.org/2000/svg';
    const svg = (tag, attrs) => {
      const el = document.createElementNS(NS, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      return el;
    };

    // Seeded random for stable visuals per phase
    function rng(seed) {
      let s = seed >>> 0;
      return () => { s = (s * 1664525 + 1013904223) >>> 0; return (s & 0xffffff) / 0x1000000; };
    }

    // ── Phase visuals ──────────────────────────────
    function buildViz(kind, seed) {
      stage.innerHTML = '';
      const W = 600, H = 220;
      const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none' });
      const r = rng(seed);

      if (kind === 'bars') {
        // TAM bars growing
        const n = 14;
        for (let i = 0; i < n; i++) {
          const x = 30 + i * ((W - 60) / n);
          const h = 30 + r() * 150;
          const bw = (W - 60) / n - 6;
          const bg = svg('rect', { x, y: H - 30 - h, width: bw, height: h, fill: i === 9 ? 'var(--blue)' : 'rgba(255,255,255,0.12)' });
          bg.style.transformOrigin = `${x + bw/2}px ${H - 30}px`;
          bg.style.transform = 'scaleY(0)';
          bg.style.transition = `transform .6s cubic-bezier(.2,.7,.2,1) ${i * 60}ms`;
          root.appendChild(bg);
          requestAnimationFrame(() => requestAnimationFrame(() => { bg.style.transform = 'scaleY(1)'; }));
        }
        // baseline
        root.appendChild(svg('line', { x1: 20, x2: W - 20, y1: H - 30, y2: H - 30, class: 'ln' }));
        // labels
        const lblL = svg('text', { x: 20, y: 18, class: 't-3' }); lblL.textContent = 'TAM · $19.6B'; root.appendChild(lblL);
        const lblR = svg('text', { x: W - 20, y: 18, 'text-anchor': 'end', class: 't-blue' }); lblR.textContent = 'BOUND · primary'; root.appendChild(lblR);
      }

      else if (kind === 'scatter') {
        // Scatter of competitors, cluster + 2 outliers
        const pts = [];
        for (let i = 0; i < 38; i++) {
          const cluster = i < 11;
          const x = cluster ? 90 + r() * 140 : 80 + r() * (W - 160);
          const y = cluster ? 90 + r() * 70 : 30 + r() * (H - 80);
          pts.push({ x, y, wedge: i === 14 || i === 27 });
        }
        // axes
        root.appendChild(svg('line', { x1: 30, x2: W - 30, y1: H - 30, y2: H - 30, class: 'ln' }));
        root.appendChild(svg('line', { x1: 30, x2: 30, y1: 20, y2: H - 30, class: 'ln' }));
        pts.forEach((p, i) => {
          const c = svg('circle', {
            cx: p.x, cy: p.y, r: p.wedge ? 5 : 3,
            fill: p.wedge ? 'var(--blue)' : 'rgba(255,255,255,0.32)',
          });
          c.style.opacity = '0';
          c.style.transition = `opacity .4s ease ${i * 25}ms`;
          root.appendChild(c);
          requestAnimationFrame(() => requestAnimationFrame(() => { c.style.opacity = '1'; }));
        });
        // cluster ring
        const ring = svg('ellipse', { cx: 160, cy: 125, rx: 84, ry: 42, class: 'accent-dim' });
        root.appendChild(ring);
        const lbl = svg('text', { x: 160, y: 80, 'text-anchor': 'middle', class: 't-3' }); lbl.textContent = 'COMMODITY LAYER · 11'; root.appendChild(lbl);
        const lbl2 = svg('text', { x: W - 30, y: 30, 'text-anchor': 'end', class: 't-blue' }); lbl2.textContent = 'WEDGE · 2'; root.appendChild(lbl2);
      }

      else if (kind === 'tree') {
        // Dependency tree
        const nodes = [
          { x: 300, y: 30,  label: 'core' },
          { x: 150, y: 95,  label: 'pgvector' },
          { x: 300, y: 95,  label: 'nextjs' },
          { x: 450, y: 95,  label: 'bun' },
          { x: 90,  y: 165, label: 'pg' },
          { x: 210, y: 165, label: 'embed', dim: false, hot: false },
          { x: 270, y: 165, label: 'react' },
          { x: 330, y: 165, label: 'edge' },
          { x: 410, y: 165, label: 'zlib' },
          { x: 510, y: 165, label: 'openai', hot: true },
        ];
        const links = [[0,1],[0,2],[0,3],[1,4],[1,5],[2,6],[2,7],[3,8],[3,9]];
        links.forEach(([a, b], i) => {
          const ln = svg('line', { x1: nodes[a].x, y1: nodes[a].y, x2: nodes[b].x, y2: nodes[b].y, class: 'ln' });
          ln.style.opacity = '0';
          ln.style.transition = `opacity .35s ease ${i * 70}ms`;
          root.appendChild(ln);
          requestAnimationFrame(() => requestAnimationFrame(() => { ln.style.opacity = '1'; }));
        });
        nodes.forEach((n, i) => {
          const c = svg('circle', { cx: n.x, cy: n.y, r: i === 0 ? 5 : 3.5, fill: n.hot ? 'var(--amber, #d9a441)' : (i === 0 ? 'var(--blue)' : 'rgba(255,255,255,0.45)') });
          c.style.opacity = '0';
          c.style.transition = `opacity .35s ease ${i * 60 + 200}ms`;
          root.appendChild(c);
          const t = svg('text', { x: n.x, y: n.y - 9, 'text-anchor': 'middle', class: n.hot ? 't-blue' : 't-3' });
          t.style.fill = n.hot ? 'var(--amber, #d9a441)' : '';
          t.textContent = n.label;
          t.style.opacity = '0';
          t.style.transition = `opacity .35s ease ${i * 60 + 260}ms`;
          root.appendChild(t);
          requestAnimationFrame(() => requestAnimationFrame(() => { c.style.opacity = '1'; t.style.opacity = '1'; }));
        });
      }

      else if (kind === 'checklist') {
        const items = [
          'Onboarding · 4m 12s',
          'Core loop · 7/9 surfaces',
          'Demo screen 04 · pre-rendered',
          'Integrations · 3 of 6 live',
          'Empty states · 11/14',
          'IA depth score · 0.78',
        ];
        items.forEach((txt, i) => {
          const y = 28 + i * 30;
          const box = svg('rect', { x: 30, y: y - 9, width: 12, height: 12, fill: 'none', stroke: 'rgba(255,255,255,0.25)' });
          root.appendChild(box);
          const isWarn = i === 2 || i === 3;
          const tick = svg('path', { d: `M${33} ${y - 3} L${36} ${y} L${42} ${y - 6}`, stroke: isWarn ? 'var(--amber, #d9a441)' : 'var(--blue)', 'stroke-width': 1.5, fill: 'none' });
          tick.style.strokeDasharray = '20';
          tick.style.strokeDashoffset = '20';
          tick.style.transition = `stroke-dashoffset .5s ease ${i * 220 + 180}ms`;
          root.appendChild(tick);
          requestAnimationFrame(() => requestAnimationFrame(() => { tick.style.strokeDashoffset = '0'; }));
          const t = svg('text', { x: 56, y: y + 3, class: isWarn ? 't-2' : 't-2' });
          t.style.fontSize = '11px';
          t.textContent = txt;
          t.style.opacity = '0';
          t.style.transition = `opacity .3s ease ${i * 220}ms`;
          root.appendChild(t);
          requestAnimationFrame(() => requestAnimationFrame(() => { t.style.opacity = '1'; }));
          if (isWarn) {
            const flag = svg('text', { x: W - 30, y: y + 3, 'text-anchor': 'end', class: 't-3' });
            flag.style.fill = 'var(--amber, #d9a441)';
            flag.textContent = '! claim vs ship';
            flag.style.opacity = '0';
            flag.style.transition = `opacity .3s ease ${i * 220 + 300}ms`;
            root.appendChild(flag);
            requestAnimationFrame(() => requestAnimationFrame(() => { flag.style.opacity = '1'; }));
          }
        });
      }

      else if (kind === 'line') {
        // Cohort line chart
        const pts = [];
        let v = 60;
        for (let i = 0; i < 14; i++) {
          v += 8 + r() * 16;
          pts.push({ x: 30 + i * ((W - 60) / 13), y: H - 30 - v });
        }
        // baseline
        root.appendChild(svg('line', { x1: 30, x2: W - 30, y1: H - 30, y2: H - 30, class: 'ln' }));
        // grid
        for (let i = 1; i < 4; i++) {
          root.appendChild(svg('line', { x1: 30, x2: W - 30, y1: H - 30 - i * 50, y2: H - 30 - i * 50, class: 'ln-2' }));
        }
        // claim line (dashed, higher)
        const cpts = pts.map((p, i) => ({ x: p.x, y: H - 30 - (60 + i * 14 + r() * 4) }));
        const cd = 'M' + cpts.map(p => `${p.x},${p.y}`).join(' L');
        const claim = svg('path', { d: cd, stroke: 'rgba(217,164,65,0.55)', 'stroke-width': 1, fill: 'none', 'stroke-dasharray': '3 4' });
        root.appendChild(claim);
        // actual line
        const d = 'M' + pts.map(p => `${p.x},${p.y}`).join(' L');
        const path = svg('path', { d, class: 'accent' });
        const len = 1200;
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        path.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.6,.1,.2,1)';
        root.appendChild(path);
        requestAnimationFrame(() => requestAnimationFrame(() => { path.style.strokeDashoffset = '0'; }));
        // labels
        const l1 = svg('text', { x: 30, y: 18, class: 't-blue' }); l1.textContent = 'ACTUAL · stripe feed'; root.appendChild(l1);
        const l2 = svg('text', { x: W - 30, y: 18, 'text-anchor': 'end', class: 't-3' });
        l2.style.fill = 'var(--amber, #d9a441)';
        l2.textContent = 'CLAIM · 4× YoY'; root.appendChild(l2);
      }

      else if (kind === 'table') {
        // Unit economics table
        const cols = ['BASE', 'STRESS', 'BULL'];
        const rows = [
          ['ACV',         ['$38k',  '$31k',  '$44k']],
          ['CAC',         ['$9.4k', '$11.2k','$7.8k']],
          ['PAYBACK',     ['7.2m',  '11.4m', '5.1m']],
          ['LTV / CAC',   ['4.1×',  '2.6×',  '5.8×']],
          ['GROSS MARGIN',['74%',   '69%',   '78%']],
        ];
        // header
        cols.forEach((c, i) => {
          const t = svg('text', { x: 220 + i * 110, y: 26, 'text-anchor': 'middle', class: 't-3' });
          t.textContent = c;
          root.appendChild(t);
        });
        root.appendChild(svg('line', { x1: 30, x2: W - 30, y1: 38, y2: 38, class: 'ln' }));
        rows.forEach((row, ri) => {
          const y = 60 + ri * 28;
          const label = svg('text', { x: 30, y: y, class: 't-2' });
          label.style.fontSize = '10.5px';
          label.textContent = row[0];
          root.appendChild(label);
          row[1].forEach((v, ci) => {
            const cell = svg('text', { x: 220 + ci * 110, y, 'text-anchor': 'middle', class: ci === 0 ? 't-blue' : 't-2' });
            cell.style.fontSize = '12px';
            cell.style.opacity = '0';
            cell.style.transition = `opacity .3s ease ${(ri * 3 + ci) * 90 + 150}ms`;
            cell.textContent = v;
            root.appendChild(cell);
            requestAnimationFrame(() => requestAnimationFrame(() => { cell.style.opacity = '1'; }));
          });
        });
      }

      else if (kind === 'graph') {
        // Operator graph — nodes connected
        const nodes = [];
        // center founders
        nodes.push({ x: 250, y: 110, r: 5, label: 'F1', kind: 'founder' });
        nodes.push({ x: 340, y: 110, r: 5, label: 'F2', kind: 'founder' });
        // ring of collaborators
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          nodes.push({ x: 295 + Math.cos(a) * 85, y: 110 + Math.sin(a) * 70, r: 2.5 });
        }
        // outer scatter
        for (let i = 0; i < 18; i++) {
          nodes.push({ x: 60 + r() * (W - 120), y: 30 + r() * (H - 60), r: 2 });
        }
        // links (founders -> ring; some ring -> outer)
        const links = [];
        for (let i = 2; i < 18; i++) {
          if (r() > 0.3) links.push([0, i]);
          if (r() > 0.5) links.push([1, i]);
        }
        for (let i = 18; i < 36; i++) {
          if (r() > 0.5) links.push([2 + Math.floor(r() * 16), i]);
        }
        links.forEach((l, i) => {
          const ln = svg('line', { x1: nodes[l[0]].x, y1: nodes[l[0]].y, x2: nodes[l[1]].x, y2: nodes[l[1]].y, stroke: 'rgba(255,255,255,0.07)', 'stroke-width': 1 });
          ln.style.opacity = '0';
          ln.style.transition = `opacity .4s ease ${i * 18}ms`;
          root.appendChild(ln);
          requestAnimationFrame(() => requestAnimationFrame(() => { ln.style.opacity = '1'; }));
        });
        nodes.forEach((n, i) => {
          const c = svg('circle', { cx: n.x, cy: n.y, r: n.r, fill: n.kind === 'founder' ? 'var(--blue)' : 'rgba(255,255,255,0.5)' });
          c.style.opacity = '0';
          c.style.transition = `opacity .35s ease ${Math.min(i * 22, 1200)}ms`;
          root.appendChild(c);
          requestAnimationFrame(() => requestAnimationFrame(() => { c.style.opacity = '1'; }));
          if (n.label) {
            const t = svg('text', { x: n.x, y: n.y + 18, 'text-anchor': 'middle', class: 't-blue' });
            t.textContent = n.label;
            root.appendChild(t);
          }
        });
        const lbl = svg('text', { x: 30, y: 24, class: 't-3' }); lbl.textContent = '184 NODES · 312 EDGES'; root.appendChild(lbl);
        const lbl2 = svg('text', { x: W - 30, y: 24, 'text-anchor': 'end', class: 't-blue' }); lbl2.textContent = 'FMF 0.82'; root.appendChild(lbl2);
      }

      else if (kind === 'heat') {
        // Risk heatmap 6x4
        const COLS = 12, ROWS = 5;
        const cellW = (W - 60) / COLS, cellH = (H - 60) / ROWS;
        for (let row = 0; row < ROWS; row++) {
          for (let col = 0; col < COLS; col++) {
            const i = row * COLS + col;
            const v = r();
            const hot = v > 0.78;
            const warm = v > 0.6;
            const fill = hot ? 'var(--amber, #d9a441)' : (warm ? 'rgba(217,164,65,0.35)' : 'rgba(255,255,255,0.06)');
            const rect = svg('rect', {
              x: 30 + col * cellW + 1, y: 30 + row * cellH + 1,
              width: cellW - 2, height: cellH - 2,
              fill,
            });
            rect.style.opacity = '0';
            rect.style.transition = `opacity .25s ease ${i * 12}ms`;
            root.appendChild(rect);
            requestAnimationFrame(() => requestAnimationFrame(() => { rect.style.opacity = hot ? '1' : (warm ? '1' : '0.6'); }));
          }
        }
        // row labels
        const lbls = ['REGULATORY', 'STRUCTURAL', 'NARRATIVE', 'EXECUTION', 'CONCENTRATION'];
        // We laid grid starting x=30, so labels actually overlap — instead label top
        const top = svg('text', { x: 30, y: 22, class: 't-3' }); top.textContent = '7 CATALOGUED · 2 CRITICAL'; root.appendChild(top);
        const right = svg('text', { x: W - 30, y: 22, 'text-anchor': 'end', class: 't-blue' });
        right.style.fill = 'var(--amber, #d9a441)';
        right.textContent = 'ADVERSARIAL · LIVE';
        root.appendChild(right);
      }

      else if (kind === 'memo') {
        stage.appendChild(root);
        const memo = document.createElement('div');
        memo.className = 'dsim__memo';
        memo.innerHTML = `
          <div class="dsim__memo-h">IC_MEMO · NORTHWIND_AI · SERIES A</div>
          <div class="dsim__memo-t" id="ds-memo-t"></div>
          <div class="dsim__memo-b" id="ds-memo-b"></div>
        `;
        stage.appendChild(memo);
        const tLine = 'Proceed to partner vote. Conviction 0.68.';
        const bLine = 'TAM bound at $14.2–19.6B from primary sources, 2.3× below founder claim.\nCohort traction triangulates to 2.6× YoY (vs 4× claimed).\n7 open risks · 2 critical · all evidence sourced.';
        const tEl = memo.querySelector('#ds-memo-t');
        const bEl = memo.querySelector('#ds-memo-b');
        let i = 0, j = 0;
        const typeT = () => {
          if (i <= tLine.length) { tEl.textContent = tLine.slice(0, i++); setTimeout(typeT, 22); }
          else typeB();
        };
        const typeB = () => {
          if (j <= bLine.length) { bEl.textContent = bLine.slice(0, j++); setTimeout(typeB, 9); }
        };
        typeT();
        return;
      }

      stage.appendChild(root);
    }

    // ── Feed ─────────────────────────────────────
    function pushFeedLine(time, label, msg, kind) {
      const li = document.createElement('li');
      li.innerHTML = `<span class="t">${time}</span><span>${label} <span style="color:var(--text-4)">·</span> ${msg}</span><span class="${kind === 'warn' ? 'warn' : 'ok'}">${kind === 'warn' ? '!' : '✓'}</span>`;
      feed.prepend(li);
      while (feed.children.length > 6) feed.lastElementChild.remove();
    }

    // ── State machine ────────────────────────────
    const PHASE_MS = 4500;
    let phaseIdx = -1;
    let phaseStart = 0;
    let metricBase = { src: 0, ev: 0, cc: 0 };
    let feedTimer = null;

    function setPhase(i) {
      if (i === phaseIdx) return;
      // mark pips
      pips.forEach((p, idx) => {
        p.classList.toggle('is-active', idx === i);
        p.classList.toggle('is-done', idx < i);
        p.style.setProperty('--p', idx === i ? 0 : (idx < i ? 1 : 0));
      });

      const ph = PHASES[i];
      aid.textContent = ph.id;
      aname.textContent = ph.name;
      adesc.textContent = ph.desc;
      tag.textContent = ph.tag;
      status.textContent = ph.status;

      // reset feed
      feed.innerHTML = '';
      // seed visual + feed
      buildViz(ph.kind, (i + 1) * 9973);

      // schedule feed lines through this phase
      if (feedTimer) clearInterval(feedTimer);
      let fi = 0;
      const tick = () => {
        if (fi >= ph.feed.length) return;
        const [label, msg, k] = ph.feed[fi++];
        const t = `${pad((Date.now() - sessionStart) / 1000 / 60)}:${pad((Date.now() - sessionStart) / 1000 % 60)}`;
        pushFeedLine(t, label, msg, k);
      };
      // first line quickly, then spread the rest
      tick();
      feedTimer = setInterval(tick, Math.floor(PHASE_MS / ph.feed.length));

      phaseIdx = i;
      phaseStart = performance.now();
      // bump base metrics each phase
      // increments tuned so: checks > evidence > sources, all stay in the low hundreds
      metricBase.src += 6  + Math.floor(Math.random() * 6);
      metricBase.ev  += 28 + Math.floor(Math.random() * 16);
      metricBase.cc  += 64 + Math.floor(Math.random() * 24);
    }

    const sessionStart = Date.now();

    // Live progress drive
    function frame(now) {
      const elapsed = now - phaseStart;
      const p = Math.min(elapsed / PHASE_MS, 1);
      const active = pips[phaseIdx];
      if (active) active.style.setProperty('--p', p);

      // metrics ramp
      dsSrc.textContent = pad(metricBase.src + Math.floor(p *  5), 3);
      dsEv.textContent  = String(metricBase.ev  + Math.floor(p * 22)).padStart(3, '0');
      dsCc.textContent  = String(metricBase.cc  + Math.floor(p * 48)).padStart(3, '0');
      meta.textContent  = `live · ${String(metricBase.ev + Math.floor(p*22)).padStart(3,'0')} nodes`;

      // demo timecode
      if (dt) {
        const sec = (Date.now() - sessionStart) / 1000;
        dt.textContent = `${pad(sec / 60)}:${pad(sec % 60)}`;
      }

      if (elapsed >= PHASE_MS) {
        const next = (phaseIdx + 1) % PHASES.length;
        if (next === 0) {
          // loop — reset
          metricBase = { src: 0, ev: 0, cc: 0 };
        }
        setPhase(next);
      }
      requestAnimationFrame(frame);
    }

    // Click-to-jump
    pips.forEach((p, idx) => {
      p.addEventListener('click', () => setPhase(idx));
      p.style.cursor = 'pointer';
    });

    // Start only when section in view
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      setPhase(0);
      requestAnimationFrame(frame);
    };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) start(); });
    }, { threshold: 0.15 });
    obs.observe(sim);
    // fallback if observer never triggers
    setTimeout(start, 1500);
  })();

  /* ──────────  PROCESS — sync the boost layer to the base video  ──────────
     Two stacked copies of the loop must play in lockstep so the boost layer's
     wordmark/beam glow lands exactly on the base layer's. Any drift causes a
     ghosting overlay; we resync whenever the gap grows beyond a small threshold. */
  const vBase  = document.querySelector('.process__anim--base');
  const vBoost = document.querySelector('.process__anim--boost');
  if (vBase && vBoost) {
    const SYNC_THRESHOLD = 0.04; // seconds
    const syncBoost = () => {
      if (!vBase.duration) return;
      const gap = Math.abs(vBoost.currentTime - vBase.currentTime);
      if (gap > SYNC_THRESHOLD) vBoost.currentTime = vBase.currentTime;
    };
    const startSync = () => {
      vBoost.play().catch(() => {});
      vBase.play().catch(() => {});
      syncBoost();
    };
    vBase.addEventListener('loadedmetadata', startSync);
    vBoost.addEventListener('loadedmetadata', startSync);
    vBase.addEventListener('seeked', syncBoost);
    vBase.addEventListener('play', startSync);
    setInterval(syncBoost, 200);
    startSync();
  }

  /* ──────────  PER-ITEM REVEAL  ──────────
     Each .reveal-item animates as IT crosses into view, so the
     stagger feels like it ticks in with scroll instead of all
     firing the moment the section's edge appears.            */
  const items = document.querySelectorAll('.reveal-item, .smoke-in');
  const itemIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-revealed');
        itemIO.unobserve(e.target);
      }
    });
  }, {
    threshold: 0,
    rootMargin: '0px 0px 12% 0px'
  });
  items.forEach(el => itemIO.observe(el));

  /* Plaque (Operating Principle) — uses its own observer so the staged
     "A summary is not diligence → Evidence attached IS." reveal fires only
     when the section is well into view (otherwise the animation runs
     before the user scrolls there and looks broken). */
  const plaque = document.querySelector('.plaque--anim');
  if (plaque) {
    // make sure the shared observer doesn't pre-trigger it
    itemIO.unobserve(plaque);
    plaque.classList.remove('is-revealed');
    const plaqueIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          plaque.classList.add('is-revealed');
          plaqueIO.disconnect();
        }
      });
    }, { threshold: 0.55, rootMargin: '-10% 0px -10% 0px' });
    plaqueIO.observe(plaque);
  }

  /* Output section ("The memo separates signal from story") — same issue
     as the plaque: the generic reveal trigger fires too early so by the
     time the user scrolls to the section the quote has already appeared.
     Use ONE observer on the section, then reveal all items together so
     their --i stagger delays actually cascade in sequence. */
  const outputSec = document.getElementById('output');
  if (outputSec) {
    const outItems = outputSec.querySelectorAll('.reveal-item, .smoke-in');
    outItems.forEach(el => {
      itemIO.unobserve(el);
      el.classList.remove('is-revealed');
    });
    const outputIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          outItems.forEach(el => el.classList.add('is-revealed'));
          outputIO.disconnect();
        }
      });
    }, { threshold: 0.2, rootMargin: '-20% 0px -10% 0px' });
    outputIO.observe(outputSec);
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach(el => el.classList.add('is-revealed'));
  }

  /* ──────────  AGENT SPINE (.hspine)  ────────── */
  const spine = document.querySelector('.hspine');
  if (spine) {
    const cols = Array.from(spine.querySelectorAll('.hspine__col'));
    const nodes = spine.querySelector('.hspine__nodes');
    const detail = {
      id:    spine.querySelector('.hspine__detail-id'),
      title: spine.querySelector('.hspine__detail-title'),
      text:  spine.querySelector('.hspine__detail-text'),
    };

    function alignLine() {
      if (!nodes || !cols.length) return;
      const firstNode = cols[0].querySelector('.hspine__node');
      if (!firstNode) return;
      const nodesRect = nodes.getBoundingClientRect();
      const dotRect = firstNode.getBoundingClientRect();
      const top = dotRect.top + dotRect.height / 2 - nodesRect.top;
      spine.style.setProperty('--line-top', top.toFixed(1) + 'px');
      drawRoute();
    }

    const route = spine.querySelector('.hspine__route');
    const routePath  = route && route.querySelector('.hspine__route-path');
    const routeElbow = route && route.querySelector('.hspine__route-elbow');
    const detailEl   = spine.querySelector('.hspine__detail');

    function drawRoute() {
      if (!route || !routePath) return;
      const active = spine.querySelector('.hspine__col.is-active');
      if (!active) return;
      const r = route.getBoundingClientRect();
      if (r.width === 0) return;
      route.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
      route.setAttribute('preserveAspectRatio', 'none');

      const activeRect = active.getBoundingClientRect();
      const sx = activeRect.left + activeRect.width / 2 - r.left;

      // Target X: horizontal center of the detail block, fallback to SVG center
      let ex = r.width / 2;
      if (detailEl) {
        const dRect = detailEl.getBoundingClientRect();
        ex = dRect.left + dRect.width / 2 - r.left;
      }

      const sy = 0;
      const ey = r.height;
      const bendY = r.height * 0.55;

      let d;
      if (Math.abs(sx - ex) < 1.5) {
        d = `M${sx.toFixed(1)},${sy} L${sx.toFixed(1)},${ey}`;
        if (routeElbow) routeElbow.style.opacity = '0';
      } else {
        d = `M${sx.toFixed(1)},${sy} L${sx.toFixed(1)},${bendY.toFixed(1)} L${ex.toFixed(1)},${bendY.toFixed(1)} L${ex.toFixed(1)},${ey}`;
        if (routeElbow) {
          routeElbow.setAttribute('cx', sx.toFixed(1));
          routeElbow.setAttribute('cy', bendY.toFixed(1));
          routeElbow.style.opacity = '1';
        }
      }
      routePath.setAttribute('d', d);
    }

    function activate(col) {
      if (!col || col.classList.contains('is-active')) return;
      cols.forEach(c => {
        const on = c === col;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      const i = parseInt(col.dataset.i, 10) || 0;
      spine.style.setProperty('--active-i', i);
      if (detail.id)    detail.id.textContent    = col.dataset.id;
      if (detail.title) detail.title.textContent = col.dataset.name;
      if (detail.text)  detail.text.textContent  = col.dataset.desc;
      [detail.title, detail.text].forEach(el => {
        if (!el) return;
        const cls = el.classList.contains('hspine__detail-title') ? 'hspine__detail-title--in' : 'hspine__detail-text--in';
        el.classList.remove(cls);
        void el.offsetWidth;
        el.classList.add(cls);
      });
      drawRoute();
    }

    cols.forEach(col => {
      const markInteraction = () => spine.classList.add('has-interaction');
      col.addEventListener('click', () => { markInteraction(); activate(col); });
      col.addEventListener('focus', () => { markInteraction(); activate(col); });
      col.addEventListener('mouseenter', () => { markInteraction(); activate(col); });
      col.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(col); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const i = cols.indexOf(col);
          cols[(i + 1) % cols.length].focus();
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const i = cols.indexOf(col);
          cols[(i - 1 + cols.length) % cols.length].focus();
        }
      });
    });

    alignLine();
    setTimeout(alignLine, 80);
    setTimeout(alignLine, 400);
    let raf = 0;
    const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(alignLine); };
    window.addEventListener('resize', schedule);
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(spine);
    document.fonts && document.fonts.ready && document.fonts.ready.then(alignLine);
  }

  /* ──────────  CTA request form → ACK overlay  ────────── */
  {
    const form = document.getElementById('cta-form');
    if (form) {
      const emailInput = form.querySelector('#cta-email');
      const honeypot   = form.querySelector('[name="website"]');
      const submitBtn  = form.querySelector('.cta__btn');
      const errorEl    = form.querySelector('#cta-error');

      const ack       = document.getElementById('ack');
      const ackVeil   = ack.querySelector('.ack__veil');
      const ackClose  = ack.querySelector('.ack__close');
      let lastFocus = null;

      function openAck() {
        lastFocus = document.activeElement;
        ack.hidden = false;
        ack.setAttribute('aria-hidden', 'false');
        ack.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        ackClose.focus();
      }

      function closeAck() {
        ack.classList.remove('is-open');
        ack.setAttribute('aria-hidden', 'true');
        ack.hidden = true;
        document.body.style.overflow = '';
        if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
      }

      function showError(msg) {
        errorEl.textContent = msg;
        errorEl.hidden = false;
      }

      function clearError() {
        errorEl.hidden = true;
        errorEl.textContent = '';
      }

      ackClose.addEventListener('click', closeAck);
      ackVeil.addEventListener('click', closeAck);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && ack.classList.contains('is-open')) closeAck();
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        if (!form.checkValidity()) {
          emailInput.reportValidity();
          return;
        }

        submitBtn.disabled = true;

        try {
          const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: emailInput.value.trim(),
              website: honeypot.value, // honeypot — bots fill this; server silent-drops
            }),
          });

          if (!res.ok) throw new Error('bad response');

          openAck();
          form.reset();
        } catch (err) {
          showError('Could not send. Please try again or email contact@ic-terminal.com directly.');
        } finally {
          submitBtn.disabled = false;
        }
      });
    }
  }
})();
