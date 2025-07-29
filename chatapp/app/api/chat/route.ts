export const runtime = "nodejs";
export const maxDuration = 60;

// Available agents configuration
const AVAILABLE_AGENTS = {
  researchAgent: "http://localhost:4111/api/agents/researchAgent/stream",
  weatherAgent: "http://localhost:4111/api/agents/weatherAgent/stream",
} as const;

type AgentType = keyof typeof AVAILABLE_AGENTS;

export async function POST(req: Request) {
  try {
    const { messages, agent = 'researchAgent' } = await req.json();
    
    // Validate agent selection
    const selectedAgent = agent as AgentType;
    if (!AVAILABLE_AGENTS[selectedAgent]) {
      return new Response(
        JSON.stringify({ error: `Invalid agent: ${agent}. Available agents: ${Object.keys(AVAILABLE_AGENTS).join(', ')}` }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Forward request to selected Mastra agent
    const response = await fetch(AVAILABLE_AGENTS[selectedAgent], {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'text/plain'
      },
      body: JSON.stringify({ messages })
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
    console.error('API route error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
