// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const primaryMenu = document.getElementById('primaryMenu');
if (menuToggle && primaryMenu) {
  menuToggle.addEventListener('click', () => {
    const open = primaryMenu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
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

  const triggers = Array.from(document.querySelectorAll('.lightbox-trigger'));
  const sources = triggers.map(el => el.getAttribute('src'));
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

  triggers.forEach((el, idx) => {
    el.addEventListener('click', (e) => { e.preventDefault(); open(idx); });
  });
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

