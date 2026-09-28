document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initHeaderScroll();
  initFooterYear();
  initReveal();
  initEventsCarousel();
  initSermonSearch();
  initAudioPlayers();
});

/* Mobile nav toggle */
function initNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('primaryNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (!nav.contains(event.target) && !toggle.contains(event.target)) {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/* Header shadow once the page has scrolled */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* Footer copyright year */
function initFooterYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

/* Fade-in-on-scroll for elements marked .reveal */
function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-pending');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  items.forEach((el) => {
    el.classList.add('is-pending');
    observer.observe(el);
  });
}

/* Accessible events carousel: buttons, dots, keyboard arrows, touch/pointer swipe */
function initEventsCarousel() {
  const track = document.getElementById('eventsTrack');
  const dotsWrap = document.getElementById('eventsDots');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  if (!track || !dotsWrap || !prevBtn || !nextBtn) return;

  const slides = Array.from(track.children);
  const viewport = track.parentElement;
  let index = 0;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Go to event ${i + 1} of ${slides.length}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
      dot.setAttribute('aria-current', String(i === index));
    });
    slides.forEach((slide, i) => {
      slide.inert = i !== index;
      slide.setAttribute('aria-hidden', String(i !== index));
      slide.setAttribute('aria-label', `Event ${i + 1} of ${slides.length}`);
    });
    viewport.style.height = `${slides[index].offsetHeight}px`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === slides.length - 1;
  }

  function goTo(target) {
    index = Math.max(0, Math.min(slides.length - 1, target));
    update();
  }

  prevBtn.addEventListener('click', () => goTo(index - 1));
  nextBtn.addEventListener('click', () => goTo(index + 1));

  viewport.setAttribute('tabindex', '0');
  viewport.setAttribute('role', 'group');
  viewport.setAttribute('aria-roledescription', 'carousel');
  viewport.setAttribute('aria-label', 'Past church gatherings; use the left and right arrow keys to browse');
  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') event.preventDefault();
    if (event.key === 'ArrowLeft') goTo(index - 1);
    if (event.key === 'ArrowRight') goTo(index + 1);
  });

  let startX = null;
  track.addEventListener('pointerdown', (event) => {
    startX = event.clientX;
  });
  track.addEventListener('pointerup', (event) => {
    if (startX === null) return;
    const diff = startX - event.clientX;
    if (Math.abs(diff) > 50) goTo(diff > 0 ? index + 1 : index - 1);
    startX = null;
  });
  track.addEventListener('pointercancel', () => { startX = null; });

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => {
      viewport.style.height = `${slides[index].offsetHeight}px`;
    });
    slides.forEach((slide) => observer.observe(slide));
  } else {
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('load', update);
  }
  update();
}

/* Client-side title search for the sermon grid */
function initSermonSearch() {
  const input = document.getElementById('sermonSearch');
  const grid = document.getElementById('sermonGrid');
  const empty = document.getElementById('sermonEmpty');
  const count = document.getElementById('sermonCount');
  if (!input || !grid) return;

  const cards = Array.from(grid.querySelectorAll('.sermon-card'));

  const filter = () => {
    const query = input.value.trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach((card) => {
      const title = (card.dataset.title || card.textContent).toLowerCase();
      const isMatch = title.includes(query);
      card.hidden = !isMatch;
      if (isMatch) visibleCount += 1;
    });

    if (empty) empty.hidden = visibleCount !== 0;
    if (count) count.textContent = query
      ? `${visibleCount} of ${cards.length} sermons found`
      : `${cards.length} messages to encourage your faith`;
  };
  input.addEventListener('input', filter);
  filter();
}

/* Keep recordings from playing over each other. */
function initAudioPlayers() {
  const players = document.querySelectorAll('audio');
  players.forEach((player) => {
    player.addEventListener('play', () => {
      players.forEach((other) => {
        if (other !== player) other.pause();
      });
    });
  });
}
