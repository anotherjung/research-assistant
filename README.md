# Mastra Guide Research Assistant

This is a research assistant that uses Mastra to answer questions about academic papers and technical documents.

## Installation

```bash
pnpm i @mastra/core@latest @mastra/rag@latest @mastra/pg@latest ai@latest zod@latest
```

Set environment variable:

```bash
export POSTGRES_CONNECTION_STRING=postgresql://postgres:postgres@localhost:5432/postgres
```

Create files:

```bash
touch src/mastra/agents/researchAgent.ts
touch src/mastra/index.ts src/store.ts src/index.ts
```

## Understanding Document Chunking and Embeddings

The `doc.chunk({...})` method prepares documents for Retrieval-Augmented Generation (RAG) in Mastra by breaking them into chunks and converting to embeddings.

Parameter breakdown:

- **strategy: "recursive"**: Splits content based on structure (e.g., paragraphs, sentences) to preserve meaning.
- **size: 512**: Target maximum chunk length.
- **overlap: 50**: Overlap between chunks for context continuity.
- **separator: "\n"**: Splits at newlines.

The `text-embedding-004` model outputs 768-dimensional vectors for similarity searches.

## Creating the Vector Index

- Expected to max CPU on shared micro instances.
- Do not run `ask run cmd`.
- Run `npx bun src/store.ts`.

```typescript
// src/store.ts
// Create an index for our paper chunks
await vectorStore.createIndex({
  indexName: "papers",
  dimension: 768, // text-embedding-004 outputs 768 dimensions
});
```

## Changing the Embedding Model

- Run SQL: `DROP TABLE IF EXISTS papers;`
- Switch to a model with different dimensions (e.g., 1536 for some OpenAI models).
- Recreate the index with matching dimensionality.

```sql
DROP TABLE IF EXISTS papers;
```

## Sample Queries and Responses

### Query: What problems does sequence modeling face with neural networks?

**Basic Response**: The primary challenge is its sequential nature, preventing parallelization and limiting batching due to memory constraints.

**After Metadata Filtering**: The sequential nature of RNNs prevents parallelization, critical for longer sequences where memory limits batching.

**With Chain-of-Thought**: Sequence modeling with RNNs faces challenges due to sequential processing, preventing parallelization and causing memory constraints.

### Example Interactions

**User Query**: What problems does sequence modeling face with neural networks?

**vectorQueryTool Output**: [Content about sequential nature and parallelization issues]

**User Query**: What is reducing sequential computation?

**vectorQueryTool Output**: [Content about goals and models like Extended Neural GPU]

**After Metadata Filtering**: Reducing sequential computation is a goal achieved by certain models, but the constraint persists.

**User Query**: What are the main components of the Transformer architecture?

**vectorQueryTool Output**: Encoder and decoder with self-attention and fully connected layers.

### Further Questions

- Can you explain self-attention?
- How does multi-head attention work?
- What problem does positional encoding solve?

**User Query**: Key advantages of Transformer over RNNs?

**After Metadata Filtering**: Relies on attention, superior performance, outperforms RNNs.

**With Chain-of-Thought**:
THOUGHT PROCESS:

- Step 1: Chunks highlight dispensing with recurrence.
- Step 2: Connects to superior performance.
- Step 3: Replaces RNNs with attention for better results.

FINAL ANSWER: Dispenses with recurrence, relying on attention for superior performance.

## Vector Query Tool Creation

```typescript
const vectorQueryTool = createVectorQueryTool({
  // ...
  enableFilter: true,
  // ...
});
```

```typescript
const chunks = await doc.chunk({
  // ...
  extract: {
    keywords: true, // Extracts keywords from each chunk
  },
});
```

```typescript
export const ragAgent = new Agent({
  // ...
  instructions: `
    You are a helpful assistant that answers questions based on the provided context. Keep your answers concise and relevant.

    Filter the context by searching the metadata.

    The metadata is structured as follows:

    {
      text: string,
      source: string,
      excerptKeywords: string, // New field for extracted keywords
    }

    ${PGVECTOR_PROMPT}

    Important: When asked to answer a question, please base your answer only on the context provided in the tool.
    If the context doesn't contain enough information to fully answer the question, please state that explicitly.
  `,
  // ...
});
```

## Chain of Thought (CoT) System Prompt

CoT enables LLMs to reason by breaking tasks into steps.

Implementation:

1. **Explicit Guidance**: Outlines analysis, breakdown, connections, conclusions, and handling missing info.
2. **Structured Format**:
   ```
   THOUGHT PROCESS:
   - Step 1: [Analysis]
   - Step 2: [Connections]
   - Step 3: [Reasoning]

   FINAL ANSWER: [Answer]
   ```
3. **Justification**: Emphasizes explaining connections and usage of information.

Purpose:
- Improves reasoning.
- Enhances transparency and debugging.
- Reduces hallucinations.

## Performance Optimization with pgVector

```typescript
// Balanced configuration
const balancedTool = createVectorQueryTool({
  vectorStoreName: "postgres",
  indexName: "embeddings",
  model: openai.embedding("text-embedding-3-small"),
  databaseConfig: {
    pgvector: {
      ef: 150,          // Moderate accuracy
      probes: 8,        // Moderate recall
      minScore: 0.7     // Moderate quality threshold
    }
  }
});
```

```typescript
// Adjust parameters based on load
const adaptiveSearch = async (query: string, isHighLoad: boolean) => {
  const runtimeContext = new RuntimeContext();

  if (isHighLoad) {
    // Reduce quality for speed
    runtimeContext.set('databaseConfig', {
      pgvector: {
        ef: 75,
        probes: 5,
        minScore: 0.65
      }
    });
  }

  return await balancedTool.execute({
    context: { queryText: query },
    mastra,
    runtimeContext
  });
};
```