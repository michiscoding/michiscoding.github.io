//max width onload
function setWidth() {
  const screenWidth = window.innerWidth;
  const isMobile = screenWidth <= 768;
  const maxWidth = isMobile ? screenWidth * 0.65 : screenWidth * 0.67;
  const marginRight = isMobile ? 0 : screenWidth * 0.3;

  document.documentElement.style.setProperty('--maxWidth', `${maxWidth}px`);
  document.documentElement.style.setProperty('--marginRight', `${marginRight}px`);
}

const rootFontSize = getComputedStyle(document.documentElement).fontSize;
console.log(`1rem is equal to: ${rootFontSize}`);


//reset on load and on resize
window.addEventListener('load', setWidth);
window.addEventListener('resize', setWidth);

//fade in 
document.addEventListener('DOMContentLoaded', () => {
  document.body.style.opacity = '1';
  setWidth();
  const backBtn = document.querySelector('.back-btn');
  if (backBtn) setTimeout(() => { backBtn.style.opacity = '1'; }, 150);
  setTimeout(() => document.body.classList.add('transitions-enabled'), 500);
});

//masonry grid
document.addEventListener("DOMContentLoaded", function() {
    var gridElem = document.querySelector('.grid');
    if (gridElem) {
      imagesLoaded(gridElem, function() {
        new Masonry(gridElem, {
          itemSelector: '.grid-item',
          columnWidth: '.grid-sizer',
          percentPosition: true,
        });
      });
    }
  });

//nav button
//fade out
function hideButton(element) {
  let opacity = 1;
  let intervalID = setInterval(function() {
    if (opacity > 0) {
      opacity -= 0.1;
      element.style.opacity = opacity;
    } else {
      clearInterval(intervalID);
    }
  }, 40);
}

//fade in
function showButton(element) {
  let opacity = 0;
  let intervalID = setInterval(function() {
    if (opacity < 1) {
      opacity += 0.1;
      element.style.opacity = opacity;
    } else {
      clearInterval(intervalID);
    }
  }, 40);
}

// dark mode
(function() {
  if (localStorage.getItem('dark') === '1') document.body.classList.add('dark');
})();

//inject shared nav
fetch('/nav.html')
  .then(res => res.text())
  .then(html => {
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.insertBefore(container, document.body.firstChild);

    const burgerBtn = document.getElementById('burger-btn');
    const burgerIcon = document.getElementById('burger-icon');
    const closeIcon = document.getElementById('close-icon');
    const navMenu = document.querySelector('.nav-menu');
    navMenu.style.opacity = 0;
    let navOpen = false;

    burgerBtn.addEventListener('click', () => {
      navOpen = !navOpen;
      burgerIcon.style.opacity = navOpen ? '0' : '1';
      closeIcon.style.opacity = navOpen ? '1' : '0';
      if (navOpen) {
        navMenu.style.pointerEvents = 'auto';
        showButton(navMenu);
      } else {
        navMenu.style.pointerEvents = 'none';
        hideButton(navMenu);
        const workSub = document.getElementById('work-sub');
        if (workSub) workSub.classList.remove('open');
      }
    });

    const workToggle = document.getElementById('work-toggle');
    const workSub = document.getElementById('work-sub');
    if (workToggle) {
      workToggle.addEventListener('click', () => {
        workSub.classList.toggle('open');
      });
    }

    const homeBtn = document.getElementById('home-btn');
    const eyeToggle = document.getElementById('eye-toggle');
    const isHome = window.location.pathname === '/' || window.location.pathname.endsWith('home.html');
    const hasBackBtn = document.querySelector('.back-btn');
    if (isHome) {
      if (eyeToggle) eyeToggle.style.display = 'block';
    } else if (!hasBackBtn) {
      if (homeBtn) homeBtn.style.display = 'block';
    }

    // wire eye toggle here since it's injected async
    const filterPills = document.getElementById('filter-pills');
    const eyeOpen = document.getElementById('eye-open');
    const eyeClosed = document.getElementById('eye-closed');
    if (eyeToggle && filterPills) {
      eyeToggle.addEventListener('click', () => {
        const isOpen = filterPills.classList.toggle('open');
        eyeOpen.style.opacity = isOpen ? '0' : '1';
        eyeClosed.style.opacity = isOpen ? '1' : '0';
      });
    }

    const darkToggle = document.getElementById('dark-toggle');
    if (darkToggle) {
      const updateIcon = () => {
        darkToggle.textContent = document.body.classList.contains('dark') ? '☀︎' : '☾';
      };
      updateIcon();
      darkToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark');
        localStorage.setItem('dark', isDark ? '1' : '0');
        updateIcon();
      });
    }
  });


