mapboxgl.accessToken = 'pk.eyJ1IjoibWFoZGlraGFuYmVpZ2kiLCJhIjoiY2swbm9tcWUyMDFvZTNpbnp2MnlxajhsNyJ9.vKSxxoBMZ3FuV_hHRXFQTQ';

// Initialize the Mapbox GL map
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [0, 0], // Initial longitude and latitude coordinates
    zoom: 3
});

// Create an empty custom marker element
const emptyMarkerElement = document.createElement('div');
emptyMarkerElement.className = 'custom-marker';

// Add a draggable marker to the map with the custom marker element
let marker = createMarker(0, 0, emptyMarkerElement);

function createMarker(lat, lng, markerElement) {
    const newMarker = new mapboxgl.Marker({
        element: markerElement,
        draggable: true
    }).setLngLat([lng, lat]).addTo(map);

    newMarker.on('dragend', handleMarkerUpdate);
    return newMarker;
}

// Function to fetch weather data
async function fetchWeatherData(lat, lng) {
    const weatherApiKey = '3f171dd2f33fcfa66e7d8971457c3922';
    const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${weatherApiKey}`;

    try {
        const response = await axios.get(weatherApiUrl);
        const data = response.data;
        console.log(data);

        // Get the weather condition code
        const weatherConditionCode = data.weather[0].id;

        // Create a custom marker element
        const newMarkerElement = document.createElement('div');
        newMarkerElement.className = 'custom-marker';

        // Add the weather icon to the marker element
        const weatherIcon = document.createElement('i');
        weatherIcon.className = `wi wi-owm-${weatherConditionCode}`;
        newMarkerElement.appendChild(weatherIcon);

        // Add a default marker background
        const markerBackground = document.createElement('div');
        markerBackground.className = 'marker-background';
        newMarkerElement.appendChild(markerBackground);

        // Replace the existing marker with a new one
        marker.remove();
        marker = createMarker(lat, lng, newMarkerElement); } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

// Function to fetch nearby cities
async function fetchNearbyCities(lat, lng) {
    const geocodingApiKey = '5b7242a7d48646f99f7fa9c017a49b48';
    const geocodingApiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${geocodingApiKey}`;

    try {
        const response = await axios.get(geocodingApiUrl);
        const data = response.data;
        console.log(data);
    } catch (error) {
        console.error('Error fetching nearby cities:', error);
    }
}

// Function to handle marker updates
function handleMarkerUpdate() {
    const coordinates = marker.getLngLat();
    fetchWeatherData(coordinates.lat, coordinates.lng);
    fetchNearbyCities(coordinates.lat, coordinates.lng);
}

// Add event listeners for marker dragend and click events
marker.on('dragend', handleMarkerUpdate);
map.on('click', (event) => {
    const coordinates = event.lngLat;
    marker.setLngLat(coordinates);
    handleMarkerUpdate();
});
