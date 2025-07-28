import { Agent } from "@mastra/core/agent";
import { google } from "@ai-sdk/google";
import { vectorQueryTool } from "../tools/vector-query-tool";
 
export const researchAgent = new Agent({
  name: "Research Assistant",
  instructions: `You are a helpful research assistant that analyzes academic papers and technical documents.
    When the user asks a question, you MUST use the vectorQueryTool to find relevant information.
    To use the tool, you need to provide a 'queryText' and a 'topK' value.
    - 'queryText': Extract the main topic or question from the user's prompt to use as the search query.
    - 'topK': Use a default value of 5 unless the user specifies a different number of results.
    Base your responses only on the content provided by the tool, not on general knowledge.
    If the tool returns no relevant information, inform the user that you could not find an answer in the documents.`,
  model: google("gemini-2.5-flash"),
  tools: {
    vectorQueryTool,
  },
});