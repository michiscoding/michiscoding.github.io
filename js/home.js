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
        const consumptionSub = document.getElementById('consumption-sub');
        if (consumptionSub) consumptionSub.classList.remove('open');
      }
    });

    const workSub = document.getElementById('work-sub');

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
    const modal = document.getElementById('password-modal');
    const pwInput = document.getElementById('pw-input');
    const pwError = document.getElementById('pw-error');
    const OWNER_PW = 'pumkin';
    const VIEWER_PW = 'raymond';
    const OWNER_KEY = 'michi_owner';
    const UNLOCKED_KEY = 'michi_unlocked';

    if (eyeToggle && filterPills) {
      eyeToggle.addEventListener('click', () => {
        const alreadyUnlocked = localStorage.getItem(UNLOCKED_KEY) === 'yes';
        if (alreadyUnlocked) {
          const isOpen = filterPills.classList.toggle('open');
          eyeOpen.style.opacity = isOpen ? '0' : '1';
          eyeClosed.style.opacity = isOpen ? '1' : '0';
        } else {
          // show password modal
          pwInput.value = '';
          pwError.textContent = '';
          modal.classList.add('open');
          setTimeout(() => pwInput.focus(), 50);
        }
      });

      if (pwInput) {
        pwInput.addEventListener('keydown', e => {
          if (e.key !== 'Enter') return;
          const val = pwInput.value.trim().toLowerCase();
          if (val === OWNER_PW) {
            localStorage.setItem(OWNER_KEY, 'yes');
            localStorage.setItem(UNLOCKED_KEY, 'yes');
            modal.classList.remove('open');
            filterPills.classList.add('open');
            eyeOpen.style.opacity = '0';
            eyeClosed.style.opacity = '1';
          } else if (val === VIEWER_PW) {
            localStorage.setItem(UNLOCKED_KEY, 'yes');
            modal.classList.remove('open');
            filterPills.classList.add('open');
            eyeOpen.style.opacity = '0';
            eyeClosed.style.opacity = '1';
          } else {
            pwError.textContent = 'try again';
            pwInput.value = '';
          }
        });

        modal.addEventListener('click', e => {
          if (e.target === modal) modal.classList.remove('open');
        });
      }
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

  const grid = document.querySelector('.grid');
  const gallery365 = document.getElementById('gallery-365');
  let gallery365Loaded = false;
  let photosCache = null;
  let masonryInstance = null;

  // custom lightbox
  const lb = document.createElement('div');
  lb.id = 'media-lb';
  document.body.appendChild(lb);
  lb.addEventListener('click', closeLb);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });

  const PLAY_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
  const PAUSE_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;

  function openLb(src, sourceVid) {
    lb._sourceVid = sourceVid || null;
    if (sourceVid) sourceVid.pause();
    lb.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'lb-wrap';
    wrap.addEventListener('click', e => e.stopPropagation());

    const video = document.createElement('video');
    video.src = src;
    video.className = 'lb-media';
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.muted = false;

    const controls = document.createElement('div');
    controls.className = 'lb-controls';

    const playBtn = document.createElement('button');
    playBtn.className = 'lb-play-btn';
    playBtn.innerHTML = PAUSE_ICON;
    playBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (video.paused) { video.play(); } else { video.pause(); }
    });
    video.addEventListener('play', () => { playBtn.innerHTML = PAUSE_ICON; });
    video.addEventListener('pause', () => { playBtn.innerHTML = PLAY_ICON; });

    const scrubber = document.createElement('input');
    scrubber.type = 'range';
    scrubber.className = 'lb-scrubber';
    scrubber.min = 0; scrubber.max = 100; scrubber.value = 0;
    scrubber.addEventListener('click', e => e.stopPropagation());
    scrubber.addEventListener('input', () => {
      if (video.duration) video.currentTime = (scrubber.value / 100) * video.duration;
    });
    video.addEventListener('timeupdate', () => {
      if (video.duration) scrubber.value = (video.currentTime / video.duration) * 100;
    });

    controls.appendChild(playBtn);
    controls.appendChild(scrubber);
    wrap.appendChild(video);
    wrap.appendChild(controls);
    lb.appendChild(wrap);
    requestAnimationFrame(() => lb.classList.add('open'));
  }

  function closeLb() {
    lb.classList.remove('open');
    if (lb._sourceVid) { lb._sourceVid.play(); lb._sourceVid = null; }
    setTimeout(() => { lb.innerHTML = ''; }, 300);
  }

  function setActive(filter) {
    pills.forEach(p => p.classList.toggle('active', p.dataset.filter === filter));
  }

  function fadeOutEl(el, cb) {
    if (!el || el.style.display === 'none') { if (cb) cb(); return; }
    el.style.opacity = '0';
    setTimeout(() => { el.style.display = 'none'; if (cb) cb(); }, 300);
  }

  function fadeInEl(el, displayVal) {
    if (!el) return;
    el.style.display = displayVal || '';
    el.style.opacity = '0';
    requestAnimationFrame(() => requestAnimationFrame(() => { el.style.opacity = '1'; }));
  }

  async function getPhotos() {
    if (photosCache) return photosCache;
    const MEDIA_BASE = SUPABASE_URL + '/storage/v1/object/public/media/';
    const { data } = await db.from('photos').select('storage_path, tags, date').order('date', { ascending: false });
    photosCache = (data || []).map(p => ({
      src: p.storage_path.startsWith('http') ? p.storage_path : MEDIA_BASE + p.storage_path,
      tags: p.tags || [],
      date: p.date,
    }));
    return photosCache;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  async function renderGrid(filter) {
    const photos = await getPhotos();

    let filtered;
    if (filter === 'all') {
      filtered = [...photos].sort((a, b) => b.date.localeCompare(a.date));
    } else if (filter === 'random' || filter === 'home') {
      const pool = filter === 'home'
        ? photos.filter(p => p.tags && p.tags.includes('home'))
        : photos;
      filtered = shuffle(pool);
    } else {
      filtered = photos
        .filter(p => p.tags && p.tags.includes(filter))
        .sort((a, b) => b.date.localeCompare(a.date));
    }

    // clear existing items (keep grid-sizer)
    const existing = grid.querySelectorAll('.grid-item');
    existing.forEach(el => el.remove());
    if (masonryInstance) { masonryInstance.destroy(); masonryInstance = null; }

    if (!filtered.length) return;

    const ICON_MUTED = `<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="17" y1="9" x2="23" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>`;
    const ICON_SOUND = `<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
    const ICON_FS = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;

    const fragment = document.createDocumentFragment();
    filtered.forEach(photo => {
      const item = document.createElement('div');
      item.className = 'grid-item';
      const isVid = /\.(mp4|webm|mov)$/i.test(photo.src) || photo.src.includes('cloudinary.com');
      const media = document.createElement(isVid ? 'video' : 'img');
      media.className = 'img';
      media.src = photo.src;
      if (isVid) { media.muted = true; media.autoplay = true; media.loop = true; media.playsInline = true; }

      const wrap = document.createElement('div');
      wrap.className = 'media-wrap';
      wrap.appendChild(media);

      if (isVid) {
        media.addEventListener('loadeddata', () => wrap.classList.add('loaded'), { once: true });
      } else {
        if (media.complete && media.naturalWidth) { wrap.classList.add('loaded'); }
        else { media.addEventListener('load', () => wrap.classList.add('loaded'), { once: true }); }
      }

      if (isVid) {
        const fsBtn = document.createElement('button');
        fsBtn.className = 'fs-btn';
        fsBtn.innerHTML = ICON_FS;
        fsBtn.addEventListener('click', e => {
          e.stopPropagation();
          openLb(photo.src, media);
        });
        wrap.appendChild(fsBtn);
      }

      if (isVid) {
        const soundBtn = document.createElement('button');
        soundBtn.className = 'sound-btn';
        soundBtn.innerHTML = ICON_MUTED;
        soundBtn.addEventListener('click', e => {
          e.stopPropagation();
          media.muted = !media.muted;
          soundBtn.innerHTML = media.muted ? ICON_MUTED : ICON_SOUND;
        });
        wrap.appendChild(soundBtn);
      }

      item.appendChild(wrap);
      fragment.appendChild(item);
    });
    grid.appendChild(fragment);

    return new Promise(resolve => {
      imagesLoaded(grid, () => {
        masonryInstance = new Masonry(grid, {
          itemSelector: '.grid-item',
          columnWidth: '.grid-sizer',
          percentPosition: true,
        });
        grid.querySelectorAll('video').forEach(v => {
          if (v.readyState >= 1) { masonryInstance.layout(); }
          else { v.addEventListener('loadedmetadata', () => masonryInstance.layout(), { once: true }); }
        });
        resolve();
      });
    });
  }

  function showView(filter) {
    if (filter === '365') {
      fadeOutEl(grid, () => {
        gallery365.style.display = 'grid';
        gallery365.style.opacity = '0';
        load365();
      });
    } else {
      // fade out whatever is visible, then rebuild grid and fade in
      const doRender = () => {
        grid.style.display = '';
        grid.style.opacity = '0';
        renderGrid(filter).then(() => {
          requestAnimationFrame(() => requestAnimationFrame(() => {
            grid.style.opacity = '1';
          }));
        });
      };

      const gallery365Visible = gallery365 && gallery365.style.display !== 'none' && gallery365.style.display !== '';
      if (gallery365Visible) {
        fadeOutEl(gallery365, doRender);
      } else {
        // grid is visible — fade it out first
        grid.style.opacity = '0';
        setTimeout(doRender, 300);
      }
    }
  }

  async function load365() {
    if (gallery365Loaded) {
      requestAnimationFrame(() => requestAnimationFrame(() => { gallery365.style.opacity = '1'; }));
      return;
    }
    gallery365Loaded = true;

    const MEDIA_BASE = SUPABASE_URL + '/storage/v1/object/public/media/';
    const [{ data: rows }, { data: thoughtRows }] = await Promise.all([
      db.from('entry_photos').select('storage_path, entry_date').order('entry_date', { ascending: false }),
      db.from('entries').select('date, thought').not('thought', 'is', null).neq('thought', '')
    ]);

    const byDate = {};
    for (const row of (rows || [])) {
      if (!byDate[row.entry_date]) byDate[row.entry_date] = { photos: [], thought: null };
      byDate[row.entry_date].photos.push(MEDIA_BASE + row.storage_path);
    }
    for (const row of (thoughtRows || [])) {
      if (!byDate[row.date]) byDate[row.date] = { photos: [], thought: null };
      byDate[row.date].thought = row.thought;
    }

    gallery365.innerHTML = '';
    const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

    if (!dates.length) {
      gallery365.innerHTML = '<p style="opacity:0.4;font-size:0.85rem">no photos yet</p>';
      requestAnimationFrame(() => requestAnimationFrame(() => { gallery365.style.opacity = '1'; }));
      return;
    }

    for (const date of dates) {
      const { photos, thought } = byDate[date];
      let idx = 0;

      const card = document.createElement('div');
      card.className = 'card-365';
      card.addEventListener('click', e => {
        if (!e.target.closest('.card-365-btn')) window.location.href = `/entries/view.html?date=${date}`;
      });

      const track = document.createElement('div');
      track.className = 'card-365-track';

      let photosLoaded = false;

      function updateGrain() {
        if (thought && idx === 0) {
          card.classList.remove('loaded');
        } else if (photosLoaded) {
          card.classList.add('loaded');
        }
      }

      // thought slide first
      if (thought) {
        const slide = document.createElement('div');
        slide.className = 'card-365-thought';
        const p = document.createElement('p');
        p.textContent = thought;
        slide.appendChild(p);
        track.appendChild(slide);
      }

      photos.forEach((src, i) => {
        const isVid = /\.(mp4|webm|mov)$/i.test(src);
        const el = document.createElement(isVid ? 'video' : 'img');
        if (isVid) {
          el.muted = true;
          el.autoplay = true;
          el.loop = true;
          el.playsInline = true;
          if (i === 0) el.addEventListener('loadeddata', () => { photosLoaded = true; updateGrain(); }, { once: true });
        } else {
          if (i === 0) {
            const onLoad = () => { photosLoaded = true; updateGrain(); };
            el.addEventListener('load', onLoad, { once: true });
            if (el.complete && el.naturalWidth) onLoad();
          }
        }
        el.src = src;
        track.appendChild(el);
      });

      const ICON_MUTED_365 = `<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/><line x1="17" y1="9" x2="23" y2="15" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>`;
      const ICON_SOUND_365 = `<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;

      const allMedia = Array.from(track.children);
      const hasAnyVideo = allMedia.some(el => el.tagName === 'VIDEO');
      let soundBtn = null;
      if (hasAnyVideo) {
        soundBtn = document.createElement('button');
        soundBtn.className = 'sound-btn';
        soundBtn.innerHTML = ICON_MUTED_365;
        soundBtn.addEventListener('click', e => {
          e.stopPropagation();
          const vid = allMedia[idx];
          if (vid?.tagName !== 'VIDEO') return;
          vid.muted = !vid.muted;
          soundBtn.innerHTML = vid.muted ? ICON_MUTED_365 : ICON_SOUND_365;
        });
        card.appendChild(soundBtn);
      }

      function updateSoundBtn() {
        if (!soundBtn) return;
        const current = allMedia[idx];
        soundBtn.style.display = current?.tagName === 'VIDEO' ? '' : 'none';
        if (current?.tagName === 'VIDEO') soundBtn.innerHTML = current.muted ? ICON_MUTED_365 : ICON_SOUND_365;
      }
      const totalSlides = track.children.length;

      if (photos.length > 1) {
        const photoStart = (thought ? 1 : 0) + Math.floor(Math.random() * photos.length);
        idx = photoStart;
        track.style.transform = `translateX(-${idx * 100}%)`;
      }

      updateSoundBtn();

      const prev = document.createElement('button');
      prev.className = 'card-365-btn card-365-prev';
      prev.textContent = '←';
      prev.addEventListener('click', e => {
        e.stopPropagation();
        idx = (idx - 1 + totalSlides) % totalSlides;
        track.style.transform = `translateX(-${idx * 100}%)`;
        updateSoundBtn();
        updateGrain();
      });

      const next = document.createElement('button');
      next.className = 'card-365-btn card-365-next';
      next.textContent = '→';
      next.addEventListener('click', e => {
        e.stopPropagation();
        idx = (idx + 1) % totalSlides;
        track.style.transform = `translateX(-${idx * 100}%)`;
        updateSoundBtn();
        updateGrain();
      });

      const label = document.createElement('div');
      label.className = 'card-365-label';
      const [yyyy, mm, dd] = date.split('-');
      const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
      label.textContent = `${months[parseInt(mm)-1]} ${parseInt(dd)}`;

      card.appendChild(track);
      if (totalSlides > 1) {
        card.appendChild(prev);
        card.appendChild(next);
      }
      card.appendChild(label);
      gallery365.appendChild(card);
    }

    requestAnimationFrame(() => requestAnimationFrame(() => { gallery365.style.opacity = '1'; }));
  }

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const filter = pill.dataset.filter;
      setActive(filter);
      showView(filter);
    });
  });

  // initial render
  if (grid) {
    grid.style.opacity = '0';
    renderGrid('home').then(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => { grid.style.opacity = '1'; }));
    });
  }
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


// pa slideshow
(function() {
  const slides = document.querySelectorAll('.pa-slide');
  if (slides.length < 2) return;
  let current = 0;
  // set container height to first slide's natural height
  slides[0].style.opacity = '1';
  setInterval(() => {
    slides[current].style.opacity = '0';
    current = (current + 1) % slides.length;
    slides[current].style.opacity = '1';
  }, 3000);
})();
