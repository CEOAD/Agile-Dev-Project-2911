let navToggle = document.querySelector(".nav__toggle");
let navWrapper = document.querySelector(".nav__wrapper");
let navSignup = document.querySelector(".sign__up");
navToggle.addEventListener("click", function () {
  if (navWrapper.classList.contains("active")) {
    this.setAttribute("aria-expanded", "false");
    this.setAttribute("aria-label", "menu");
    navWrapper.classList.remove("active");
  } else {
    navWrapper.classList.add("active");
    this.setAttribute("aria-label", "close menu");
    this.setAttribute("aria-expanded", "true");
  }
});
ReturnToMain = document.querySelector(".return__to__main");
ReturnToMain.addEventListener("click", function () {
    window.location.href = "../Mainpage/Mainpage.html";
});
navSignup.addEventListener("click", function () {
  window.location.href = "../signup_page/signup_page.html";
})

const _C = document.querySelector('.container'),
      N = _C.children.length;

_C.style.setProperty('--n', N)

let x0 = null;
let i = 0;
function unify(e) {return e.changedTouches ? e.changedTouches[0] : e};
function lock(e) {
  x0 = unify(e).clientX;
  _C.classList.toggle('smooth', !(locked = true))
};

function drag(e) {
  e.preventDefault();
  if(locked) {
    if(x0 || x0 === 0)
      _C.style.setProperty('--tx', `${Math.round(unify(e).clientX - x0)}px`)
  }
};

function move(e) {
  if(x0 || x0 === 0) {
    let dx = unify(e).clientX - x0, s = Math.sign(dx);

    if((i > 0 || s < 0) && (i < N - 1 || s > 0))  {
      _C.style.setProperty('--i', i -= s);
      _C.style.setProperty('--tx', '0px');
      _C.classList.toggle('smooth', !(locked = false));
      x0 = null
    }
  }
};

_C.addEventListener('mousemove', drag, false);
_C.addEventListener('touchmove', drag, false);

_C.addEventListener('mousedown', lock, false);
_C.addEventListener('touchstart', lock, false);

_C.addEventListener('mouseup', move, false);
_C.addEventListener('touchend', move, false);






