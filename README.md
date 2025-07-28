Mastra Guide Research Assistant is a research assistant that uses Mastra to answer questions about academic papers and technical documents.

install @mastra/core@latest @mastra/rag@latest @mastra/pg@latest ai@latest zod@latest

POSTGRES_CONNECTION_STRING=postgresql://postgres:postgres@localhost:5432/postgres

touch src/mastra/agents/researchAgent.ts
touch src/mastra/index.ts src/store.ts src/index.ts

### Understanding Document Chunking and Embeddings

The `doc.chunk({...})` method is a crucial part of preparing documents for Retrieval-Augmented Generation (RAG) in Mastra. It breaks down large documents into smaller, manageable pieces called "chunks" before they are converted into numerical representations (embeddings).

Here's a breakdown of the parameters:

-   **`strategy: "recursive"`**: This intelligent chunking method preserves semantic meaning by splitting content based on its structure (e.g., paragraphs, sentences).
-   **`size: 512`**: The target maximum length for each chunk.
-   **`overlap: 50`**: Ensures context continuity by having 50 units of overlap between consecutive chunks.
-   **`separator: "\n"`**: Prioritizes splitting at newline characters.

After chunking, models like `text-embedding-004` convert these text chunks into high-dimensional numerical vectors (embeddings). The `text-embedding-004` model, specifically from Google, outputs vectors with a default dimensionality of **768**. This means each chunk is represented by 768 numerical values, which is vital for efficient similarity searches in vector databases.

