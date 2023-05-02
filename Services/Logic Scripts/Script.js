
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 0, lng: 0 },
        zoom: 3,
    });

    const cardElement = createCardElement();
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

    const cityName = mainWeatherData.name;
    const country = mainWeatherData.sys.country;
    const temperature = mainWeatherData.main.temp;
    const weatherDescription = mainWeatherData.weather[0].description;

    // For the main city weather data
    // Create a new card element with the structure you want
    const mainCardElement = createWeatherCard(mainWeatherData);
    markerElement.appendChild(mainCardElement);

    clearPreviousCityCards();
    const locationName = mainWeatherData.name;
    const windSpeed = mainWeatherData.wind.speed;
    const mainHumidity = mainWeatherData.main.humidity;
    const mainAqi = mainWeatherData.visibility;
    const mainPressure = mainWeatherData.pressure;
    const mainRealFeel = mainWeatherData.main.feels_like;
    const mainWeatherIconCode = mainWeatherData.weather[0].icon;
    markerElement.innerHTML = "";
    const mainWeatherIcon = document.createElement("img");
    mainWeatherIcon.src = getWeatherIconURL(mainWeatherIconCode);
    mainWeatherIcon.className = "weather-icon";
    markerElement.appendChild(mainWeatherIcon);

    const upper = document.createElement('div')
    const humidity = document.createElement('div')
    const pressure = document.createElement('div')
    const humidityicon = document.createElement('div')
    const humiditytext = document.createElement('div')
    const pressureicon = document.createElement('div')
    const pressuretext = document.createElement('div')
    pressuretext.textContent = `Pressure`
    const pressurecontent = document.createElement('div')
    // pressurecontent.textContent`${}`

    const mainTemperature = mainWeatherData.main.temp;
    const temperatureElement = document.createElement("div");
    temperatureElement.className = "temperature";
    temperatureElement.textContent = `${mainTemperature}°C`;
    markerElement.appendChild(temperatureElement);

    const locationNameElement = document.createElement("div");
    locationNameElement.className = "location-name";
    locationNameElement.textContent = locationName;
    markerElement.appendChild(locationNameElement);

    const windSpeedElement = document.createElement("div");
    windSpeedElement.className = "wind-speed";
    windSpeedElement.textContent = `Wind: ${windSpeed} m/s`;
    markerElement.appendChild(windSpeedElement);

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
    const weatherDescription = weatherData.weather[0].description;
    const windSpeed = weatherData.wind.speed;
    const mainHumidity = weatherData.main.humidity;
    const mainAqi = weatherData.visibility;
    const mainPressure = weatherData.pressure;
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
    tempAndDescription.textContent = `${temperature}°C, ${weatherDescription}`;
    card.appendChild(tempAndDescription);

    const upper = document.createElement('div')
    upper.className = "upper"

    const wind = document.createElement("div");
    wind.className = "wind";
    wind.textContent = `Wind: ${windSpeed} m/s`;
    upper.appendChild(wind);

    const humidity = document.createElement("div");
    humidity.className = "humidity";
    humidity.textContent = `Humidity: ${mainHumidity}%`;
    upper.appendChild(humidity);
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
