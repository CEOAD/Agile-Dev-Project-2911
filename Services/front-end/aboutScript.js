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