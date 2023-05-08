import GoogleMapsController from "./google-maps-controller.js";

/**
 * The main entry point for the front-end.
 * This class is responsible for initializing the Google Maps API and the Google Places API.
 */
class Runner {

    /**
     * Initializes the controller and the APIs.
     */
    static run() {
        let mapElement = document.getElementById('map');
        let googleMapsController = new GoogleMapsController(mapElement);

        window.initMap = async () => await googleMapsController.initMap();

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GoogleMapsController.GoogleApiKey}&libraries=places,geometry&callback=initMap`;
        script.defer = true;
        document.body.appendChild(script);
    }
}

// Run the application.
document.addEventListener('DOMContentLoaded', () => Runner.run());
