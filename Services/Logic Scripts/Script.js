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

    // const lowerElement = document.querySelector(".lower");
    // const upperElement = document.querySelector(".upper");

    // Show the lower and upper elements when the marker is hovered over.
    // google.maps.event.addListener(map, "mouseover", (event) => {
    //     if (event.placeId) {
    //         lowerElement.style.visibility = "visible";
    //         upperElement.style.visibility = "visible";
    //         event.stop();
    //     }
    // });

    // Hide the lower and upper elements when the mouse leaves the marker.
    // google.maps.event.addListener(map, "mouseout", (event) => {
    //     lowerElement.style.visibility = "hidden";
    //     upperElement.style.visibility = "hidden";
    // });
    // Show the lower element when the marker is hovered over.
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

// Load the Google Maps API
let map;
let marker;
const script = document.createElement('script');
const API = 'AIzaSyAtfYF62HC9UTwaSZOk4TUbPWOPmgHQfmE';
script.src = `https://maps.googleapis.com/maps/api/js?key=${API}&libraries=places,geometry&callback=initMap`;
script.defer = true;
document.body.appendChild(script);


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

async function getAQI(latitude, longitude,) {
    const apiKey = "f5827a18-9aee-4c49-a4f7-7aaa4ee1d336"
    try {
        const url = `http://api.airvisual.com/v2/nearest_city?lat=${latitude}&lon=${longitude}&key=${apiKey}`;
        const response = await axios.get(url);

        if (response.data && response.data.data && response.data.data.current) {
            const aqi = response.data.data.current.pollution.aqius;

            if (aqi !== undefined) {
                return aqi;
            } else {
                throw new Error('AQI data not found for the given coordinates');
            }
        } else {
            throw new Error('No data available for the given coordinates');
        }
    } catch (error) {
        console.error('Error fetching AQI data:', error);
        console.error('Error response data:', error.response.data);
        throw error;
    }

}
let previousMainCardElement = null;
async function handleMarkerUpdate(markerElement) {
    const coordinates = marker.getPosition();

    const mainWeatherData = await fetchWeatherData(coordinates.lat(), coordinates.lng());
    if (!mainWeatherData) {
        console.error('Unable to fetch main weather data');
        return;
    }

    // Remove the previous main card element if it exists
    if (previousMainCardElement) {
        previousMainCardElement.remove();
    }
    // For the main city weather data
    // Create a new card element with the structure
    const mainCardElement = createWeatherCard(mainWeatherData);

    // Update the previous main card element variable
    previousMainCardElement = mainCardElement;

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
        const aqi = await getAQI(city.latitude, city.longitude);
        console.log(aqi);
        // Create a new card element with the structure you want
        const newCardElement = createWeatherCard(cityWeatherData, aqi);

        // Create a new marker for the nearby city and add it to the map
        const cityMarker = createMarker(city.latitude, city.longitude, newCardElement);

        // Add the new city marker to the nearbyCityMarkers array
        window.nearbyCityMarkers.push(cityMarker);
    }
}
function createWeatherCard(weatherData, aqiData) {
    const card = document.createElement("div");
    card.className = "card";
    card.style.zIndex = 999999;
    const cityName = weatherData.name;
    const country = weatherData.sys.country;
    const temperature = weatherData.main.temp;
    const windSpeed = weatherData.wind.speed;
    const mainHumidity = weatherData.main.humidity;
    if (aqiData === undefined) {
        aqiData = "No data"
    }
    const mainAqi = aqiData;
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
    const aqicont = document.createElement("div");
    const aqisvg = `<svg class="aqisvg" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" viewBox="0 0 20 20" xml:space="preserve">  <image id="image0" width="20" height="20" x="0" y="0" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAABGdBTUEAALGPC/xhBQAAACBjSFJN
          AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABBVBMVEUAAABL4f9O5v9P5f9Q
          5f9R5/8AZsxB0vYAd9EAeNQAd9MeoOM1w/EYmuIZm+IXnOIAAP8AccYmrOgYmuAWneEA//8AdtQZ
          m+JP5f8ZmeUAf89L3vwcoOQYmeIAddEAeNUrseocjeIAd9QAeNMxu+4kqucZmuEYm+IWmeI5xfIf
          n99P3/9Q5v9Q5v9Q5v9G2Pk0wPA+zfZN4v5L3/w+zfUyve8iqOcrs+s9zPVM4f1N4v1E1vklrOki
          p+cmrOhH2fpP5f5F1/kstewqs+tO4/4nruott+0or+pL3vxE1flK3vxA0fcjqecrtOxO5P4yvvAs
          tOw6yPNA0Pc7yfQ4xfI3xPL////cI4U2AAAALnRSTlMAEXF3ZWsFeC3S26iVh7MsAQnAVCIBZ7Ft
          ChBv6GonVZQJs4yLxtPNLY8IEHuINVg0ZAAAAAFiS0dEVgoN6YkAAAAJcEhZcwAACxMAAAsTAQCa
          nBgAAAAHdElNRQfnAhIFCRn0J5yMAAAAq0lEQVQY02NgIAkwMjFDARMjXJBFDw5Y4IKsCEFWmBgb
          u56+gaERsiAHJxe3nrGJqZm5haWeFQ8vHz9QUEAQqt3a1MbWTkhYRBRmprG9A5qZYuJ6jk62ziYu
          QEEJSaiglDRIjaOpraubu4wsupM8PL2g2gXk5BX0vH18LYwgZiqCLOJQUlbR0/Nz9LcNCAwKVlVT
          10DRbh1iGqqphc+b2ANEW0cXCnS0SQt0ALCcIug70CWhAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDIz
          LTAyLTE4VDA1OjA5OjI1KzAwOjAwRMIpTAAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyMy0wMi0xOFQw
          NTowOToyNSswMDowMDWfkfAAAAAodEVYdGRhdGU6dGltZXN0YW1wADIwMjMtMDItMThUMDU6MDk6
          MjUrMDA6MDBiirAvAAAAAElFTkSuQmCC"></image>
        </svg>`;
    const parserAqi = new DOMParser();
    const svgDocAqi = parserAqi.parseFromString(aqisvg, "image/svg+xml");
    const svgElementAqi = svgDocAqi.querySelector("svg");
    aqicont.className = "aqicont";
    aqi.className = "aqi";
    aqi.textContent = `AQI: ${mainAqi}`;
    aqicont.appendChild(svgElementAqi);
    aqicont.appendChild(aqi)
    lower.appendChild(aqicont);

    const pressure = document.createElement("div");
    const pressuresvg = `<svg class="pressuresvg" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" viewBox="0 0 20 20" xml:space="preserve">  <image id="image0" width="20" height="20" x="0" y="0" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAABGdBTUEAALGPC/xhBQAAACBjSFJN
          AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABNVBMVEUAAAAAr8EArMAAqsAA
          rMEBrMEBrMAAq8AArb8AqsIBrMEgtMa53+S53+QetMYArMEArMEAqrsArMA9scFegp4Cqr8Ao8gA
          rMEErMHn6+wTobgArMAArMBCvc1sco8Aq8EArMFSqrmNWn1Dvs4Aq8EErcLo7O0SorgArMAAq8A8
          sMBie5gCqr8BrMEftMa23eO33uQcs8YAq8AArMAAq8ABq8AAq8EAq8Mtdn9DW2OvvcSwvcSrucJ3
          kZyvvcWvv8OruMJ6kZ55kJ2rusAArMHFzdLH0NS5xMru7u7l5+jm6Ojp3eDd4OK2ubvAhZL4G0en
          rK1YYWV3foHu7e39Mlns7OwzXWQxW2Tl5+f6VHSssLKpra/9MVnc4OL1m6y5xcvv09kxcX5FWmR4
          kJywvsWsusL///80ikJBAAAARHRSTlMAHUotv/j5vSw/9cvd3MrzPg/q4+rqDnXk+/NzucP3t873
          /cJ05Przcunj8en0y93cyz28/vu7K1RASpWb/YBAhvP3hpKCbb4AAAABYktHRGYs1NklAAAACXBI
          WXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5wISBRAIBZcVZgAAAM1JREFUGNNjYMAHGJmYGNGEmFlc
          WNlc2DmQxTi5uHlc3Xj5+AUQYoJCwu4enl4e3iKiYnBBcQlJHw8PD18/fylpuKCMLFAoIDAoOERO
          Hi6ooOjuERoWHuERqaSAUKkMVBkV7REcg6RSRVUtFijsEeevroGwXVMrHiSYoK2DsJ1BQFdP38PD
          wJDfCNn1HMYmpqYmZuZoHrVITLTACBDLpCRLJK6VNRDY2CYn29qAWFZgQbsUIEhNBoJUEMsOLGhv
          BwQOjk5Ojs4glj0DCQAAJCUofMKIT9cAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjMtMDItMThUMDU6
          MTY6MDgrMDA6MDBXtcu8AAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIzLTAyLTE4VDA1OjE2OjA4KzAw
          OjAwJuhzAAAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyMy0wMi0xOFQwNToxNjowOCswMDowMHH9
          Ut8AAAAASUVORK5CYII="></image>
        </svg>`;
    const parserPressure = new DOMParser();
    const svgDocPressure = parserPressure.parseFromString(pressuresvg, "image/svg+xml");
    const svgElementPressure = svgDocPressure.querySelector("svg");
    const pressurecont = document.createElement("div");
    pressurecont.className = "pressurecont";
    pressurecont.appendChild(svgElementPressure);
    pressure.className = "pressure";
    pressure.textContent = `Pressure: ${mainPressure} hPa`;
    pressurecont.appendChild(pressure);
    lower.appendChild(pressurecont);

    const realFeel = document.createElement("div");
    const realsvg = `<svg class="rfsvg" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="20px" height="20px" viewBox="0 0 20 20" xml:space="preserve">  <image id="image0" width="20" height="20" x="0" y="0" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAABGdBTUEAALGPC/xhBQAAACBjSFJN
          AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAABuVBMVEUAAAAAAAAECQkIDg4E
          BAQAAAAAAAAFBQUHDAwIDg4MFBUNFRUKCgoPGhxGenw/b3FDdXcmRUYJDAwJDw9Pi40LFBQNFhYM
          FhYPGhsMExUKEhIPGhoKEhQMExMOGhoMExMPGhoKFBQLExMNFxcKEhILFBQKExMKExQLEhILERMK
          EREHDQ1SkJMuUlMABAQAAAASHh9FeXtAcXI8aWszWlwvU1M4Y2QjPT4NGBoAAAAAAAAAAAAAAAAA
          AAAAAAAAAAAAAABYmZtWlplKgoVlsbRsvsF0zM9uwsVuwcNsvb9ecU53czF0bStgbkdqt7dntbhp
          tbVxaCf5uxD+vxD7vBBTUilYlZdtwMNms7Zdc1P8vRDYpBR5b0imsKy0wcFzhoZdkpRldEx6cU3W
          5eWLnJxdm51otrlZdl67kBWxvbmUo6RmfHxajo9ouLpqt7mJdiN8YxnH1dWVpaVfn6Jgl41OUUKv
          u7pWe3xwxsldn6KmtLTO3NxUf4BswMN0ys1gpaedrKzT4uJjd3dsvcBqubxXg4Vgd3hthYVid3dh
          dnZof39shYVkf4BVeXpqt7pksbJjr7Jdo6X////f0mPcAAAAQXRSTlMABGh/a1xUZIqPo7BH2vv4
          /vJQgvyxwLLCpqXBsafBqcKutcCwuamtop+SgPzwOQzg/f728fD166Zla1o/PiEmFs+XjUIAAAAB
          YktHRJKWBO8gAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5wISBQ8aO3RqsAAAAQlJREFU
          GNNjYMAOGJmYmVlY2djYmZk5OLm4ecBivHyOTs7O/ALOTo6Oji6ugkJAQWERNxTgLgoUFEMVc/MQ
          BwpKuLl5enn7+PpBBf0lwYIBgUHBwSGhYeFgwQgpoKC0W2RUcHB0TGxcfAJYuwxYMDE4OCgpGQhS
          UoGCabJAQTm39KDgjEyQYHJWdo5brjxQUMEtLz+ooDAZAoqKXRXBgm4lpWXJMFBeoQQUVHZzq6yC
          i1XX1KoABVXr3OobYGKNTc0takBBdVc3t9a29vaOzq7unt4+t34NoKDmBFRvTtQCCmrroArq6gEF
          9Q0MnY2MTUxNzYxBwNwCHMj6llbWNrZ29jZg4IAjKhgAAWdbVO4nzP4AAAAldEVYdGRhdGU6Y3Jl
          YXRlADIwMjMtMDItMThUMDU6MTU6MjYrMDA6MDCumAyfAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIz
          LTAyLTE4VDA1OjE1OjI2KzAwOjAw38W0IwAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyMy0wMi0x
          OFQwNToxNToyNiswMDowMIjQlfwAAAAASUVORK5CYII="></image>
        </svg>`;
    const parserRealFeel = new DOMParser();
    const svgDocRealFeel = parserRealFeel.parseFromString(realsvg, "image/svg+xml");
    const svgElementRealFeel = svgDocRealFeel.querySelector("svg");
    const realFeelcont = document.createElement("div");
    realFeelcont.className = "realFeelcont";
    realFeelcont.appendChild(svgElementRealFeel);
    realFeel.className = "real-feel";
    realFeel.textContent = `Real feel: ${mainRealFeel}°C`;
    realFeelcont.appendChild(realFeel);
    lower.appendChild(realFeelcont);

    const card3 = document.createElement('div');
    let aqiResult; // Declare aqiResult here

    if (aqiData > 100) {
        aqiResult = "Unhealthy";
        card3.className = "card3 red";
    } else if (aqiData > 50) {
        aqiResult = "Moderate";
        card3.className = "card3 yellow";
    } else if (aqiData == undefined) {
        aqiResult = "No Data";
        card3.className = "card3 grey";
    } else {
        aqiResult = "Healthy";
        card3.className = "card3 green";
    }

    console.log(aqiResult);
    card3.textContent = aqiResult;
    card2.appendChild(lower)
    const card3cont = document.createElement("div");
    card3cont.className = "card3cont";
    card3cont.appendChild(card3);
    card2.appendChild(card3cont);
    cardm.appendChild(card)
    cardm.appendChild(card2)
    return cardm;
}

document.addEventListener("DOMContentLoaded", () => {
    window.initMap = initMap;
});


function getWeatherIconURL(iconCode) {
    return `http://openweathermap.org/img/w/${iconCode}.png`;
}
