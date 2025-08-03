import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

const forecastSchema = z.object({
  date: z.string(),
  maxTemp: z.number(),
  minTemp: z.number(),
  precipitationChance: z.number(),
  condition: z.string(),
  location: z.string(),
});

function generateActivitiesFromForecast(forecast: any) {
  const { location, maxTemp, minTemp, precipitationChance, condition } = forecast;
  
  let activities = `📅 Weather Activity Plan for ${location}
═══════════════════════════

🌡️ WEATHER SUMMARY
• Conditions: ${condition}
• Temperature: ${minTemp}°C to ${maxTemp}°C
• Precipitation: ${precipitationChance}% chance

`;

  if (precipitationChance > 50) {
    activities += `🌧️ RAINY DAY ACTIVITIES
• Indoor museums and galleries
• Shopping centers and cafes
• Movie theaters and entertainment venues
• Indoor sports facilities

`;
  } else if (maxTemp > 30) {
    activities += `☀️ HOT WEATHER ACTIVITIES
• Early morning outdoor activities
• Water-based activities (pools, beaches)
• Evening outdoor dining
• Air-conditioned indoor venues

`;
  } else if (maxTemp < 10) {
    activities += `❄️ COLD WEATHER ACTIVITIES
• Indoor heated venues
• Warm outdoor activities with proper clothing
• Hot beverage venues and cozy restaurants
• Indoor entertainment and shopping

`;
  } else {
    activities += `🌤️ PERFECT WEATHER ACTIVITIES
• Outdoor parks and nature walks
• Outdoor dining and cafes
• Sports and recreational activities
• Local sightseeing and tours

`;
  }

  activities += `🏠 INDOOR ALTERNATIVES
• Local museums and cultural centers
• Shopping malls and markets
• Restaurants and cafes
• Indoor entertainment venues

⚠️ RECOMMENDATIONS
• Check local weather updates before outdoor activities
• Dress appropriately for the temperature range
• Have indoor backup plans ready
• Stay hydrated and protected from sun/weather`;

  return activities;
}

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
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    95: 'Thunderstorm',
  };
  return conditions[code] || 'Unknown';
}

const fetchWeather = createStep({
  id: 'fetch-weather',
  description: 'Fetches weather forecast for a given city',
  inputSchema: z.object({
    location: z.string().describe('The city to get the weather for'),
  }),
  outputSchema: forecastSchema,
  execute: async ({ inputData }) => {
    console.log('[weather-workflow:fetchWeather] Starting with input:', JSON.stringify(inputData, null, 2));
    
    if (!inputData) {
      console.error('[weather-workflow:fetchWeather] Error: No input data provided');
      throw new Error('Input data not found');
    }

    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(inputData.location)}&count=1`;
    console.log('[weather-workflow:fetchWeather] Geocoding URL:', geocodingUrl);
    
    const geocodingResponse = await fetch(geocodingUrl);
    const geocodingData = (await geocodingResponse.json()) as {
      results: { latitude: number; longitude: number; name: string }[];
    };
    
    console.log('[weather-workflow:fetchWeather] Geocoding response:', JSON.stringify(geocodingData, null, 2));

    if (!geocodingData.results?.[0]) {
      console.error('[weather-workflow:fetchWeather] Location not found:', inputData.location);
      throw new Error(`Location '${inputData.location}' not found`);
    }

    const { latitude, longitude, name } = geocodingData.results[0];
    console.log('[weather-workflow:fetchWeather] Found location:', { latitude, longitude, name });

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=precipitation,weathercode&timezone=auto,&hourly=precipitation_probability,temperature_2m`;
    console.log('[weather-workflow:fetchWeather] Weather API URL:', weatherUrl);
    
    const response = await fetch(weatherUrl);
    const data = (await response.json()) as {
      current: {
        time: string;
        precipitation: number;
        weathercode: number;
      };
      hourly: {
        precipitation_probability: number[];
        temperature_2m: number[];
      };
    };
    
    console.log('[weather-workflow:fetchWeather] Weather API response:', JSON.stringify(data, null, 2));

    const forecast = {
      date: new Date().toISOString(),
      maxTemp: Math.max(...data.hourly.temperature_2m),
      minTemp: Math.min(...data.hourly.temperature_2m),
      condition: getWeatherCondition(data.current.weathercode),
      precipitationChance: data.hourly.precipitation_probability.reduce(
        (acc, curr) => Math.max(acc, curr),
        0,
      ),
      location: name,
    };
    
    console.log('[weather-workflow:fetchWeather] Generated forecast:', JSON.stringify(forecast, null, 2));
    return forecast;
  },
});

const planActivities = createStep({
  id: 'plan-activities',
  description: 'Suggests activities based on weather conditions',
  inputSchema: forecastSchema,
  outputSchema: z.object({
    activities: z.string(),
  }),
  execute: async ({ inputData }) => {
    console.log('[weather-workflow:planActivities] Starting with input:', JSON.stringify(inputData, null, 2));
    
    const forecast = inputData;

    if (!forecast) {
      console.error('[weather-workflow:planActivities] Error: No forecast data provided');
      throw new Error('Forecast data not found');
    }

    console.log('[weather-workflow:planActivities] Generating activities for forecast:', forecast.location);
    
    // Create a simple activity planning response based on weather data
    // This avoids circular dependency with the weather agent
    const activities = generateActivitiesFromForecast(forecast);
    
    console.log('[weather-workflow:planActivities] Generated activities successfully');
    
    return {
      activities: activities,
    };
  },
});

const weatherWorkflow = createWorkflow({
  id: 'weather-workflow',
  inputSchema: z.object({
    location: z.string().describe('The city to get the weather for'),
  }),
  outputSchema: z.object({
    activities: z.string(),
  }),
})
  .then(fetchWeather)
  .then(planActivities);

weatherWorkflow.commit();

export { weatherWorkflow };
