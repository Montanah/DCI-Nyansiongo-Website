document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initHeaderScroll();
  initFooterYear();
  initReveal();
  initHero();
  initEventsCarousel();
  initSermonSearch();
  initContactForm();
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

  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  items.forEach((el) => observer.observe(el));
}

/* Rotating hero background, crossfading between two layered slides */
function initHero() {
  const media = document.querySelector('.hero-media');
  if (!media) return;

  const slideA = media.querySelector('.hero-slide:nth-child(1)');
  const slideB = media.querySelector('.hero-slide:nth-child(2)');
  if (!slideA || !slideB) return;

  const totalImages = 22;
  const images = Array.from({ length: totalImages }, (_, i) => `/images/BgImg${i + 1}.webp`);

  images.forEach((src) => {
    const preload = new Image();
    preload.src = src;
  });

  let index = 3 % images.length;
  slideA.style.backgroundImage = `url(${images[index]})`;
  slideA.classList.add('is-active');
  let showingA = true;

  setInterval(() => {
    index = (index + 1) % images.length;
    const next = showingA ? slideB : slideA;
    const current = showingA ? slideA : slideB;
    next.style.backgroundImage = `url(${images[index]})`;
    next.classList.add('is-active');
    current.classList.remove('is-active');
    showingA = !showingA;
  }, 5000);
}

/* Accessible events carousel: buttons, dots, keyboard arrows, touch/pointer swipe */
function initEventsCarousel() {
  const track = document.getElementById('eventsTrack');
  const dotsWrap = document.getElementById('eventsDots');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');
  if (!track || !dotsWrap || !prevBtn || !nextBtn) return;

  const slides = Array.from(track.children);
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
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === slides.length - 1;
  }

  function goTo(target) {
    index = Math.max(0, Math.min(slides.length - 1, target));
    update();
  }

  prevBtn.addEventListener('click', () => goTo(index - 1));
  nextBtn.addEventListener('click', () => goTo(index + 1));

  const viewport = track.parentElement;
  viewport.setAttribute('tabindex', '0');
  viewport.setAttribute('role', 'group');
  viewport.setAttribute('aria-roledescription', 'carousel');
  viewport.setAttribute('aria-label', 'Upcoming and past events');
  viewport.addEventListener('keydown', (event) => {
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

  update();
}

/* Client-side title search for the sermon grid */
function initSermonSearch() {
  const input = document.getElementById('sermonSearch');
  const grid = document.getElementById('sermonGrid');
  const empty = document.getElementById('sermonEmpty');
  if (!input || !grid) return;

  const cards = Array.from(grid.querySelectorAll('.sermon-card'));

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach((card) => {
      const title = (card.dataset.title || card.textContent).toLowerCase();
      const isMatch = title.includes(query);
      card.hidden = !isMatch;
      if (isMatch) visibleCount += 1;
    });

    if (empty) empty.hidden = visibleCount !== 0;
  });
}

/* Contact form submission via Web3Forms (static-site friendly, no backend needed) */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  if (!form || !status) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    status.textContent = 'Sending…';
    status.className = 'form-status';

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });

      const result = await response.json();

      if (result.success) {
        status.textContent = "Thank you! We've received your message and will be in touch soon.";
        status.classList.add('is-success');
        form.reset();
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (error) {
      status.textContent = 'Sorry, your message could not be sent right now. Please try again or call us directly.';
      status.classList.add('is-error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}
