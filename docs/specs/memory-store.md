# Memory Store Implementation Guide

This guide explains the core components for building a research assistant using Mastra.ai with vector search over academic papers. It covers data indexing, agent configuration, and framework integration based on <mcfile name="store.ts" path="src/store.ts"></mcfile>, <mcfile name="researchAgent.ts" path="src/mastra/agents/researchAgent.ts"></mcfile>, <mcfile name="vector-query-tool.ts" path="src/mastra/tools/vector-query-tool.ts"></mcfile>, and <mcfile name="index.ts" path="src/mastra/index.ts"></mcfile>.

## 1. Data Indexing (`src/store.ts`)

This script loads an academic paper, processes it into chunks, generates embeddings, and stores them in a PostgreSQL vector database.

### Key Steps:
- **Load Paper**: Fetch HTML content from arXiv (e.g., Transformer paper).
- **Chunking**: Use `MDocument.fromText` and recursive chunking (size: 512, overlap: 50).
- **Embeddings**: Generate using Google `text-embedding-004` with `taskType: 'RETRIEVAL_DOCUMENT'` for optimized document retrieval. Process in batches of 100 to handle API limits. Each chunk's metadata now includes `excerptKeywords` for enhanced filtering.
- **Vector Store**: Use `mastra.getVector('pgVectorStore')` to create an index (`papers`, dimension 768) and upsert vectors with metadata.

**Run Command**: `npx bun src/store.ts` (Ensure `POSTGRES_CONNECTION_STRING` is set).

**Tips**: Add logging for debugging. Drop the table (`DROP TABLE IF EXISTS papers;`) before re-indexing to avoid duplicates.

## 2. Agent Configuration (<mcfile name="researchAgent.ts" path="src/mastra/agents/researchAgent.ts"></mcfile>)

Defines the `Research Assistant` agent with a vector query tool for semantic search.

### Key Components:
- **Vector Query Tool**: The `vectorQueryTool` is now defined in <mcfile name="vector-query-tool.ts" path="src/mastra/tools/vector-query-tool.ts"></mcfile> and imported into `researchAgent.ts`. It is configured with `vectorStoreName: 'pgVectorStore'`, index `papers`, and query model `text-embedding-004` (`taskType: 'RETRIEVAL_QUERY'`).
- **Agent Setup**: Uses `gemini-2.5-flash` model. Instructions mandate using the tool with `queryText` (extracted from user prompt) and `topK` (default 5). Responses based solely on tool results. The agent is now aware of the `excerptKeywords` in the metadata for filtering purposes.

**Integration**: Export the agent for registration in Mastra.

## 3. Mastra Framework Setup (`src/mastra/index.ts`)

Initializes the Mastra instance and registers components.

### Key Configuration:
- **Vector Store**: Instantiate `PgVector` with PostgreSQL connection.
- **Registration**: Pass agents (e.g., `researchAgent`), workflows, vectors (`pgVectorStore`), in-memory storage (`LibSQLStore`), and Pino logger.

**Environment**: Set `POSTGRES_CONNECTION_STRING` for the vector store.

## Overall Flow
1. Index data using `store.ts`.
2. Query via the agent, which uses the vector tool to retrieve and respond.
3. Run the app with `mastra dev` for testing.

## Best Practices
- Ensure embedding dimensions match (768).
- Use appropriate `taskType` for queries vs. documents.
- Handle errors like vector name mismatches.
- For production, persist storage and add evaluations.

Refer to Mastra docs for advanced features like workflows or additional agents.