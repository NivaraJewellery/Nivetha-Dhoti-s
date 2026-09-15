(() => {
  const slides = [
    { src: '/assets/hero-scroll-1.jpg', alt: 'Nivetha Dhotis premium collection hero' },
    { src: '/assets/hero-scroll-2.jpg', alt: 'Orange and gold border dhoti in a traditional interior' },
    { src: '/assets/hero-scroll-3.jpg', alt: 'Black and gold border dhoti in a carved wood interior' },
    { src: '/assets/hero-scroll-4.jpg', alt: 'Green and gold border dhoti with brass decor' },
    { src: '/assets/hero-scroll-5.jpg', alt: 'Purple and gold border dhoti in a warm heritage setting' },
    { src: '/assets/hero-scroll-6.jpg', alt: 'Blue and gold border dhoti in a traditional setting' },
    { src: '/assets/hero-scroll-7.jpg', alt: 'Black stripe border dhoti in a premium heritage setting' }
  ];

  const init = () => {
    const hero = document.getElementById('heroImage');
    const slidesWrap = document.getElementById('heroSlides');
    const dotsWrap = document.getElementById('heroDots');
    const previous = document.getElementById('heroPrev');
    const next = document.getElementById('heroNext');
    if (!hero || !slidesWrap || !dotsWrap || !previous || !next) return;

    slidesWrap.innerHTML = '';
    dotsWrap.innerHTML = '';

    let current = 0;
    let timer = null;

    slides.forEach((slide, index) => {
      const img = document.createElement('img');
      img.src = slide.src;
      img.alt = slide.alt;
      img.className = `hero-slide hero-slide-cover${index === 0 ? ' active' : ''}`;
      img.loading = index === 0 ? 'eager' : 'lazy';
      if (index === 0) img.fetchPriority = 'high';
      slidesWrap.appendChild(img);

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `hero-dot${index === 0 ? ' active' : ''}`;
      dot.setAttribute('aria-label', `Show dhoti ${index + 1}`);
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
