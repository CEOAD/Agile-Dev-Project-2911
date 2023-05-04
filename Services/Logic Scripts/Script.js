
async function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 0, lng: 0 },
        zoom: 3,
    });

    const mainWeatherData = await fetchWeatherData(0, 0);
    if (!mainWeatherData) {
        console.error('Unable to fetch main weather data');
        return;
    }
    const cardElement = createWeatherCard(mainWeatherData);
    marker = createMarker(0, 0, cardElement, true);

    marker.addListener("dragend", () => handleMarkerUpdate(cardElement));
    map.addListener("click", (event) => {
        const coordinates = event.latLng;
        marker.setPosition(coordinates);
        handleMarkerUpdate(cardElement).catch((error) =>
            console.error("Error handling marker update:", error)
        );
    });

    // Define computeDestinationPoint function here

    // Wait for the map to be fully loaded before handling the initial marker update
    google.maps.event.addListenerOnce(map, 'idle', () => {
        handleMarkerUpdate(cardElement).catch((error) =>
            console.error("Error handling initial marker update:", error)
        );
    });
}

function computeDestinationPoint(lat, lng, distance, heading) {
    heading = (heading + 360) % 360;
    var radians = (heading * Math.PI) / 180.0;
    var km = distance / 1000;
    var lat1 = (lat * Math.PI) / 180.0;
    var lng1 = (lng * Math.PI) / 180.0;
    var lat2 =
        Math.asin(
            Math.sin(lat1) * Math.cos(km / 6371) +
            Math.cos(lat1) * Math.sin(km / 6371) * Math.cos(radians)
        ) * (180.0 / Math.PI);
    var lng2 =
        lng1 +
        Math.atan2(
            Math.sin(radians) * Math.sin(km / 6371) * Math.cos(lat1),
            Math.cos(km / 6371) - Math.sin(lat1) * Math.sin((lat2 * Math.PI) / 180.0)
        ) *
        (180.0 / Math.PI);

    return new google.maps.LatLng(lat2, lng2);
}

// Load the Google Maps API
let map;
let marker;
const script = document.createElement('script');
const API = 'AIzaSyAtfYF62HC9UTwaSZOk4TUbPWOPmgHQfmE';
script.src = `https://maps.googleapis.com/maps/api/js?key=${API}&libraries=places,geometry&callback=initMap`;
script.defer = true;
document.body.appendChild(script);


function createCardElement() {
    const cardElement = document.createElement('div');
    cardElement.className = 'card marker-card';

    const weatherIconElement = document.createElement('img');
    weatherIconElement.className = 'weather-icon';
    cardElement.appendChild(weatherIconElement);

    const locationNameElement = document.createElement('div');
    locationNameElement.className = 'location-name';
    cardElement.appendChild(locationNameElement);

    const temperatureElement = document.createElement('div');
    temperatureElement.className = 'temperature';
    cardElement.appendChild(temperatureElement);

    const windSpeedElement = document.createElement('div');
    windSpeedElement.className = 'wind-speed';
    cardElement.appendChild(windSpeedElement);

    return cardElement;
}


function createMarker(lat, lng, markerElement, draggable = false) {
    const overlay = new google.maps.OverlayView();
    overlay.onAdd = function () {
        const panes = overlay.getPanes();
        panes.markerLayer.appendChild(markerElement);

        // Add a click listener to the markerElement
        markerElement.addEventListener('click', () => {
            markerElement.style.zIndex = '1000';
        });

        // Add a click listener to the map to reset the zIndex when clicking outside the markerElement
        map.addListener('click', () => {
            markerElement.style.zIndex = '';
        });
    };

    overlay.draw = function () {
        const position = marker.getPosition();
        const projection = overlay.getProjection();
        const pixelPosition = projection.fromLatLngToDivPixel(position);
        markerElement.style.left = pixelPosition.x + "px";
        markerElement.style.top = pixelPosition.y + "px";

        // Remove the previous main card element
        const oldMainCard = document.querySelector(".card-container .marker-card");
        if (oldMainCard) {
            oldMainCard.remove();
        }

        // Remove any previous marker elements in the card container
        const previousMarkerElements = document.querySelectorAll(".card-container .cardm");
        previousMarkerElements.forEach((element) => element.remove());

        // Update the position of the main card element
        const cardContainer = document.querySelector(".card-container");
        if (cardContainer) {
            cardContainer.style.left = pixelPosition.x + "px";
            cardContainer.style.top = pixelPosition.y - 40 + "px";
            cardContainer.appendChild(markerElement);
        }
    };
    overlay.onRemove = function () {
        markerElement.parentNode.removeChild(markerElement);
    };
    overlay.setMap(map);

    const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        draggable: draggable,
    });

    // Store the markerElement in the marker object
    marker.set("markerElement", markerElement);

    overlay.bindTo("position", marker);

    return marker;
}

