let navToggle = document.querySelector(".nav__toggle");
let navWrapper = document.querySelector(".nav__wrapper");
let favs = document.querySelector("#chosen");

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

let cityArray = [{city: "Vancouver", coord: {lat: 49.246292, lng: -123.116226}},
 {city: "Burnaby", coord: {lat: 49.246445, lng: -122.994560}},
 {city: "Chilliwack", coord: {lat:49.157940, lng:-121.951469}}]

function areaSelector (event){
  for (city of cityArray){
    if (event.target.textContent === city["city"]){
      map.setCenter(city["coord"]);
      map.setZoom(12);
    }  
  }
} 

favs.addEventListener("click", areaSelector);


