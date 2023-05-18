import {favs, createLi, cityArray} from "./favourites.js"

let navToggle = document.querySelector(".nav__toggle");
let navWrapper = document.querySelector(".nav__wrapper");

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

let Sign_in = document.querySelector(".sign__up");
Sign_in.addEventListener("click", function () {
    window.location.href = "../signup_page/signup_page.html";
});

/* Creates list items from array information */
let nodes = cityArray.map(city => {
  let newLi;
  newLi = createLi(city["city"]);
  return newLi;

});

favs.append(...nodes);



