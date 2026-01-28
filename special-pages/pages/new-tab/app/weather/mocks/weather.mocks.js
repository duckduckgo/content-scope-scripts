/**
 * @import { WeatherData } from "../../../types/new-tab";
 * @type {Record<string, WeatherData>}
 */
export const weatherMocks = {
    sydney: {
        temperature: 25,
        apparentTemperature: 27,
        conditionCode: 'sunny',
        location: 'Sydney, AU',
        humidity: 65,
        windSpeed: 12,
    },
    london: {
        temperature: 12,
        apparentTemperature: 10,
        conditionCode: 'cloudy',
        location: 'London, UK',
        humidity: 80,
        windSpeed: 18,
    },
    nyc: {
        temperature: 18,
        apparentTemperature: 16,
        conditionCode: 'partlyCloudy',
        location: 'New York, US',
        humidity: 55,
        windSpeed: 22,
    },
    tokyo: {
        temperature: 22,
        apparentTemperature: 24,
        conditionCode: 'rainy',
        location: 'Tokyo, JP',
        humidity: 90,
        windSpeed: 8,
    },
    dubai: {
        temperature: 38,
        apparentTemperature: 42,
        conditionCode: 'sunny',
        location: 'Dubai, AE',
        humidity: 30,
        windSpeed: 15,
    },
    cold: {
        temperature: -10,
        apparentTemperature: -15,
        conditionCode: 'snowy',
        location: 'Reykjavik, IS',
        humidity: 70,
        windSpeed: 25,
    },
};
