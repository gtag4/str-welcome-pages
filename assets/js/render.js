// Loads /property.json (this property's data file, copied in at deploy time)
// and populates the shell in index.html. Keep this generic — no
// property-specific content belongs in this file.

async function loadProperty() {
  const res = await fetch('property.json');
  if (!res.ok) {
    console.error('Could not load property.json');
    return;
  }
  const data = await res.json();
  render(data);
}

function el(tag, opts = {}) {
  const node = document.createElement(tag);
  if (opts.text) node.textContent = opts.text;
  if (opts.html) node.innerHTML = opts.html;
  if (opts.className) node.className = opts.className;
  return node;
}

function renderDetailList(container, pairs) {
  container.innerHTML = '';
  pairs.forEach(([label, value]) => {
    if (!value) return;
    container.appendChild(el('dt', { text: label }));
    container.appendChild(el('dd', { text: value }));
  });
}

// Renders a list of {label, text} items as labeled paragraphs
// (used for check-in / check-out / emergency, where each item
// needs more room than a single-line detail list gives).
function renderNoteList(container, items) {
  container.innerHTML = '';
  items.forEach(({ label, text, url }) => {
    if (!text) return;
    const block = el('div', { className: 'note' });
    block.appendChild(el('h3', { text: label }));
    if (url) {
      const p = el('p');
      const a = el('a', { text: text });
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      p.appendChild(a);
      block.appendChild(p);
    } else {
      block.appendChild(el('p', { text: text }));
    }
    container.appendChild(block);
  });
}

