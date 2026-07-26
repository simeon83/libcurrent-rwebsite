// LIBCURRENT RENEWABLE — shared site behaviour
// Content for settings, projects, and testimonials is loaded from /data/*.json
// so it can be edited through the /admin content editor without touching code.

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

// Looks up a dotted path ("story.heading") inside a nested object.
function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

// Generic binder: fills every element with [data-content="path"] found within
// `root` (defaults to the whole page) from the given data object. Works for
// text, or for <img> tags (sets src) — used by every page-specific loader
// below so simple singular fields don't need hand-written binding code.
function bindContent(data, root = document) {
  root.querySelectorAll('[data-content]').forEach(el => {
    const value = getPath(data, el.getAttribute('data-content'));
    if (value === undefined || value === null) return;
    if (el.tagName === 'IMG') el.src = value;
    else if (el.hasAttribute('data-html')) el.innerHTML = value;
    else el.textContent = value;
  });
}

// ---- Site settings: phone, email, address, WhatsApp, homepage hero text ----
async function loadSettings() {
  try {
    const res = await fetch('data/settings.json', { cache: 'no-store' });
    if (!res.ok) return;
    const s = await res.json();

    document.querySelectorAll('[data-field="phone"]').forEach(el => el.textContent = s.phone || '');
    document.querySelectorAll('[data-field="email"]').forEach(el => el.textContent = s.email || '');
    document.querySelectorAll('[data-field="address"]').forEach(el => el.innerHTML = escapeHtml(s.address || '').replace(/, /g, ',<br>'));
    document.querySelectorAll('[data-field="hours"]').forEach(el => el.innerHTML = escapeHtml(s.hours || '').replace(/ · /g, '<br>'));
    document.querySelectorAll('[data-field="hero-headline"]').forEach(el => el.textContent = s.heroHeadline || '');
    document.querySelectorAll('[data-field="hero-subheadline"]').forEach(el => el.textContent = s.heroSubheadline || '');
    document.querySelectorAll('[data-field="assistant-name"]').forEach(el => el.textContent = s.assistantName || 'Amp');
    if (window.LibCurrentChat) window.LibCurrentChat.applySettings(s);

    if (s.whatsapp) {
      document.querySelectorAll('[data-field="whatsapp-link"]').forEach(el => el.href = `https://wa.me/${s.whatsapp}`);
    }
    if (s.phone) {
      document.querySelectorAll('[data-field="phone-tel"]').forEach(el => el.href = `tel:${s.phone.replace(/\s+/g, '')}`);
    }
  } catch (e) { console.error('Could not load site settings:', e); }
}

// ---- Testimonials (rendered on the homepage) ----
async function loadTestimonials() {
  const grid = document.querySelector('#testimonials-grid');
  if (!grid) return;
  try {
    const res = await fetch('data/testimonials.json', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    grid.innerHTML = (data.items || []).map(t => `
      <div class="testi-card reveal in">
        <div class="stars">${'★'.repeat(t.rating || 5)}</div>
        <p>"${escapeHtml(t.quote)}"</p>
        <div class="testi-name">${escapeHtml(t.name)}</div>
        <div class="testi-role">${escapeHtml(t.role)}</div>
      </div>`).join('');
  } catch (e) { console.error('Could not load testimonials:', e); }
}

// ---- Projects (full grid on projects.html, first 3 as teaser on homepage) ----
async function loadProjects() {
  const fullGrid = document.querySelector('#projects-grid');
  const teaserGrid = document.querySelector('#featured-projects-grid');
  if (!fullGrid && !teaserGrid) return;

  const cardHtml = p => `
    <div class="project-card" data-category="${escapeHtml(p.category)}">
      <div class="project-media">
        <span class="project-status">${escapeHtml(p.status)}</span>
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">
      </div>
      <div class="project-body">
        <span class="project-cat">${escapeHtml(p.category)}</span>
        <h3>${escapeHtml(p.title)}</h3>
        <p class="project-loc">${escapeHtml(p.location)}</p>
        ${p.description ? `<p>${escapeHtml(p.description)}</p>` : ''}
      </div>
    </div>`;

  try {
    const res = await fetch('data/projects.json', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const items = data.items || [];

    if (fullGrid) {
      fullGrid.innerHTML = items.map(cardHtml).join('');
      setupProjectFilters();
    }
    if (teaserGrid) {
      teaserGrid.innerHTML = items.slice(0, 3).map(cardHtml).join('');
    }
  } catch (e) { console.error('Could not load projects:', e); }
}

// Filter buttons work on whatever cards currently exist in #projects-grid,
// including ones just injected from data/projects.json.
function setupProjectFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      document.querySelectorAll('#projects-grid .project-card').forEach(card => {
        card.style.display = (cat === 'all' || card.dataset.category === cat) ? '' : 'none';
      });
    });
  });
}