async function fetchWeatherData(lat, lng) {
    const weatherApiKey = '3f171dd2f33fcfa66e7d8971457c3922';
    const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${weatherApiKey}&units=metric`;

    try {
        const response = await axios.get(weatherApiUrl);
        const data = response.data;
        console.log(data);

        if (!data || !data.weather || data.weather.length === 0) {
            throw new Error('Invalid weather data received');
        }

        return data; // Return the entire data object
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}


async function fetchNearbyCities(lat, lng) {
    const location = new google.maps.LatLng(lat, lng);
    const service = new google.maps.places.PlacesService(map);

    const request = {
        location: location,
        radius: 100000, // Search within a radius of 100 km
        query: "city",
    };

    const results = await new Promise((resolve, reject) => {
        service.textSearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                resolve(results);
            } else {
                reject(`Error fetching nearby cities: ${status}`);
            }
        });
    });

    const cities = [];
    for (const result of results) {
        cities.push({
            name: result.name,
            latitude: result.geometry.location.lat(),
            longitude: result.geometry.location.lng(),
        });
    }

    return cities.slice(-3);
}



function clearPreviousCityCards() {
    // Remove the cards from the card container
    const oldCityCards = document.querySelectorAll(".card-container .card");
    for (const card of oldCityCards) {
        card.remove();
    }

    // Remove the cards from the markers
    if (window.nearbyCityMarkers) {
        window.nearbyCityMarkers.forEach((cityMarker) => {
            const markerElement = cityMarker.get("markerElement");
            if (markerElement) {
                markerElement.remove();
            }
        });
    }
}



async function handleMarkerUpdate(markerElement) {
    const coordinates = marker.getPosition();

    const mainWeatherData = await fetchWeatherData(coordinates.lat(), coordinates.lng());
    if (!mainWeatherData) {
        console.error('Unable to fetch main weather data');
        return;
    }

    // For the main city weather data
    // Create a new card element with the structure
    const mainCardElement = createWeatherCard(mainWeatherData);
    markerElement.appendChild(mainCardElement);

    clearPreviousCityCards();


    const nearbyCities = await fetchNearbyCities(coordinates.lat(), coordinates.lng());

    // Remove the previous nearby city markers from the map
    if (window.nearbyCityMarkers) {
        window.nearbyCityMarkers.forEach((cityMarker) => cityMarker.setMap(null));
    }

    // Create an array to store the new nearby city markers
    window.nearbyCityMarkers = [];

    // Fetch the weather data for each nearby city and create a custom marker
    for (const city of nearbyCities) {
        const cityWeatherData = await fetchWeatherData(city.latitude, city.longitude);

        // Create a new card element with the structure you want
        const newCardElement = createWeatherCard(cityWeatherData);

        // Create a new marker for the nearby city and add it to the map
        const cityMarker = createMarker(city.latitude, city.longitude, newCardElement);

        // Add the new city marker to the nearbyCityMarkers array
        window.nearbyCityMarkers.push(cityMarker);
    }
}
function createWeatherCard(weatherData) {
    const card = document.createElement("div");
    card.className = "card";

    const cityName = weatherData.name;
    const country = weatherData.sys.country;
    const temperature = weatherData.main.temp;
    const windSpeed = weatherData.wind.speed;
    const mainHumidity = weatherData.main.humidity;
    const mainAqi = weatherData.visibility;
    const mainPressure = weatherData.main.pressure;
    const mainRealFeel = weatherData.main.feels_like;
    const mainWeatherIconCode = weatherData.weather[0].icon;

    const weatherIcon = document.createElement("img");
    weatherIcon.src = getWeatherIconURL(mainWeatherIconCode);
    weatherIcon.className = "weather-icon";
    card.appendChild(weatherIcon);

    const cardm = document.createElement('div')
    cardm.className = "cardm";

    const card2 = document.createElement('div')
    card2.className = "card2";

    const cityAndCountry = document.createElement("div");
    cityAndCountry.className = "mainsub";
    cityAndCountry.textContent = `${cityName}, ${country}`;
    card.appendChild(cityAndCountry);

    const tempAndDescription = document.createElement("div");
    tempAndDescription.className = "main";
    tempAndDescription.textContent = `${temperature}°C`;
    card.appendChild(tempAndDescription);

    const upper = document.createElement('div')
    upper.className = "upper"

    const wind = document.createElement("div");
    const windSvg = `<svg class="wind_svg" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="30px" height="30px" viewBox="0 0 30 30" xml:space="preserve">  <image id="image0" width="30" height="30" x="0" y="0" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAMAAAAM7l6QAAAABGdBTUEAALGPC/xhBQAAACBjSFJN
            AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABaFBMVEUAAAAA//8ilfIhlfMg
            lvIglfMglvIeku8cjf8glvMhlfIflvMhlfIhlvIglvMhl/MglvIglfIglPEfmfIhlfIglvQfn/8g
            lfIglvIhlfMglfIglvMhl/AhlfIcm/AAf/8qlOkglPYglvIZmf8zmf8hlfIglfIXi+cilPMhlvMg
            lfQhlvMglvIhlfIgl/MglvMhlvMhlfMhlvIfl+8hlvMhlfMglvMglvI/f/8hlvMilvMelvAglfIg
            lvMhlvIglPIglvIhlfIkkfUglfMglfMhlvMhlvMilvMjlfEglvMhlfIhlfMglfIflvEnnOshlvIf
            lPEflfIek/QglvIglvMhlfIime4jlPAglvMglvEhlvMhl/MglfMglfMhlvIak/Edk/UhlvIglfMg
            l/IglvIglfIilPIhlvMhlfMhk/Eqqv8glvIglfMcl/UhlfMhlvIhlvMhlfIglfIhlfIgl/QflPQh
            lvP///+FIn/GAAAAdnRSTlMAAVKu1MmNIQmy91ig/Z5s0fo3KP5dCL27Lvm0NvwSAgwf+woFv7oL
            Q0RGa9L1Vtndx4sgme3FZgTIFiI/hvZld3sch8Tv7kI683nV6DgN4GBQMsycjw8k6nWqRW3cUxMa
            5dpnfLU87N8mBrxXG5jnibjLoi8YaHuXCQAAAAFiS0dEd0Zk+dcAAAAJcEhZcwAACxMAAAsTAQCa
            nBgAAAAHdElNRQfnAhEIBBbLW8PtAAABJ0lEQVQoz62RZ1fCMBSG46atomBR1IJ7g+KotKKgxYl7
            4Z6493x/v6T0QKMtn/p8ec/Nk5Pc5BLiHCWlZeUVlVU21sWBwgvWuho1bqG2Dh6vla0X4ctGQyP8
            VrqpuUVPCQGXlQ+26tEGtBfpX0JHp73t6kYPs9Db159nYDAEj8RoNxjCQ+xxvuFIgZHRMcemQMi4
            iP+I8kRU0TUHG9RJqpWYFVPTcahKsc/jkSAzfgNuVvvjk5gj84W7FhZZvYRl4o0apFawGmT0GsKm
            an0DmzS31O3cQgo75t27SNLYQyRNc/8AhzkROzrOPjCEE1poMk7Pzi8Sl7gyxp5B/Fq4Aa//A7m9
            y7V6/2Ac+/hEy8CzUb68ysDbezp/rZL5+Pz6NvWh/TgwzV+1HV523WQ81AAAACV0RVh0ZGF0ZTpj
            cmVhdGUAMjAyMy0wMi0xN1QwODowNDoyMiswMDowML1dmzYAAAAldEVYdGRhdGU6bW9kaWZ5ADIw
            MjMtMDItMTdUMDg6MDQ6MjIrMDA6MDDMACOKAAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDIzLTAy
            LTE3VDA4OjA0OjIyKzAwOjAwmxUCVQAAAABJRU5ErkJggg=="></image>
        </svg>`;
    const parserWind = new DOMParser();
    const svgDocWind = parserWind.parseFromString(windSvg, "image/svg+xml");
    const svgElementWind = svgDocWind.querySelector("svg");
    const windcont = document.createElement('div')
    wind.className = "wind";
    wind.textContent = `Wind: ${windSpeed} m/s`;
    windcont.className = "windcont"
    windcont.appendChild(wind)
    windcont.appendChild(svgElementWind)
    upper.appendChild(windcont);

    const humidity = document.createElement("div");
    const humiditysvg = `<svg xml:space="preserve" viewBox="0 0 30 30" height="30px" width="30px" y="0px" x="0px"
                             xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" id="Layer_1"
                             version="1.1" class="humidity_svg">  <image href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAMAAAAM7l6QAAAABGdBTUEAALGPC/xhBQAAACBjSFJN
          AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABiVBMVEUAAAAAAP9NerV/f39O
          e7ZQfLZVf6pRfbfL5fdRfbZIbbZmmcxols5nl85OebSPsteLrdVSfLZxl89ok9FqlM5ahsBdicNa
          hsFcicRhjcdWgbpahsFfi8ZbhsFijsmErOWLt+9xndZcicJahsFahsFdicN5n81xjcZqlNRpls1q
          lNBfn99pls9nkcxXgrpZgrtik81OebWNsdeMrtZOebRNerVZg7pwmMhNebRKdLRNerZNebHZ8v9o
          lM9jj8rV7v3W7v1ch7+Ktu6Lt/CEsep7p+Cz1PO+3fqJte5/q+V+quOUvvLY8f+TvfKpzvapzfaq
          z/aRvPGdxfSVv/LX8P/W8P+32fnK5vyMuPCmzPXW8P6ny/WWv/KOufGawvO22PjJ5vzB4PrU7v6i
          yPSz1fiYwfKOufDD4funzPXF4vvE4vuOuvHV7/7U7/7G4/uNufCx1Pew0/ev0veu0feQu/G01viP
          ufF/q+SCrud+quSItO2kyvWjyfVijslrltFmkcyEqtZgjMf///8NXQssAAAAPHRSTlMAAZgCW+EG
          y+jMBxRaRXHC2H8bX0ry/vrhyvnw0PDHR0Be/e/4/f4SDDNiEFVb0eI5iMHCho7NwI0YOBdy59Cm
          AAAAAWJLR0SCi7P/RAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+cCEBITAJMBs+kAAAFb
          SURBVCjPY2CAAUYmZgY8gIWVBY8sGzsHJxc2CW4eXiDJx28jIAjiCgnzgoV5ebiBpIiomK2duISk
          lL2Ng6O0jIwsmCsnIW5nKyYqwiDv5AwELq5uNjY27h6enh5grpcLiHKSZ1BwBgNvH6C0j68zKlCA
          SfvZgIA/LukAsHQAVDgwCE06OAQoGxoMlQ4Lj0CVdo6MsomKhrJjfGwi0aSdY+NiYcx4G5sEdGkk
          kGhjk4RHOjnEJgWPtLNvKprL07CpgktHpEfgk/a3ycAnnWmThRDMxpDOscmFi6Xl5aNLF+QUwqWL
          bIoxogQBSpJskkpwS5cC4yYFp3RZElA6qQwh7VFeAWZXVFYByWpwxNcAueUeQGlFJWUZCZXauloV
          CRllVdt6NbB0QyOIq6TIoK4BSrWaWpogSltHVw8srW8A4mqoY6R6QyOgrLEJztxiamZuZsGGOztZ
          WlnD2QBCYbJl9Cx9XAAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMy0wMi0xNlQxODoxOTowMCswMDow
          MG/wqfUAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjMtMDItMTZUMTg6MTk6MDArMDA6MDAerRFJAAAA
          KHRFWHRkYXRlOnRpbWVzdGFtcAAyMDIzLTAyLTE2VDE4OjE5OjAwKzAwOjAwSbgwlgAAAABJRU5ErkJggg==" y="0" x="0" height="30"
                                                                            width="30" id="image0"></image>
          </svg>`;
    const parserHumidity = new DOMParser();
    const svgDocHumidity = parserHumidity.parseFromString(humiditysvg, "image/svg+xml");
    const svgElementHumidity = svgDocHumidity.querySelector("svg");
    const humiditycont = document.createElement('div')
    humiditycont.className = "humiditycont";
    humidity.className = "humidity";
    humidity.textContent = `Humidity: ${mainHumidity}%`;
    humiditycont.appendChild(svgElementHumidity)
    humiditycont.appendChild(humidity)
    upper.appendChild(humiditycont);
    card2.appendChild(upper)

    const lower = document.createElement('div')
    lower.className = "lower"

    const aqi = document.createElement("div");
    aqi.className = "aqi";
    aqi.textContent = `AQI: ${mainAqi}`;
    lower.appendChild(aqi);

    const pressure = document.createElement("div");
    pressure.className = "pressure";
    pressure.textContent = `Pressure: ${mainPressure} hPa`;
    lower.appendChild(pressure);

    const realFeel = document.createElement("div");
    realFeel.className = "real-feel";
    realFeel.textContent = `Real feel: ${mainRealFeel}°C`;
    lower.appendChild(realFeel);

    const card3 = document.createElement('div')
    card3.className = "card3"

    card2.appendChild(lower)

    cardm.appendChild(card)
    cardm.appendChild(card2)
    return cardm;
}

window.initMap = initMap;

function getWeatherIconURL(iconCode) {
    return `http://openweathermap.org/img/w/${iconCode}.png`;
}
