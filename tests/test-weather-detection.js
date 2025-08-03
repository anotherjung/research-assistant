// Test script for weather query detection
const WEATHER_KEYWORDS = [
  'weather', 'temperature', 'forecast', 'rain', 'sunny', 'cloudy', 'storm', 
  'humidity', 'wind', 'celsius', 'fahrenheit', 'climate', 'meteorology',
  'outdoor activities', 'plan activities', 'weekend plan', 'weather report'
];

function detectWeatherQuery(messages) {
  if (!messages || !Array.isArray(messages)) return false;
  
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || !lastMessage.content) return false;
  
  const content = lastMessage.content.toLowerCase();
  return WEATHER_KEYWORDS.some(keyword => content.includes(keyword.toLowerCase()));
}

// Test cases
const testCases = [
  { messages: [{ content: "What's the weather in Tokyo?" }], expected: true },
  { messages: [{ content: "Plan activities for this weekend" }], expected: true },
  { messages: [{ content: "Explain neural networks" }], expected: false },
  { messages: [{ content: "Is it going to rain tomorrow?" }], expected: true },
  { messages: [{ content: "Temperature in San Francisco" }], expected: true },
  { messages: [{ content: "Research quantum computing" }], expected: false }
];

console.log('Testing weather query detection...');
testCases.forEach((test, index) => {
  const result = detectWeatherQuery(test.messages);
  const passed = result === test.expected;
  console.log(`Test ${index + 1}: ${test.messages[0].content} => ${result} ${passed ? '✓' : '✗'}`);
});

console.log('Weather detection test complete!');