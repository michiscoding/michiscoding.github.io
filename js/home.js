window.addEventListener('load', function() {
  document.body.style.opacity = '1';
});

//masonry grid
document.addEventListener("DOMContentLoaded", function() {
    var gridElem = document.querySelector('.grid');
    var msnry = new Masonry(gridElem, {
      // options
      itemSelector: '.grid-item',
      columnWidth: '.grid-sizer',   // matches the class of your sizer
      percentPosition: true         // if you use percentage widths
    });
  });

//nav button
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
