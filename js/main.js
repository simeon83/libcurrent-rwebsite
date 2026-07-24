// LIBCURRENT RENEWABLE — shared site behaviour
// Content for settings, projects, and testimonials is loaded from /data/*.json
// so it can be edited through the /admin content editor without touching code.

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
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

document.addEventListener('DOMContentLoaded', () => {

  loadSettings();
  loadTestimonials();
  loadProjects();

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

  // Service tabs (services.html)
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

  // FAQ accordion
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
