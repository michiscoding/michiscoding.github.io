//max width onload
function setWidth() {
  //print grid margin
  const screenWidth = window.innerWidth;
  const maxWidth = screenWidth*.67;
  const marginRight = screenWidth*.3
  console.log(marginRight);

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

    const burger = document.getElementById('burger');
    const navMenu = document.querySelector('.nav-menu');
    navMenu.style.opacity = 0;

    burger.addEventListener('click', () => {
      if (burger.checked == true) {
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
    if (isHome) {
      if (eyeToggle) eyeToggle.style.display = 'block';
    } else {
      if (homeBtn) homeBtn.style.display = 'block';
    }

    // wire eye toggle here since it's injected async
    const filterPills = document.getElementById('filter-pills');
    const eyeOpen = document.getElementById('eye-open');
    const eyeClosed = document.getElementById('eye-closed');
    if (eyeToggle && filterPills) {
      eyeToggle.addEventListener('click', () => {
        const isOpen = filterPills.classList.toggle('open');
        eyeOpen.style.display = isOpen ? 'none' : 'block';
        eyeClosed.style.display = isOpen ? 'block' : 'none';
      });
    }

    const darkToggle = document.getElementById('dark-toggle');
    if (darkToggle) {
      darkToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark');
        localStorage.setItem('dark', isDark ? '1' : '0');
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