// ---- Home page: highlights, why-us, section headings, CTA, newsletter ----
async function loadHome() {
  try {
    const res = await fetch('data/home.json', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    bindContent(data);

    const cardIcons = [
      '<path d="M3 12 9 5v5h5l-6 9v-6H3z"/>',
      '<path d="M3 21h18M6 21V9l6-4 6 4v12M10 21v-5h4v5"/>',
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
      '<rect x="2" y="7" width="16" height="10" rx="2"/><path d="M18 10v4M22 9v6"/>'
    ];
    const cardsWrap = document.querySelector('#highlight-cards');
    if (cardsWrap && data.highlights && data.highlights.cards) {
      cardsWrap.innerHTML = data.highlights.cards.map((c, i) => `
        <div class="highlight-card reveal in">
          <div class="icon-badge"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${cardIcons[i % cardIcons.length]}</svg></div>
          <h3>${escapeHtml(c.title)}</h3>
          <p>${escapeHtml(c.text)}</p>
        </div>`).join('');
    }

    const pointsWrap = document.querySelector('#value-list-items');
    if (pointsWrap && data.whyUs && data.whyUs.points) {
      pointsWrap.innerHTML = data.whyUs.points.map(p => `
        <li><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> ${escapeHtml(p)}</li>`).join('');
    }
  } catch (e) { console.error('Could not load home content:', e); }
}

// ---- About page: hero, story, vision/mission, values, who-we-serve, CTA ----
async function loadAbout() {
  try {
    const res = await fetch('data/about.json', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    bindContent(data);

    const paraWrap = document.querySelector('#story-paragraphs');
    if (paraWrap && data.story && data.story.paragraphs) {
      paraWrap.innerHTML = data.story.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join('');
    }
    const valuesWrap = document.querySelector('#core-values-grid');
    if (valuesWrap && data.values && data.values.items) {
      valuesWrap.innerHTML = data.values.items.map(v => `
        <div class="highlight-card reveal in"><h3>${escapeHtml(v.title)}</h3><p>${escapeHtml(v.text)}</p></div>`).join('');
    }
    const serveWrap = document.querySelector('#serve-grid');
    if (serveWrap && data.whoWeServe && data.whoWeServe.items) {
      serveWrap.innerHTML = data.whoWeServe.items.map(v => `
        <div class="highlight-card reveal in"><h3>${escapeHtml(v.title)}</h3><p>${escapeHtml(v.text)}</p></div>`).join('');
    }
  } catch (e) { console.error('Could not load about content:', e); }
}

// ---- Services page: hero, category tabs/panels, FAQ, CTA ----
async function loadServicesPage() {
  try {
    const res = await fetch('data/services.json', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    bindContent(data);

    const tabsWrap = document.querySelector('#service-tabs');
    const panelsWrap = document.querySelector('#service-panels');
    if (tabsWrap && panelsWrap && data.categories) {
      tabsWrap.innerHTML = data.categories.map((c, i) =>
        `<button class="tab-btn${i === 0 ? ' active' : ''}" data-target="panel-${i}">${escapeHtml(c.tabLabel)}</button>`).join('');
      panelsWrap.innerHTML = data.categories.map((c, i) => `
        <div id="panel-${i}" class="service-panel${i === 0 ? ' active' : ''}">
          <div class="service-block">
            <div>
              <span class="tag">${escapeHtml(c.tag)}</span>
              <h3>${escapeHtml(c.heading)}</h3>
              <p>${escapeHtml(c.text)}</p>
              <img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.heading)}" style="border-radius:12px;margin-top:16px;">
            </div>
            <ul class="check-grid">
              ${(c.items || []).map(it => `<li><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> ${escapeHtml(it)}</li>`).join('')}
            </ul>
          </div>
        </div>`).join('');
      setupServiceTabs();
    }

    const faqWrap = document.querySelector('#faq-list');
    if (faqWrap && data.faq && data.faq.items) {
      faqWrap.innerHTML = data.faq.items.map(f => `
        <div class="faq-item">
          <button class="faq-q">${escapeHtml(f.q)} <span class="plus">+</span></button>
          <div class="faq-a"><p>${escapeHtml(f.a)}</p></div>
        </div>`).join('');
      setupFaqAccordion();
    }
  } catch (e) { console.error('Could not load services content:', e); }
}

function setupServiceTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.service-panel');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.target);
      if (target) target.classList.add('active');
    });
  });
}

