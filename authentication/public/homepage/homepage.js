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

/*preliminary favourite places*/

let cityArray = [{city: "Vancouver", coord: {lat: 49.246292, lng: -123.116226}},
 {city: "Burnaby", coord: {lat: 49.246445, lng: -122.994560}},
 {city: "Chilliwack", coord: {lat:49.157940, lng:-121.951469}}]

let markersArray = [];

function areaSelector (event){
  for (city of cityArray){
    if (event.target.textContent === city["city"]){
      map.setCenter(city["coord"]);
      map.setZoom(7);
      clearOverlays();
      let marker = new google.maps.Marker({
        position: city["coord"],
        map,
        title: city["city"],});
      markersArray.push(marker)
    }  
  }
} 

function clearOverlays() {
for (i = 0; i < markersArray.length; i++) {
      markersArray[i].setMap(null);
    }
    markersArray = [];
  } 

const Sign_in = document.querySelector(".sign__up");
Sign_in.addEventListener("click", function () {
    window.location.href = "../signup_page/signup_page.html";
});

favs.addEventListener("click", areaSelector);

const loginBtn = document.querySelector('body > header > div > a.button.button--icon > button:nth-child(1)');
const loginCard = document.querySelector('.login-card');

loginBtn.addEventListener('click', () => {
  loginCard.classList.toggle('show');
});


    