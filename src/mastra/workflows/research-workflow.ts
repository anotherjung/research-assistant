import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// Schema definitions
const researchQuerySchema = z.object({
  query: z.string().describe('The research question or topic to investigate'),
  topK: z.number().default(5).describe('Number of documents to retrieve'),
  includeExternalSources: z.boolean().default(true).describe('Whether to include external sources via MCP'),
  analysisDepth: z.enum(['basic', 'detailed', 'comprehensive']).default('detailed'),
});

const vectorResultSchema = z.object({
  chunks: z.array(z.object({
    text: z.string(),
    source: z.string(),
    excerptKeywords: z.string(),
    score: z.number().optional(),
  })),
  query: z.string(),
  topK: z.number(),
});

const enhancedResultSchema = z.object({
  vectorResults: vectorResultSchema,
  externalContext: z.array(z.object({
    source: z.string(),
    content: z.string(),
    relevance: z.number(),
  })),
  searchTerms: z.array(z.string()),
});

const researchReportSchema = z.object({
  query: z.string(),
  summary: z.string(),
  keyFindings: z.array(z.string()),
  thoughtProcess: z.string(),
  sources: z.array(z.string()),
  confidence: z.number(),
  recommendations: z.array(z.string()),
  executedAt: z.string(),
});

// Step 1: Execute vector search using research agent
const executeVectorSearch = createStep({
  id: 'execute-vector-search',
  description: 'Executes vector search against the local knowledge base using research agent',
  inputSchema: researchQuerySchema,
  outputSchema: vectorResultSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Research query input not found');
    }

    const agent = mastra?.getAgent('researchAgent');
    if (!agent) {
      throw new Error('Research agent not found');
    }

    // The research agent automatically uses vectorQueryTool based on its instructions
    const response = await agent.stream([{
      role: 'user',
      content: `Research the following topic and provide detailed information: ${inputData.query}. Please search for ${inputData.topK} relevant documents.`,
    }]);

    let responseText = '';
    for await (const chunk of response.textStream) {
      responseText += chunk;
    }

    // Parse response to extract structured data
    // Note: In a real implementation, you might want to modify the agent to return structured data
    const chunks = extractChunksFromResponse(responseText);

    return {
      chunks,
      query: inputData.query,
      topK: inputData.topK,
    };
  },
});

// Step 2: Enhance with external context (MCP integration placeholder)
const enhanceWithExternalSources = createStep({
  id: 'enhance-external-sources',
  description: 'Enhances research with external sources via MCP tools',
  inputSchema: vectorResultSchema.extend({
    includeExternalSources: z.boolean(),
    analysisDepth: z.enum(['basic', 'detailed', 'comprehensive']),
  }),
  outputSchema: enhancedResultSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error('Vector search results not found');
    }

    // Extract search terms from the query for external searches
    const searchTerms = extractSearchTerms(inputData.query);
    
    // Placeholder for MCP external context gathering
    const externalContext = inputData.includeExternalSources 
      ? await gatherExternalContext(inputData.query, searchTerms)
      : [];

    return {
      vectorResults: inputData,
      externalContext,
      searchTerms,
    };
  },
});

// Step 3: Generate comprehensive research report
const generateResearchReport = createStep({
  id: 'generate-research-report',
  description: 'Generates comprehensive research report using research agent',
  inputSchema: enhancedResultSchema.extend({
    analysisDepth: z.enum(['basic', 'detailed', 'comprehensive']),
  }),
  outputSchema: researchReportSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Enhanced results not found');
    }

    const agent = mastra?.getAgent('researchAgent');
    if (!agent) {
      throw new Error('Research agent not found');
    }

    // Construct comprehensive analysis prompt
    const analysisPrompt = buildAnalysisPrompt(
      inputData.vectorResults.query,
      inputData.vectorResults.chunks,
      inputData.externalContext,
      inputData.analysisDepth
    );

    const response = await agent.stream([{
      role: 'user',
      content: analysisPrompt,
    }]);

    let analysisText = '';
    for await (const chunk of response.textStream) {
      analysisText += chunk;
    }

    // Parse the structured response
    const analysis = parseAnalysisResponse(analysisText);
    
    // Compile sources
    const sources = [
      ...inputData.vectorResults.chunks.map(chunk => chunk.source),
      ...inputData.externalContext.map(ctx => ctx.source),
    ];

    // Generate recommendations
    const recommendations = generateRecommendations(
      analysis,
      inputData.vectorResults.chunks,
      inputData.externalContext
    );

    return {
      query: inputData.vectorResults.query,
      summary: analysis.summary,
      keyFindings: analysis.keyFindings,
      thoughtProcess: analysis.thoughtProcess,
      sources: [...new Set(sources)], // Remove duplicates
      confidence: analysis.confidence,
      recommendations,
      executedAt: new Date().toISOString(),
    };
  },
});

// Create the research workflow
const researchWorkflow = createWorkflow({
  id: 'research-workflow',
  inputSchema: researchQuerySchema,
  outputSchema: researchReportSchema,
})
  .then(executeVectorSearch)
  .then(enhanceWithExternalSources)
  .then(generateResearchReport);

// Utility functions
function extractSearchTerms(query: string): string[] {
  // Simple keyword extraction - could be enhanced with NLP
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(term => term.length > 2)
    .slice(0, 10); // Limit to top 10 terms
}

