import { google } from "@ai-sdk/google";
import { createVectorQueryTool } from "@mastra/rag";

export const vectorQueryTool = createVectorQueryTool({
  vectorStoreName: "pgVectorStore",
  indexName: "papers",
  model: google.textEmbeddingModel('text-embedding-004', {
    taskType: 'RETRIEVAL_QUERY',
  }),
  enableFilter: true, //can create a tool that enables metadata filtering. Each vector store has its own prompt that defines the supported filter operators and syntax
});