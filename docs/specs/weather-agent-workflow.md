# Weather Agent Workflow Specification

**Status**: DONE  
**Version**: 1.0  
**Last Updated**: July 29, 2025

## Overview

The Weather Agent Workflow is a two-step Mastra framework implementation that provides weather-based activity recommendations. It combines weather data retrieval with AI-powered activity planning to deliver personalized suggestions.

## Architecture Components

### Workflow Structure
- **Type**: Sequential two-step workflow
- **Framework**: Mastra Core Workflows
- **Input**: City name (string)
- **Output**: Formatted activity recommendations (string)

### Step Definitions

#### Step 1: fetchWeather
- **ID**: `fetch-weather`
- **Purpose**: Retrieve weather forecast data for specified city
- **Input Schema**: `{ city: string }`
- **Output Schema**: Forecast object with temperature, precipitation, and conditions
- **External APIs**:
  - Open-Meteo Geocoding API
  - Open-Meteo Weather Forecast API

#### Step 2: planActivities  
- **ID**: `plan-activities`
- **Purpose**: Generate AI-powered activity suggestions based on weather
- **Input Schema**: Forecast data from Step 1
- **Output Schema**: `{ activities: string }`
- **AI Integration**: Uses `weatherAgent` for natural language generation

## Data Flow

```
City Name -> Geocoding -> Weather Data -> AI Agent -> Activity Recommendations
```

### Data Transformation
1. **City -> Coordinates**: Geocoding API resolves city to lat/lng
2. **Coordinates -> Weather**: Forecast API returns detailed weather data
3. **Weather -> Forecast Object**: Structured data with temperature ranges, conditions, precipitation
4. **Forecast -> Activities**: AI agent generates formatted activity suggestions

## API Integration Details

### Open-Meteo APIs
- **Geocoding Endpoint**: `https://geocoding-api.open-meteo.com/v1/search`
- **Weather Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Data Retrieved**: Current conditions, hourly temperature, precipitation probability

### Weather Code Mapping
Converts numeric weather codes to human-readable conditions:
- Clear conditions: 0-3
- Precipitation: 51-67, 80-82  
- Snow: 71-77, 85-86
- Severe weather: 95-99

## AI Agent Integration

### Agent Requirements
- **Agent ID**: `weatherAgent`
- **Model**: Claude 3.5 Sonnet (as configured in project)
- **Role**: Activity recommendation generation

### Prompt Structure
- Weather summary with location context
- Structured formatting requirements with text markers
- Time-based activity categorization (morning/afternoon)
- Indoor/outdoor alternatives based on conditions
- Location-specific venue suggestions

### Output Format
```
[DATE] [Day, Month Date, Year]
===============================
[WEATHER] WEATHER SUMMARY
[MORNING] MORNING ACTIVITIES  
[AFTERNOON] AFTERNOON ACTIVITIES
[INDOOR] INDOOR ALTERNATIVES
[WARNING] SPECIAL CONSIDERATIONS
```

## Error Handling

### Location Resolution
- **Error**: Location not found
- **Response**: Throw error with descriptive message
- **Recovery**: User must provide valid city name

### Weather Data
- **Error**: API unavailable or invalid response
- **Response**: Propagate fetch errors
- **Recovery**: Retry mechanism at application level

### Agent Integration
- **Error**: Weather agent not found
- **Response**: Throw configuration error
- **Recovery**: Verify Mastra agent configuration

## Performance Considerations

### API Calls
- **Geocoding**: Single request per city lookup
- **Weather**: Single forecast request with multiple data points
- **Caching**: No built-in caching (implement at application level)

### AI Generation
- **Streaming**: Uses agent.stream() for progressive output
- **Token Usage**: Moderate consumption for activity generation
- **Response Time**: 2-5 seconds typical for complete workflow

## Configuration Requirements

### Environment
- No API keys required (Open-Meteo is free)
- Network access to Open-Meteo APIs
- Mastra framework with agent configuration

### Dependencies
- `@mastra/core/workflows`
- `zod` for schema validation
- Configured weather agent in Mastra instance

## Usage Examples

### Basic Workflow Execution
```typescript
const result = await weatherWorkflow.execute({
  input: { city: "San Francisco" }
});
console.log(result.activities);
```

### Integration Points
- Can be triggered from API endpoints
- Suitable for chatbot integration
- Works with Mastra workflow orchestration

## Related Components

### Weather Tool (`weather-tool.ts`)
- **Purpose**: Simple current weather queries
- **Difference**: No AI integration, current conditions only
- **Use Case**: Agent tool consumption vs. end-user workflow

### Shared Utilities
- `getWeatherCondition()`: Weather code mapping
- Common API endpoints and error patterns
- Consistent TypeScript interfaces

## Future Enhancements

### TODO Items
- Add caching layer for geocoding results
- Implement weather alert integration
- Support for multi-day forecasts
- Localization for international cities

### PENDING Considerations
- Rate limiting for API calls
- Fallback weather data sources
- Enhanced error recovery mechanisms

## Testing Strategy

### Unit Tests
- Mock API responses for consistent testing
- Validate schema transformations
- Test error conditions and edge cases

### Integration Tests  
- End-to-end workflow execution
- API availability and response validation
- Agent integration verification

---

*Generated from weather-workflow.ts analysis | Mastra Framework Documentation*