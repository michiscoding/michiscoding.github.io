//max width onload
function setWidth() {
  //print grid margin
  const element = document.querySelector('.grid'); // Target your element
  const computedStyle = getComputedStyle(element);
  console.log('Computed Margin Top:', computedStyle.marginTop);

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
    var msnry = new Masonry(gridElem, {
      // options
      itemSelector: '.grid-item',
      columnWidth: '.grid-sizer',   // matches the class of sizer
      percentPosition: true,         // use percentage widths
    });
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

//show navigation
document.addEventListener('DOMContentLoaded', () => {
  const burger = document.getElementById('burger');
  const navMenu = document.querySelector('.nav-menu');
  navMenu.style.opacity = 0; 

  burger.addEventListener('click', () => {
    if(burger.checked == true) {
      showButton(navMenu)
    } else {
      hideButton(navMenu);
    }
  });
});


//music player 

//play
function playMusic() {
  const play = document.getElementById('play');
  const pause = document.getElementById('pause');
  const audio = document.getElementById('audio');
  console.log(audio);

  audio.play();
  play.style.visibility = "hidden"
  pause.style.visibility = "visible"
}

//pause 
function pauseMusic() {
  const play = document.getElementById('play');
  const pause = document.getElementById('pause');
  const audio = document.getElementById('audio');

  audio.pause();
  pause.style.visibility = "hidden"
  play.style.visibility = "visible"
}

