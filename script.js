// Mobile menu toggle
const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('site-nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
}
// Back to top
document.querySelectorAll('.back-to-top').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}));
// Current year in footer
document.querySelectorAll('.year').forEach(el => el.textContent = new Date().getFullYear());
// Close mobile menu with Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && nav && nav.classList.contains('open')) {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.focus();
  }
});

// Autoplay videos only while on screen, so they never slow the first page load
const autoVideos = document.querySelectorAll('video.autoplay-video');
if (autoVideos.length) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    autoVideos.forEach(v => { v.controls = true; });
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) { target.play().catch(() => { target.controls = true; }); }
        else { target.pause(); }
      });
    }, { threshold: 0.35 });
    autoVideos.forEach(v => io.observe(v));
  }
}

// Project cover videos: play only while the cursor is over the card, rewind on leave
const hoverVideos = document.querySelectorAll('video.hover-video');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
hoverVideos.forEach(v => {
  const card = v.closest('.project-card') || v;
  card.addEventListener('mouseenter', () => {
    if (reduceMotion.matches) return;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  });
  card.addEventListener('mouseleave', () => {
    v.pause();
    v.currentTime = 0;
  });
});
