(() => {
  // Build 33: use the approved first hero plus ORIGINAL dhoti photos only.
  // No generated website screenshots are used, so there are no baked-in arrows, dots or text.
  const slides = [
    { src: '/assets/hero-scroll-1.jpg', alt: 'Nivetha Dhotis premium collection hero', cover: true },
    { src: '/assets/hero-dhoti-1.png', alt: 'Orange and gold border dhoti' },
    { src: '/assets/hero-dhoti-2.png', alt: 'Black border dhoti' },
    { src: '/assets/hero-dhoti-3.png', alt: 'Green border dhoti' },
    { src: '/assets/hero-dhoti-4.png', alt: 'Cream and gold border dhoti' },
    { src: '/assets/hero-dhoti-5.png', alt: 'Green and gold border dhoti' },
    { src: '/assets/hero-dhoti-6.png', alt: 'Black line designer border dhoti' }
  ];

  const init = () => {
    const hero = document.getElementById('heroImage');
    const wrap = document.getElementById('heroSlides');
    const dotsWrap = document.getElementById('heroDots');
    const prev = document.getElementById('heroPrev');
    const next = document.getElementById('heroNext');
    if (!hero || !wrap || !dotsWrap || !prev || !next) return;

    wrap.replaceChildren(); dotsWrap.replaceChildren();
    let current = 0, timer;
    slides.forEach((s, i) => {
      const frame = document.createElement('div');
      frame.className = 'hero-frame' + (i === 0 ? ' active first' : '');
      const img = document.createElement('img');
      img.className = 'hero-product-photo' + (s.cover ? ' cover' : '');
      img.src = s.src; img.alt = s.alt; img.draggable = false;
      img.loading = i < 2 ? 'eager' : 'lazy';
      frame.appendChild(img); wrap.appendChild(frame);
      const dot = document.createElement('button');
      dot.type='button'; dot.className='hero-dot' + (i===0?' active':'');
      dot.setAttribute('aria-label', `Show slide ${i+1} of ${slides.length}`);
      dot.onclick=()=>{ show(i); restart(); }; dotsWrap.appendChild(dot);
    });
    const frames=[...wrap.querySelectorAll('.hero-frame')];
    const dots=[...dotsWrap.querySelectorAll('.hero-dot')];
    function show(i){ current=(i+slides.length)%slides.length; frames.forEach((f,n)=>f.classList.toggle('active',n===current)); dots.forEach((d,n)=>d.classList.toggle('active',n===current)); }
    function restart(){ clearInterval(timer); timer=setInterval(()=>show(current+1),5000); }
    prev.onclick=()=>{show(current-1);restart()}; next.onclick=()=>{show(current+1);restart()};
    hero.onmouseenter=()=>clearInterval(timer); hero.onmouseleave=restart;
    let sx=0; hero.addEventListener('touchstart',e=>sx=e.changedTouches[0].clientX,{passive:true});
    hero.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>45){show(dx>0?current-1:current+1);restart()}},{passive:true});
    show(0); restart();
  };
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();