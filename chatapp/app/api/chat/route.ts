export const runtime = "nodejs";
export const maxDuration = 60;

// Available agents configuration
const AVAILABLE_AGENTS = {
  researchAgent: "http://localhost:4111/api/agents/researchAgent/stream",
  weatherAgent: "http://localhost:4111/api/agents/weatherAgent/stream",
} as const;

type AgentType = keyof typeof AVAILABLE_AGENTS;

// Weather query detection keywords
const WEATHER_KEYWORDS = [
  'weather', 'temperature', 'forecast', 'rain', 'sunny', 'cloudy', 'storm', 
  'humidity', 'wind', 'celsius', 'fahrenheit', 'climate', 'meteorology',
  'outdoor activities', 'plan activities', 'weekend plan', 'weather report'
];

function detectWeatherQuery(messages: any[]): boolean {
  if (!messages || !Array.isArray(messages)) return false;
  
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || !lastMessage.content) return false;
  
  // Handle both string and array content formats
  let content: string;
  if (Array.isArray(lastMessage.content)) {
    content = lastMessage.content
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join(' ');
  } else if (typeof lastMessage.content === 'string') {
    content = lastMessage.content;
  } else {
    return false;
  }
  
  return WEATHER_KEYWORDS.some(keyword => content.toLowerCase().includes(keyword.toLowerCase()));
}

export async function POST(req: Request) {
  try {
    const { messages, agent = 'researchAgent' } = await req.json();
    
    console.log('[API Route] Request received:', { 
      agent, 
      messageCount: messages?.length || 0,
      lastMessage: messages?.[messages.length - 1]?.content 
    });
    
    // Auto-detect weather queries
    const isWeatherQuery = detectWeatherQuery(messages);
    const selectedAgent = isWeatherQuery ? 'weatherAgent' : agent;
    
    console.log('[API Route] Agent selection:', { 
      originalAgent: agent, 
      detectedWeather: isWeatherQuery, 
      finalAgent: selectedAgent 
    });
    
    // Validate agent selection
    const validatedAgent = selectedAgent as AgentType;
    if (!AVAILABLE_AGENTS[validatedAgent]) {
      return new Response(
        JSON.stringify({ error: `Invalid agent: ${agent}. Available agents: ${Object.keys(AVAILABLE_AGENTS).join(', ')}` }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Transform messages to include required role field
    const transformedMessages = messages.map((msg: any) => ({
      ...msg,
      role: msg.role || 'user' // Default to 'user' role if not specified
    }));

    // Forward request to selected Mastra agent
    console.log('[API Route] Forwarding to agent:', validatedAgent);
    const response = await fetch(AVAILABLE_AGENTS[validatedAgent], {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'text/plain'
      },
      body: JSON.stringify({ messages: transformedMessages })
    });

    if (!response.ok) {
      throw new Error(`Agent API error: ${response.status} ${response.statusText}`);
    }

    // Stream the response back to the client
    return new Response(response.body, {
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Expose-Headers': 'Content-Length,X-Requested-With'
      }
    });

  } catch (error) {
    console.error('[API Route] Error:', error);
    console.error('[API Route] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
