const nock = require('nock');
const ApiController = require('./api_controller.js');
const axios = require('axios');
// Mock Google Maps services
global.google = {
    maps: {
        LatLng: function(lat, lng) {
            return { lat: lat, lng: lng };
        },
        places: {
            PlacesServiceStatus: {
                OK: "OK"
            },
            PlacesService: class {
                textSearch(request, callback) {
                    setTimeout(() => {
                        callback([{
                            name: "Mock City",
                            geometry: { location: { lat: () => 123, lng: () => 456 } }
                        }], "OK");
                    }, 0);
                }
            }
        }
    }
};
// Mock axios
describe('ApiController', () => {
    afterEach(() => {
        nock.cleanAll();
    });

    test('getAQI', async () => {
        const lat = 40.7128;
        const lng = -74.0060;

        nock('http://api.airvisual.com')
            .get('/v2/nearest_city')
            .query({
                lat,
                lon: lng,
                key: 'f5827a18-9aee-4c49-a4f7-7aaa4ee1d336',
            })
            .reply(200, {
                data: {
                    current: {
                        pollution: {
                            aqius: 42,
                        },
                    },
                },
            });

        const result = await ApiController.getAQI(lat, lng);
        expect(result).toBe(42);
    });
    test('getWeather', async () => {
        const lat = 40.7128;
        const lng = -74.0060;

        nock('https://api.openweathermap.org')
            .get('/data/2.5/weather')
            .query({
                lat,
                lon: lng,
                appid: '3f171dd2f33fcfa66e7d8971457c3922',
                units: 'metric',
            })
            .reply(200, {
                weather: [{
                    id: 200,
                    main: "Thunderstorm",
                    description: "thunderstorm with light rain",
                    icon: "11d"
                }],
                main: {
                    temp: 28.55,
                },
            });

        const result = await ApiController.getWeather(lat, lng);
        expect(result.weather[0].main).toBe('Thunderstorm');
        expect(result.main.temp).toBe(28.55);
    });
    test('getNearbyCities', async () => {
        const lat = 40.7128;
        const lng = -74.0060;
        const map = {};  // Not actually used in this test

        const result = await ApiController.getNearbyCities(lat, lng, map);
        expect(result[0].name).toBe('Mock City');
        expect(result[0].latitude).toBe(123);
        expect(result[0].longitude).toBe(456);
    });
});
