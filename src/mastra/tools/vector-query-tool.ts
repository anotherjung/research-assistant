import { google } from "@ai-sdk/google";
import { createVectorQueryTool } from "@mastra/rag";

export const vectorQueryTool = createVectorQueryTool({
  vectorStoreName: "pgVectorStore",
  indexName: "papers",
  model: google.textEmbeddingModel('text-embedding-004', {
    taskType: 'RETRIEVAL_QUERY',
  }),
});