function render(data) {
  document.title = data.propertyName ? `${data.propertyName} — Welcome` : 'Welcome';

  // Optional per-property color theme — overrides the shared defaults in style.css.
  // Any key omitted falls back to the CSS default, so a theme can override just one color.
  if (data.theme) {
    const root = document.documentElement.style;
    const themeVars = ['paper', 'ink', 'inkSoft', 'harbor', 'brass', 'sage', 'line'];
    const cssNameFor = { inkSoft: '--ink-soft' };
    themeVars.forEach(key => {
      if (data.theme[key]) {
        root.setProperty(cssNameFor[key] || `--${key}`, data.theme[key]);
      }
    });
  }

  const nameEl = document.getElementById('property-name');
  if (nameEl) nameEl.textContent = data.propertyName || '';

  const taglineEl = document.getElementById('tagline');
  if (taglineEl) taglineEl.textContent = data.tagline || '';

  if (data.heroImage) {
    const hero = document.getElementById('hero');
    hero.style.backgroundImage = `linear-gradient(rgba(15,15,15,0.25), rgba(15,15,15,0.55)), url('${data.heroImage}')`;
    hero.classList.add('has-image');
  }

  // Welcome message
  const welcomeEl = document.getElementById('welcome-message');
  if (welcomeEl) welcomeEl.textContent = data.welcomeMessage || '';
  toggleSection('section-welcome', Boolean(data.welcomeMessage));

  // The basics: wifi + check-in/out times
  renderDetailList(document.getElementById('basics-details'), [
    ['Check-in', data.checkIn?.time],
    ['Check-out', data.checkOut?.time],
    ['Wi-Fi network', data.wifi?.networkName],
    ['Wi-Fi password', data.wifi?.password],
  ]);

  // Checking in
  renderNoteList(document.getElementById('checkin-details'), [
    { label: 'Arrival', text: data.checkIn?.arrivalMessage },
    { label: 'Parking', text: data.checkIn?.parkingNote },
    { label: 'Door lock', text: data.checkIn?.doorLockNote },
    { label: 'Linens', text: data.checkIn?.linensNote },
  ]);

  // Checking out
  renderNoteList(document.getElementById('checkout-details'), [
    { label: 'Notice', text: data.checkOut?.notice },
    { label: 'Trash & recycling', text: data.checkOut?.trash },
    { label: 'Sheets & towels', text: data.checkOut?.sheetsTowels },
    { label: 'Windows & doors', text: data.checkOut?.windows },
    { label: 'Thermostat', text: data.checkOut?.thermostat },
    { label: 'Shed & yard', text: data.checkOut?.shedYard },
    { label: 'Accidents happen', text: data.checkOut?.accidents },
  ]);

  // Things to know — a flexible list of {label, text} items, varies per property
  renderNoteList(
    document.getElementById('know-details'),
    (data.thingsToKnow || []).map(item => ({ label: item.label, text: item.text }))
  );
  toggleSection('section-know', (data.thingsToKnow || []).some(t => t?.text));

  // House rules
  const rulesList = document.getElementById('rules-list');
  rulesList.innerHTML = '';
  (data.houseRules || []).forEach(rule => {
    if (!rule) return;
    rulesList.appendChild(el('li', { text: rule }));
  });
  toggleSection('section-rules', (data.houseRules || []).some(Boolean));

  // Items available for use
  const itemsList = document.getElementById('items-list');
  itemsList.innerHTML = '';
  (data.itemsAvailable || []).forEach(item => {
    if (!item?.label) return;
    const li = el('li');
    li.appendChild(el('span', { className: 'item-label', text: item.label }));
    if (item.detail) li.appendChild(el('span', { className: 'item-detail', text: item.detail }));
    itemsList.appendChild(li);
  });
  toggleSection('section-items', (data.itemsAvailable || []).some(i => i?.label));

  // Local recommendations, grouped by category, preserving category order of first appearance
  const recsContainer = document.getElementById('recs-list');
  recsContainer.innerHTML = '';
  const recs = (data.localRecommendations || []).filter(r => r?.name);
  const categoryOrder = [];
  const grouped = {};
  recs.forEach(r => {
    const cat = r.category || 'Other';
    if (!grouped[cat]) { grouped[cat] = []; categoryOrder.push(cat); }
    grouped[cat].push(r);
  });
  categoryOrder.forEach(category => {
    const items = grouped[category];
    const group = el('div', { className: 'rec-group' });
    group.appendChild(el('h3', { text: category }));
    const list = el('ul');
    items.forEach(r => {
      const li = el('li');
      const row = el('div', { className: 'rec-row' });
      const nameWrap = el('div', { className: 'rec-name' });
      if (r.url) {
        const a = el('a', { text: r.name });
        a.href = r.url;
        a.target = '_blank';
        a.rel = 'noopener';
        nameWrap.appendChild(a);
      } else {
        nameWrap.textContent = r.name;
      }
      row.appendChild(nameWrap);
      if (r.distance) row.appendChild(el('span', { className: 'rec-distance', text: r.distance }));
      li.appendChild(row);
      if (r.photoUrl) {
        const img = el('img');
        img.src = r.photoUrl;
        img.alt = r.name;
        img.loading = 'lazy';
        img.className = 'rec-photo';
        li.appendChild(img);
      }
      if (r.note) li.appendChild(el('p', { className: 'rec-note', text: r.note }));
      if (r.yelpUrl) {
        const yelpLink = el('a', { className: 'rec-yelp', text: 'View on Yelp' });
        yelpLink.href = r.yelpUrl;
        yelpLink.target = '_blank';
        yelpLink.rel = 'noopener';
        li.appendChild(yelpLink);
      }
      list.appendChild(li);
    });
    group.appendChild(list);
    recsContainer.appendChild(group);
  });
  toggleSection('section-recs', recs.length > 0);

  // FAQ
  const faqContainer = document.getElementById('faq-list');
  faqContainer.innerHTML = '';
  (data.faq || []).forEach(item => {
    if (!item?.question) return;
    const block = el('div', { className: 'faq-item' });
    block.appendChild(el('h3', { text: item.question }));
    if (item.answer) block.appendChild(el('p', { text: item.answer }));
    if (item.linkUrl) {
      const link = el('a', { className: 'faq-link', text: item.linkText || 'Learn more' });
      link.href = item.linkUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      block.appendChild(link);
    }
    faqContainer.appendChild(block);
  });
  toggleSection('section-faq', (data.faq || []).some(f => f?.question));

  // Emergency / contact
  const emergencyItems = [
    { label: 'Emergency', text: data.emergencyInfo?.emergency },
    { label: 'Host', text: data.emergencyInfo?.hostContact },
    { label: 'Local police (non-emergency)', text: data.emergencyInfo?.police },
    { label: 'Nearest hospital', text: data.emergencyInfo?.hospitalName, url: data.emergencyInfo?.hospitalUrl },
    { label: 'Nearest urgent care', text: data.emergencyInfo?.urgentCareName, url: data.emergencyInfo?.urgentCareUrl },
  ];
  renderNoteList(document.getElementById('emergency-details'), emergencyItems);
}

function toggleSection(id, shouldShow) {
  const section = document.getElementById(id);
  if (section) section.style.display = shouldShow ? '' : 'none';
}

loadProperty();
