(() => {
  const slides = [
    { src: 'assets/hero-right.jpg', alt: 'Nivetha Dhoti premium collection', mode: 'cover' },
    { src: 'assets/hero-dhoti-1.png', alt: 'White dhoti with orange and gold zari border', mode: 'contain' },
    { src: 'assets/hero-dhoti-2.png', alt: 'White dhoti with black border', mode: 'contain' },
    { src: 'assets/hero-dhoti-3.png', alt: 'White dhoti with teal green border', mode: 'contain' },
    { src: 'assets/hero-dhoti-4.png', alt: 'White dhoti with cream and gold zari border', mode: 'contain' },
    { src: 'assets/hero-dhoti-5.png', alt: 'White dhoti with green and gold border', mode: 'contain' },
    { src: 'assets/hero-dhoti-6.png', alt: 'White dhoti with fine black stripe border', mode: 'contain' }
  ];

  const init = () => {
    const hero = document.getElementById('heroImage');
    const slidesWrap = document.getElementById('heroSlides');
    const dotsWrap = document.getElementById('heroDots');
    const previous = document.getElementById('heroPrev');
    const next = document.getElementById('heroNext');
    if (!hero || !slidesWrap || !dotsWrap || !previous || !next) return;

    let current = 0;
    let timer = null;

    slides.forEach((slide, index) => {
      const img = document.createElement('img');
      img.src = slide.src;
      img.alt = slide.alt;
      img.className = `hero-slide hero-slide-${slide.mode}${index === 0 ? ' active' : ''}`;
      img.loading = index === 0 ? 'eager' : 'lazy';
      if (index === 0) img.fetchPriority = 'high';
      slidesWrap.appendChild(img);

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `hero-dot${index === 0 ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Show hero image ${index + 1}`);
      dot.addEventListener('click', () => {
        show(index);
        restart();
      });
      dotsWrap.appendChild(dot);
    });

    const images = [...slidesWrap.querySelectorAll('.hero-slide')];
    const dots = [...dotsWrap.querySelectorAll('.hero-dot')];

    const show = index => {
      current = (index + slides.length) % slides.length;
      images.forEach((image, imageIndex) => image.classList.toggle('active', imageIndex === current));
      dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === current));
      hero.classList.toggle('hero-first-slide', current === 0);
    };

    const restart = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => show(current + 1), 4500);
    };

    previous.addEventListener('click', () => {
      show(current - 1);
      restart();
    });
    next.addEventListener('click', () => {
      show(current + 1);
      restart();
    });

    hero.addEventListener('mouseenter', () => window.clearInterval(timer));
    hero.addEventListener('mouseleave', restart);

    let touchStartX = 0;
    hero.addEventListener('touchstart', event => {
      touchStartX = event.changedTouches[0]?.clientX || 0;
    }, { passive: true });
    hero.addEventListener('touchend', event => {
      const endX = event.changedTouches[0]?.clientX || 0;
      const distance = endX - touchStartX;
      if (Math.abs(distance) > 45) {
        show(distance > 0 ? current - 1 : current + 1);
        restart();
      }
    }, { passive: true });

    show(0);
    restart();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