function setupFaqAccordion() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(other => {
        if (other !== item) { other.classList.remove('open'); other.querySelector('.faq-a').style.maxHeight = null; }
      });
      if (isOpen) { item.classList.remove('open'); a.style.maxHeight = null; }
      else { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });
}

// ---- Projects page: hero + CTA (grid itself comes from loadProjects) ----
async function loadProjectsPage() {
  try {
    const res = await fetch('data/projects-page.json', { cache: 'no-store' });
    if (!res.ok) return;
    bindContent(await res.json());
  } catch (e) { console.error('Could not load projects page content:', e); }
}

// ---- Quote page: hero + "how it works" steps ----
async function loadQuotePage() {
  try {
    const res = await fetch('data/quote-page.json', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    bindContent(data);
    const stepsWrap = document.querySelector('#steps-grid');
    if (stepsWrap && data.steps && data.steps.items) {
      stepsWrap.innerHTML = data.steps.items.map(s => `
        <div class="highlight-card reveal in"><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.text)}</p></div>`).join('');
    }
  } catch (e) { console.error('Could not load quote page content:', e); }
}

document.addEventListener('DOMContentLoaded', () => {

  loadSettings();
  loadTestimonials();
  loadProjects();

  // Dispatch to the content loader for whichever page this is
  const page = document.body.dataset.page;
  if (page === 'home') loadHome();
  if (page === 'about') loadAbout();
  if (page === 'services') loadServicesPage();
  if (page === 'projects') loadProjectsPage();
  if (page === 'quote') loadQuotePage();
  if (page === 'contact') loadContactPage();

  // Mobile nav toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  // Reveal on scroll
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // Quote / contact / newsletter form handling (front-end only demo)
  document.querySelectorAll('form[data-demo-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = form.querySelector('.form-success');
      form.querySelectorAll('input, textarea, select').forEach(f => f.disabled = true);
      const btn = form.querySelector('button[type="submit"]');
      if (btn) { btn.textContent = 'Request received'; btn.disabled = true; }
      if (note) note.style.display = 'block';
    });
  });

  // Upload field filename display
  const fileInput = document.querySelector('#project-images');
  const fileLabel = document.querySelector('#file-label');
  if (fileInput && fileLabel) {
    fileInput.addEventListener('change', () => {
      fileLabel.textContent = fileInput.files.length
        ? `${fileInput.files.length} file(s) selected`
        : 'Drag files here or click to browse (JPG, PNG, PDF)';
    });
  }
});