// filter pills + password
document.addEventListener('DOMContentLoaded', () => {
  const pills = document.querySelectorAll('.filter-pill[data-filter]');
  if (!pills.length) return;


  const modal = document.getElementById('password-modal');
  const input = document.getElementById('pw-input');
  const error = document.getElementById('pw-error');
  let pendingFilter = null;

  const OWNER_PW = 'pumkin';
  const VIEWER_PW = 'raymond';
  const OWNER_KEY = 'michi_owner';

  function isOwner() {
    return localStorage.getItem(OWNER_KEY) === 'yes';
  }

  function setActive(filter) {
    pills.forEach(p => p.classList.toggle('active', p.dataset.filter === filter));
  }

  function openModal(filter) {
    pendingFilter = filter;
    input.value = '';
    error.textContent = '';
    modal.classList.add('open');
    setTimeout(() => input.focus(), 50);
  }

  function closeModal() {
    modal.classList.remove('open');
    pendingFilter = null;
  }

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const filter = pill.dataset.filter;
      if (filter === 'home') {
        setActive('home');
        return;
      }
      if (isOwner()) {
        setActive(filter);
        return;
      }
      openModal(filter);
    });
  });

  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const val = input.value.trim().toLowerCase();
    if (val === OWNER_PW) {
      localStorage.setItem(OWNER_KEY, 'yes');
      setActive(pendingFilter);
      closeModal();
    } else if (val === VIEWER_PW) {
      setActive(pendingFilter);
      closeModal();
    } else {
      error.textContent = 'try again';
      input.value = '';
    }
  });

  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });
});

//music player

//play
function playMusic() {
  const play = document.getElementById('play');
  const pause = document.getElementById('pause');
  const audio = document.getElementById('audio');
  const labels = document.querySelector('.music-label-container');

  audio.play();
  play.style.opacity = '0';
  play.style.pointerEvents = 'none';
  pause.style.opacity = '1';
  pause.style.pointerEvents = 'auto';
  pause.classList.add('spinning');
  labels.classList.add('visible');
}

// entry gallery + lightbox
document.addEventListener('DOMContentLoaded', () => {
  const gallery = document.querySelector('.entry-gallery');
  if (!gallery) return;

  const track = gallery.querySelector('.gallery-track');
  const items = Array.from(track.querySelectorAll('.entry-gallery-item'));
  const galleryPrev = gallery.querySelector('.gallery-prev');
  const galleryNext = gallery.querySelector('.gallery-next');
  const perPage = 3;
  let page = 0;
  const totalPages = Math.ceil(items.length / perPage);

  function showPage(p) {
    page = p;
    items.forEach((item, i) => {
      item.style.display = (i >= page * perPage && i < (page + 1) * perPage) ? '' : 'none';
    });
    galleryPrev.classList.toggle('hidden', page === 0);
    galleryNext.classList.toggle('hidden', page >= totalPages - 1);
  }

  galleryPrev.addEventListener('click', () => showPage(page - 1));
  galleryNext.addEventListener('click', () => showPage(page + 1));
  showPage(0);

  // lightbox
  const allImgs = items.map(item => item.querySelector('img, video'));
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `
    <button class="lb-close">×</button>
    <button class="lb-prev">←</button>
    <img id="lb-media">
    <button class="lb-next">→</button>
  `;
  document.body.appendChild(lb);

  const lbMedia = lb.querySelector('#lb-media');
  const lbClose = lb.querySelector('.lb-close');
  const lbPrev = lb.querySelector('.lb-prev');
  const lbNext = lb.querySelector('.lb-next');
  let lbIdx = 0;

  function openLightbox(idx) {
    lbIdx = idx;
    lbMedia.src = allImgs[idx].src;
    lb.classList.add('open');
    lbPrev.classList.toggle('hidden', idx === 0);
    lbNext.classList.toggle('hidden', idx === allImgs.length - 1);
  }

  allImgs.forEach((img, i) => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => openLightbox(i));
  });

  lbClose.addEventListener('click', () => lb.classList.remove('open'));
  lb.addEventListener('click', e => { if (e.target === lb) lb.classList.remove('open'); });
  lbPrev.addEventListener('click', e => { e.stopPropagation(); openLightbox(lbIdx - 1); });
  lbNext.addEventListener('click', e => { e.stopPropagation(); openLightbox(lbIdx + 1); });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') lb.classList.remove('open');
    if (e.key === 'ArrowLeft' && lbIdx > 0) openLightbox(lbIdx - 1);
    if (e.key === 'ArrowRight' && lbIdx < allImgs.length - 1) openLightbox(lbIdx + 1);
  });
});

//pause
function pauseMusic() {
  const play = document.getElementById('play');
  const pause = document.getElementById('pause');
  const audio = document.getElementById('audio');
  const labels = document.querySelector('.music-label-container');

  audio.pause();
  pause.style.opacity = '0';
  pause.style.pointerEvents = 'none';
  pause.classList.remove('spinning');
  play.style.opacity = '1';
  play.style.pointerEvents = 'auto';
  labels.classList.remove('visible');
}

