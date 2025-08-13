// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const primaryMenu = document.getElementById('primaryMenu');
if (menuToggle && primaryMenu) {
  menuToggle.addEventListener('click', () => {
    const open = primaryMenu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });

  // Close menu when a nav link is clicked
  primaryMenu.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    primaryMenu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });

  // Close on Escape or outside click
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      primaryMenu.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// Current year in footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Smooth scroll for in-page links (safeguard older browsers)
document.addEventListener('click', (e) => {
  const target = e.target.closest('a[href^="#"]');
  if (!target) return;
  const id = target.getAttribute('href');
  const el = document.querySelector(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Basic IntersectionObserver to reveal sections
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('in-view');
  });
}, { threshold: 0.15 });

document.querySelectorAll('.section').forEach((sec) => observer.observe(sec));

// Lightbox modal for portfolio
(function(){
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const imgEl = document.getElementById('lightboxImage');
  const closeBtn = document.getElementById('lightboxClose');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');

  let triggers = [];
  let sources = [];
  let current = 0;

  function open(index){
    current = index;
    imgEl.src = sources[current];
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function close(){
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  function show(delta){
    current = (current + delta + sources.length) % sources.length;
    imgEl.src = sources[current];
  }

  function bindTriggers(){
    triggers = Array.from(document.querySelectorAll('.lightbox-trigger'));
    sources = triggers.map(el => el.getAttribute('src'));
    triggers.forEach((el, idx) => {
      el.onclick = (e) => { e.preventDefault(); open(idx); };
    });
  }
  bindTriggers();
  document.addEventListener('rebind-lightbox', bindTriggers);
  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
  prevBtn.addEventListener('click', () => show(-1));
  nextBtn.addEventListener('click', () => show(1));
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(-1);
    if (e.key === 'ArrowRight') show(1);
  });
})();

// Admin panel (client-side, localStorage)
(function(){
  const panel = document.getElementById('adminPanel');
  const form = document.getElementById('adminForm');
  const fileInput = document.getElementById('adminImageFile');
  const urlInput = document.getElementById('adminImageUrl');
  const captionInput = document.getElementById('adminCaption');
  const categoryInput = document.getElementById('adminCategory');
  const list = document.getElementById('adminItems');
  const btnExport = document.getElementById('adminExport');
  const btnImport = document.getElementById('adminImport');
  const galleryKitchen = document.getElementById('galleryKitchen');
  const galleryWardrobes = document.getElementById('galleryWardrobes');
  // Render galleries even if admin UI is not present; admin panel stays hidden on main
  if (!galleryKitchen || !galleryWardrobes) return;

  const KEY = 'hillman_portfolio_items_v2';
  let items = [];
  let activeCategory = 'all';

  // Keep admin panel hidden on the public page (admin UI lives at /admin/)
  if (panel) panel.hidden = true;

  function load(){
    try{ items = JSON.parse(localStorage.getItem(KEY) || '[]'); }catch{ items = []; }
  }
  async function loadRemote(){
    // Optional: server JSON. If not present, skip silently.
    try{
      const res = await fetch('assets/portfolio/items.json', { cache: 'no-store' });
      if (!res.ok) return;
      const remote = await res.json();
      if (Array.isArray(remote)){
        const bySrc = new Set(items.map(it=>it.src));
        remote.forEach(it=>{
          if (it && typeof it.src === 'string' && !bySrc.has(it.src)){
            items.push({ src: it.src, caption: it.caption || '', category: it.category || 'Kitchen' });
          }
        });
      }
    }catch(_e){ /* ignore if missing */ }
  }
  function save(){
    localStorage.setItem(KEY, JSON.stringify(items));
  }

  function renderAdminList(){
    if (!list) return;
    list.innerHTML = '';
    items.forEach((it, idx)=>{
      const row = document.createElement('div');
      row.className = 'admin-item';
      const meta = document.createElement('div');
      meta.className = 'meta';
      const img = document.createElement('img');
      img.className = 'thumb';
      img.src = it.src;
      img.alt = '';
      const cap = document.createElement('span');
      cap.textContent = it.caption || '';
      meta.append(img, cap);
      const del = document.createElement('button');
      del.type = 'button';
      del.textContent = 'Delete';
      del.addEventListener('click', ()=>{
        items.splice(idx,1);
        save();
        renderAdminList();
        renderGallery();
      });
      row.append(meta, del);
      list.append(row);
    });
  }

  function createFigure(it, idx){
    const fig = document.createElement('figure');
    fig.className = 'gallery-item';
    const img = document.createElement('img');
    img.className = 'lightbox-trigger';
    img.dataset.index = String(idx);
    img.src = it.src;
    img.alt = it.caption || 'Work photo';
    img.loading = 'lazy';
    const cap = document.createElement('figcaption');
    cap.textContent = it.caption || '';
    fig.append(img, cap);
    return fig;
  }

  function renderGallery(){
    galleryKitchen.innerHTML = '';
    galleryWardrobes.innerHTML = '';
    const kitchenItems = items.filter(it => it.category === 'Kitchen');
    const wardrobeItems = items.filter(it => it.category === 'Wardrobes');
    kitchenItems.forEach((it, i)=>{
      const fig = createFigure(it, i);
      fig.setAttribute('data-dynamic','1');
      galleryKitchen.append(fig);
    });
    wardrobeItems.forEach((it, i)=>{
      const fig = createFigure(it, i);
      fig.setAttribute('data-dynamic','1');
      galleryWardrobes.append(fig);
    });
    // Rebind lightbox triggers
    const evt = new Event('rebind-lightbox');
    document.dispatchEvent(evt);
  }

  // Lightbox rebind hook: handled in lightbox IIFE

  async function fileToDataUrl(file){
    return new Promise((resolve, reject)=>{
      const reader = new FileReader();
      reader.onload = ()=> resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    let src = (urlInput && urlInput.value || '').trim();
    if (!src && fileInput && fileInput.files && fileInput.files[0]){
      src = await fileToDataUrl(fileInput.files[0]);
    }
    const caption = (captionInput && captionInput.value || '').trim();
    const category = (categoryInput && categoryInput.value) || 'Kitchen';
    if (!src){
      alert('Please select an image or paste an image URL');
      return;
    }
    items.push({ src, caption, category });
    save();
    renderAdminList();
    renderGallery();
    if (form) form.reset();
  });

  btnExport && btnExport.addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio-items.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  btnImport && btnImport.addEventListener('click', async ()=>{
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'application/json';
    picker.onchange = async ()=>{
      const file = picker.files && picker.files[0];
      if (!file) return;
      const text = await file.text();
      try{
        const data = JSON.parse(text);
        if (Array.isArray(data)){
          items = data.filter(it => it && typeof it.src === 'string').map(it => ({ src: it.src, caption: it.caption || '', category: it.category || 'Kitchen' }));
          save();
          renderAdminList();
          renderGallery();
        } else {
          alert('Invalid JSON format');
        }
      }catch(err){
        alert('Failed to parse JSON');
      }
    };
    picker.click();
  });

  // init
  load();
  loadRemote().then(()=>{
    renderAdminList();
    renderGallery();
  });
})();

