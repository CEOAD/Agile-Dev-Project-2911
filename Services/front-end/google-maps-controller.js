import SVGs from "./svgs.js";
import ApiController from "./api_controller.js";
import Utils from './utils.js';
import { favs, delBtn, addFav, cityArray } from '../../Pages/homepage/favourites.js';


/**
 * Houses the logic for manipulating the Google Maps interface.
 */
class GoogleMapsController {
    static GoogleApiKey = 'AIzaSyAtfYF62HC9UTwaSZOk4TUbPWOPmgHQfmE';

    marker;
    cityMarkers;
    infoWindows;
    map;
    mapElement;

    constructor(mapElement) {
        this.mapElement = mapElement;
        this.cityMarkers = [];
        this.infoWindows = {
            marker: null,
            cityMarkers: [],
        };
    }

    get mapStyles() {
        return [
            {elementType: "geometry", stylers: [{color: "#242f3e"}]},
            {elementType: "labels.text.stroke", stylers: [{color: "#242f3e"}]},
            {elementType: "labels.text.fill", stylers: [{color: "#746855"}]},
            {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{color: "#d59563"}],
            },
            {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{color: "#d59563"}],
            },
            {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{color: "#263c3f"}],
            },
            {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{color: "#6b9a76"}],
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{color: "#38414e"}],
            },
            {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{color: "#212a37"}],
            },
            {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [{color: "#9ca5b3"}],
            },
            {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{color: "#746855"}],
            },
            {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{color: "#1f2835"}],
            },
            {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [{color: "#f3d19c"}],
            },
            {
                featureType: "transit",
                elementType: "geometry",
                stylers: [{color: "#2f3948"}],
            },
            {
                featureType: "transit.station",
                elementType: "labels.text.fill",
                stylers: [{color: "#d59563"}],
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{color: "#17263c"}],
            },
            {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{color: "#515c6d"}],
            },
            {
                featureType: "water",
                elementType: "labels.text.stroke",
                stylers: [{color: "#17263c"}],
            },
        ];
    }

    async initMap() {
        const userLocation = (await this.getUserCurrentLocation());
        const initialMarkerPosition = userLocation ?? {lat: 0, lng: 0};

        this.map = new google.maps.Map(this.mapElement, {
            center: initialMarkerPosition,
            zoom: userLocation ? 8 : 3,
            styles: this.mapStyles,
        });

        this.marker = this.createMarker({
            draggable: true,
            position: initialMarkerPosition,
        });
        // Favourites Dropdown
        favs.addEventListener("click", () => { addFav(event, this.marker) });
        favs.addEventListener("click", () => { this.areaSelector(event, this.map, this.marker) });
        favs.addEventListener("click", () => { delBtn(event) });

        this.marker.addListener("dragend", () => this.updateMarkers(true).then());

        this.map.addListener("click", (event) => this.onMapClicked(event));

        // Wait for the map to be fully loaded before handling the initial marker update
        google.maps.event.addListenerOnce(this.map, 'idle', () => this.updateMarkers(true));
        const searchInput = document.getElementById("search-input");
        const autocomplete = new google.maps.places.Autocomplete(searchInput);

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry) {
                // User entered the name of a Place that was not suggested and pressed the Enter key or the place was not found
                window.alert("No details available for the selected location.");
                return;
            }
            // If the place has a geometry, present it on a map
            this.map.setCenter(place.geometry.location);
            this.map.setZoom(14);
            this.marker.setPosition(place.geometry.location);

            this.updateMarkers(true).then(() => {
                this.closeAllInfoWindows();
            });
        });
    }

    async getUserCurrentLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => resolve({lat: position.coords.latitude, lng: position.coords.longitude}),
                    () => resolve(null)
                );
            }
        });
    }

    onMapClicked(event) {
        const clickedPosition = event.latLng;
        this.infoWindows.marker?.close();
        const infoWindows = [this.infoWindows.marker, ...this.infoWindows.cityMarkers].filter(e => e !== null);

        const infoWindowBounds = infoWindows.map((infoWindow) =>
            new google.maps.LatLngBounds(
                infoWindow.getPosition(),
                new google.maps.LatLng(
                    (infoWindow.getPosition()?.lat() ?? 0) + 0.001,
                    (infoWindow.getPosition()?.lng() ?? 0) + 0.001
                )
            ));

        if (infoWindowBounds.some(e => e.contains(clickedPosition)))
            return;

        if (this.closeAllInfoWindows())
            return;

        const markers = [this.marker, ...this.cityMarkers];

        const markersBounds = markers.map((marker) =>
            new google.maps.LatLngBounds(
                marker.getPosition(),
                new google.maps.LatLng(
                    (marker.getPosition()?.lat() ?? 0) + 0.001,
                    (marker.getPosition()?.lng() ?? 0) + 0.001
                )
            ));
        if (markersBounds.some(e => e.contains(clickedPosition)))
            return;

        this.marker.setPosition(event.latLng);
        this.updateMarkers(true).then();
    }

    async updateMarkers(withNearbyCities = false) {

        this.infoWindows.marker = null;
        this.infoWindows.cityMarkers.splice(0, this.infoWindows.cityMarkers.length);

        this.setupMarkerAndMarkerInfoWindow(this.marker).then(infoWindow => {
            this.infoWindows.marker = infoWindow;
        });

        for (const cityMarker of this.cityMarkers) {
            cityMarker.setMap(null);
        }
        this.cityMarkers.splice(0, this.cityMarkers.length);

        if (!withNearbyCities)
            return;


        const markerPosition = this.marker.getPosition();
        const nearbyCities = await ApiController.getNearbyCities(markerPosition.lat(), markerPosition.lng(), this.map) ?? [];

        for (const nearbyCity of nearbyCities) {
            const cityMarker = this.createMarker({
                position: {lat: nearbyCity.latitude, lng: nearbyCity.longitude},
                draggable: false,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: "#52a229",
                    fillOpacity: 1,
                    scale: 10,
                    strokeColor: "#52a229",
                    strokeWeight: 3,
                },
            });
            this.cityMarkers.push(cityMarker);
            this.setupMarkerAndMarkerInfoWindow(cityMarker).then(infoWindow => {
                this.infoWindows.cityMarkers.push(infoWindow);
            })
        }

    }

    async setupMarkerAndMarkerInfoWindow(marker) {
        const markerPosition = marker.getPosition();

        const markerInfoWindowContent = this.createMarkerInfoWindowCard(
            await ApiController.getWeather(markerPosition.lat(), markerPosition.lng()),
            await ApiController.getAQI(markerPosition.lat(), markerPosition.lng()),
        );

        const markerInfoWindow = this.createMarkerInfoWindow(marker, {
            content: markerInfoWindowContent.outerHTML,
        })

        // Enables the marker card hover animation.
        markerInfoWindow.addListener('domready', () => {
            const content = document.getElementById(markerInfoWindowContent.id);
            const upperCard = content.querySelector('.upper-card');
            const lowerCard = content.querySelector('.lower-card');
            const card = content.querySelector('.center-card');
            card.addEventListener('mouseenter', () => {
                upperCard.classList.add('show');
                lowerCard.classList.add('show');
                card.classList.add('hovering');
            });
            content.addEventListener('mouseleave', () => {
                upperCard.classList.remove('show');
                lowerCard.classList.remove('show');
                card.classList.remove('hovering');
            });
        });
        return markerInfoWindow;
    }

    createMarker({draggable, position, ...rest}) {
        return new google.maps.Marker({
            position: position,
            map: this.map,
            draggable: draggable,
            ...(rest ?? {}),
        });
    }

    createMarkerInfoWindow(marker, {content}) {
        const infoWindow = new google.maps.InfoWindow({
            content: content,
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            borderWidth: 2,
        });
        marker.addListener("click", () => {
            infoWindow.open(this.map, marker);
        });
        return infoWindow;
    }


    closeAllInfoWindows() {
        this.infoWindows.marker?.close();
        const infoWindows = [this.infoWindows.marker, ...this.infoWindows.cityMarkers].filter(e => e !== null);
        for (let infoWindow of infoWindows) {
            if (infoWindow.getMap()) {
                infoWindow.close();
                return true;
            }
        }
        return false;
    }


    createMarkerInfoWindowCard(weatherData, aqiData = undefined) {
        const cityName = weatherData?.name ?? "";
        const country = weatherData.sys.country ?? "";
        const temperature = weatherData.main.temp ?? "";
        const windSpeed = weatherData.wind.speed ?? "";
        const mainHumidity = weatherData.main.humidity ?? "";
        const mainAqi = aqiData ?? "";
        const mainPressure = weatherData.main.pressure ?? "";
        const mainRealFeel = weatherData.main.feels_like ?? "";
        const mainWeatherIconCode = weatherData.weather[0].icon ?? "";

        const aqiResult = {
            text: '',
            className: '',
        }
        if (aqiData > 100) {
            aqiResult.text = "Unhealthy";
            aqiResult.className = "bg-red";
        } else if (aqiData > 50) {
            aqiResult.text = "Moderate";
            aqiResult.className = "bg-yellow";
        } else if (aqiData === undefined) {
            aqiResult.text = "No Data";
            aqiResult.className = "bg-grey";
        } else {
            aqiResult.text = "Healthy";
            aqiResult.className = "bg-green";
        }

        // Create elements
        const cardContainer = document.createElement('div');
        const upperCard = document.createElement('div');
        const upperCardSection1 = document.createElement('div');
        const upperCardSection2 = document.createElement('div');
        const infoColumn1 = document.createElement('div');
        const infoColumn2 = document.createElement('div');
        const windText = document.createElement('p');
        const windSpeedText = document.createElement('p');
        const humidityText = document.createElement('p');
        const humidityValueText = document.createElement('p');
        const centerSection = document.createElement('div');
        const mainIconImg = document.createElement('img');
        const infoColumn3 = document.createElement('div');
        const temperatureText = document.createElement('p');
        const countryCityText = document.createElement('p');
        const lowerCard = document.createElement('div');
        const lowerCardRow = document.createElement('div');
        const lowerCardSection1 = document.createElement('div');
        const lowerCardSection2 = document.createElement('div');
        const lowerCardSection3 = document.createElement('div');
        const aqiText = document.createElement('p');
        const aqiValueText = document.createElement('p');
        const pressureText = document.createElement('p');
        const pressureValueText = document.createElement('p');
        const realFeelText = document.createElement('p');
        const realFeelValueText = document.createElement('p');
        const lowerCardFooter = document.createElement('div');
        const aqiResultText = document.createElement('p');

        // Set class names
        cardContainer.classList.add('card-container');
        upperCard.classList.add('upper-card');
        upperCardSection1.classList.add('upper-card-section');
        upperCardSection2.classList.add('upper-card-section');
        infoColumn1.classList.add('info-column');
        infoColumn2.classList.add('info-column');
        centerSection.classList.add('center-card');
        infoColumn3.classList.add('info-column');
        lowerCard.classList.add('lower-card');
        lowerCardRow.classList.add('lower-card-row');
        lowerCardSection1.classList.add('lower-card-section');
        lowerCardSection2.classList.add('lower-card-section');
        lowerCardSection3.classList.add('lower-card-section');
        lowerCardFooter.classList.add('lower-card-footer', aqiResult.className);
        windText.classList.add('text-sm');
        windSpeedText.classList.add('text-sm', 'weight-semi-bold');
        humidityText.classList.add('text-sm');
        humidityValueText.classList.add('text-sm', 'weight-semi-bold');
        temperatureText.classList.add('text-md', 'weight-semi-bold');
        countryCityText.classList.add('text-sm');
        aqiText.classList.add('text-sm');
        aqiValueText.classList.add('text-sm', 'weight-semi-bold');
        pressureText.classList.add('text-sm');
        pressureValueText.classList.add('text-sm', 'weight-semi-bold');
        realFeelText.classList.add('text-sm');
        realFeelValueText.classList.add('text-sm', 'weight-semi-bold');
        aqiResultText.classList.add('text-md', 'weight-semi-bold');


        // Set element attributes
        cardContainer.id = Utils.createUUID();
        mainIconImg.src = ApiController.getWeatherIconURL(mainWeatherIconCode);
        mainIconImg.alt = "Main Icon";

        // Set element content
        windText.textContent = 'Wind:';
        windSpeedText.textContent = `${windSpeed} m/s`;
        humidityText.textContent = 'Humidity';
        humidityValueText.textContent = `${mainHumidity} %`;
        temperatureText.textContent = temperature;
        countryCityText.textContent = `${country}${!!country && !!cityName ? ", " : " "}${cityName}`;
        aqiText.textContent = 'AQI:';
        aqiValueText.textContent = mainAqi;
        pressureText.textContent = 'Pressure:';
        pressureValueText.textContent = `${mainPressure} hPa`;
        realFeelText.textContent = 'Real Feel:';
        realFeelValueText.textContent = `${mainRealFeel} °C`;
        aqiResultText.textContent = aqiResult.text;

        // Append elements
        cardContainer.appendChild(upperCard);
        upperCard.appendChild(upperCardSection1);
        upperCard.appendChild(upperCardSection2);
        upperCardSection1.appendChild(SVGs.getSvg(SVGs.wind));
        upperCardSection1.appendChild(infoColumn1);
        infoColumn1.appendChild(windText);
        infoColumn1.appendChild(windSpeedText);
        upperCardSection2.appendChild(SVGs.getSvg(SVGs.humidity));
        upperCardSection2.appendChild(infoColumn2);
        infoColumn2.appendChild(humidityText);
        infoColumn2.appendChild(humidityValueText);
        cardContainer.appendChild(centerSection);
        centerSection.appendChild(mainIconImg);
        centerSection.appendChild(infoColumn3);
        infoColumn3.appendChild(temperatureText);
        infoColumn3.appendChild(countryCityText);
        cardContainer.appendChild(lowerCard);
        lowerCard.appendChild(lowerCardRow);
        lowerCardRow.appendChild(lowerCardSection1);
        lowerCardRow.appendChild(lowerCardSection2);
        lowerCardRow.appendChild(lowerCardSection3);
        lowerCardSection1.appendChild(SVGs.getSvg(SVGs.aqi));
        lowerCardSection1.appendChild(aqiText);
        lowerCardSection1.appendChild(aqiValueText);
        lowerCardSection2.appendChild(SVGs.getSvg(SVGs.pressure));
        lowerCardSection2.appendChild(pressureText);
        lowerCardSection2.appendChild(pressureValueText);
        lowerCardSection3.appendChild(SVGs.getSvg(SVGs.realFeel));
        lowerCardSection3.appendChild(realFeelText);
        lowerCardSection3.appendChild(realFeelValueText);
        lowerCard.appendChild(lowerCardFooter);
        lowerCardFooter.appendChild(aqiResultText);

        return cardContainer;
    }


    areaSelector(event, map, marker) {
        for (let city of cityArray) {
            if (event.target.textContent.includes(city["city"])) {
                let coordinate = city["coord"];
                map.setCenter(coordinate);
                map.setZoom(8);
                marker.setPosition(coordinate);
                this.updateMarkers(true).then();
            }
        }

    }

}

export default GoogleMapsController;
