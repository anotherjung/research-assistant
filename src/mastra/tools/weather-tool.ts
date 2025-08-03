import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

interface GeocodingResponse {
  results: {
    latitude: number;
    longitude: number;
    name: string;
  }[];
}

interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    weather_code: number;
  };
}

export const weatherTool = createTool({
  id: 'get-weather',
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name or location to get weather for'),
  }),
  outputSchema: z.object({
    temperature: z.number().describe('Current temperature in Celsius'),
    feelsLike: z.number().describe('Feels like temperature in Celsius'),
    humidity: z.number().describe('Relative humidity percentage'),
    windSpeed: z.number().describe('Wind speed in km/h'),
    windGust: z.number().describe('Wind gust speed in km/h'),
    conditions: z.string().describe('Weather conditions description'),
    location: z.string().describe('Location name'),
  }),
  execute: async ({ context }) => {
    console.log('[weather-tool] Starting execution with context:', JSON.stringify(context, null, 2));
    
    // Handle both direct input and nested inputData structure
    const location = context.location || context.inputData?.location;
    if (!location) {
      console.error('[weather-tool] Error: No location provided');
      throw new Error('Location is required');
    }
    
    console.log('[weather-tool] Getting weather for location:', location);
    const result = await getWeather(location);
    console.log('[weather-tool] Weather result:', JSON.stringify(result, null, 2));
    return result;
  },
});

const getWeather = async (location: string) => {
  try {
    console.log('[weather-tool:getWeather] Processing location:', location);
    
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
    console.log('[weather-tool:getWeather] Geocoding URL:', geocodingUrl);
    
    const geocodingResponse = await fetch(geocodingUrl);
    const geocodingData = (await geocodingResponse.json()) as GeocodingResponse;
    console.log('[weather-tool:getWeather] Geocoding response:', JSON.stringify(geocodingData, null, 2));

    if (!geocodingData.results?.[0]) {
      console.error('[weather-tool:getWeather] Location not found:', location);
      throw new Error(`Location '${location}' not found`);
    }

    const { latitude, longitude, name } = geocodingData.results[0];
    console.log('[weather-tool:getWeather] Found coordinates:', { latitude, longitude, name });

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;
    console.log('[weather-tool:getWeather] Weather API URL:', weatherUrl);

    const response = await fetch(weatherUrl);
    const data = (await response.json()) as WeatherResponse;
    console.log('[weather-tool:getWeather] Weather data:', JSON.stringify(data, null, 2));

    const result = {
      temperature: Math.round(data.current.temperature_2m * 10) / 10,
      feelsLike: Math.round(data.current.apparent_temperature * 10) / 10,
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m * 10) / 10,
      windGust: Math.round(data.current.wind_gusts_10m * 10) / 10,
      conditions: getWeatherCondition(data.current.weather_code),
      location: name,
    };
    
    console.log('[weather-tool:getWeather] Final weather result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Weather API error:', error);
    throw new Error(`Failed to get weather for ${location}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return conditions[code] || 'Unknown weather condition';
}