function extractChunksFromResponse(responseText: string): any[] {
  // Parse the agent's response to extract vector search results
  // This is a simplified implementation - in practice, you'd want structured output
  const lines = responseText.split('\n');
  const chunks = [];
  
  // Look for patterns that indicate retrieved documents
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('source:') || line.includes('Source:')) {
      // Extract source information
      const source = line.split(':')[1]?.trim() || 'Unknown';
      const text = lines[i + 1]?.trim() || '';
      const keywords = extractSearchTerms(text).join(', ');
      
      if (text) {
        chunks.push({
          text,
          source,
          excerptKeywords: keywords,
          score: 0.8, // Placeholder score
        });
      }
    }
  }
  
  // Fallback: create a single chunk from the entire response
  if (chunks.length === 0) {
    chunks.push({
      text: responseText.substring(0, 500), // First 500 chars
      source: 'Research Agent Analysis',
      excerptKeywords: extractSearchTerms(responseText).slice(0, 5).join(', '),
      score: 0.7,
    });
  }
  
  return chunks;
}

async function gatherExternalContext(query: string, searchTerms: string[]): Promise<any[]> {
  // Placeholder for MCP tool integration
  // In a real implementation, this would:
  // 1. Use web search MCP tools
  // 2. Query academic databases (arXiv, PubMed)
  // 3. Access external APIs through MCP
  
  // For now, return placeholder external context
  return [
    {
      source: 'External Academic Database',
      content: `Related research on ${query} suggests additional context is available.`,
      relevance: 0.75,
    },
    {
      source: 'Web Search Results',
      content: `Recent developments in ${searchTerms.join(', ')} provide supplementary information.`,
      relevance: 0.65,
    },
  ];
}

function buildAnalysisPrompt(
  query: string,
  vectorChunks: any[],
  externalContext: any[],
  analysisDepth: string
): string {
  const vectorContent = vectorChunks.map(chunk => 
    `Source: ${chunk.source}\nContent: ${chunk.text}\nKeywords: ${chunk.excerptKeywords}`
  ).join('\n\n');

  const externalContent = externalContext.map(ctx =>
    `Source: ${ctx.source}\nContent: ${ctx.content}\nRelevance: ${ctx.relevance}`
  ).join('\n\n');

  return `
Please provide a comprehensive analysis of the research query: "${query}"

Analysis Depth: ${analysisDepth}

VECTOR SEARCH RESULTS:
${vectorContent}

EXTERNAL CONTEXT:
${externalContent}

Please follow your standard Chain of Thought format and provide a structured analysis that includes:

1. A clear summary of the findings (2-3 sentences)
2. Key findings as bullet points (3-5 main insights)
3. Your complete thought process
4. A confidence level (0.0 to 1.0)
5. Any important limitations or caveats

Structure your response clearly with sections for:
- THOUGHT PROCESS
- FINAL ANSWER with summary, key findings, and confidence level

Focus on synthesizing information from both the vector search results and external context to provide the most comprehensive analysis possible.
`;
}

function parseAnalysisResponse(responseText: string): any {
  // Parse the agent's structured response
  // This is a simplified parser - could be enhanced with better NLP
  
  const sections = responseText.split(/(?:THOUGHT PROCESS:|FINAL ANSWER:)/i);
  const thoughtProcess = sections[1]?.trim() || responseText;
  const finalAnswer = sections[2]?.trim() || responseText;
  
  // Extract summary (look for summary-like content)
  const summaryMatch = finalAnswer.match(/summary[:\-]?\s*(.+?)(?:\n|$)/i);
  const summary = summaryMatch?.[1]?.trim() || 'Analysis completed based on available sources.';
  
  // Extract key findings (look for bullet points or numbered lists)
  const findingsMatches = finalAnswer.match(/(?:key findings?|findings?|insights?)[:\-]?\s*((?:[\-\*•]\s*.+(?:\n|$))+)/i);
  const keyFindings = findingsMatches?.[1]
    ?.split('\n')
    .map(line => line.replace(/^[\-\*•]\s*/, '').trim())
    .filter(line => line.length > 0) || ['Analysis findings compiled from available sources.'];
  
  // Extract confidence level
  const confidenceMatch = finalAnswer.match(/confidence[:\-]?\s*(\d*\.?\d+)/i);
  const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.8;
  
  return {
    summary,
    keyFindings,
    thoughtProcess,
    confidence: Math.min(Math.max(confidence, 0), 1), // Clamp between 0 and 1
  };
}

function generateRecommendations(
  analysis: any,
  vectorChunks: any[],
  externalContext: any[]
): string[] {
  const recommendations = [];
  
  // Based on confidence level
  if (analysis.confidence < 0.7) {
    recommendations.push('Consider gathering additional sources to improve confidence in findings');
  }
  
  // Based on source diversity
  const uniqueSources = new Set([
    ...vectorChunks.map(chunk => chunk.source),
    ...externalContext.map(ctx => ctx.source)
  ]);
  
  if (uniqueSources.size < 3) {
    recommendations.push('Expand research to include more diverse sources for comprehensive coverage');
  }
  
  // General recommendations
  recommendations.push('Validate findings with primary research publications when available');
  recommendations.push('Consider recent developments and ongoing research in this field');
  
  if (externalContext.length === 0) {
    recommendations.push('Enable external sources for broader research coverage');
  }
  
  return recommendations;
}

// Commit and export the workflow  
researchWorkflow.commit();

export { researchWorkflow };