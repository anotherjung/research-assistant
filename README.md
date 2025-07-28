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



## How to Create the Vector Index

expected to max cpu on shared micro instances
do not run ask run cmd 
npx bun src/store.ts

// Create an index for our paper chunks
await vectorStore.createIndex({
  indexName: "papers",
  dimension: 768, // text-embedding-004 outputs 768 dimensions
});

## How to Change the Embedding Model

run sql 
DROP TABLE IF EXISTS papers;

Change the Embedding Model: Switch to an embedding model that outputs 1536 dimensions. (e.g., text-embedding-002 from OpenAI often outputs 1536 dimensions, but you would need to verify the exact model and its output dimensions).

Recreate the Vector Index: Delete the existing "papers" index in your PostgreSQL database and recreate it with the correct dimensionality of 768 to match the text-embedding-004 model. You would typically do this by connecting to your PostgreSQL database and executing a SQL command similar to DROP TABLE IF EXISTS papers; followed by the CREATE TABLE command with the correct vector dimension (e.g., vector(768) ).



Questions to ask agent and expected response from agent:


Query: What problems does sequence modeling face with neural networks?
Response: Sequence modeling with neural networks faces several key challenges:
1. Vanishing and exploding gradients during training, especially with long sequences
2. Difficulty handling long-term dependencies in the input
3. Limited computational efficiency due to sequential processing
4. Challenges in parallelizing computations, resulting in longer training times

What problems does sequence modeling face with neural networks?

vectorQueryTool
The primary challenge faced by sequence modeling with neural networks, particularly at longer sequence lengths, is its inherently sequential nature. This characteristic prevents parallelization within training examples, and memory constraints further limit batching across examples.

what is reducing sequential computation

vectorQueryTool
Reducing sequential computation is a goal in achieving computational efficiency. This has been explored through methods like factorization tricks and conditional computation, which have also improved model performance. The fundamental constraint of sequential computation, however, still remains. This goal also forms the basis for models like the Extended Neural GPU, ByteNet, and ConvS2S, all of which utilize convolutional neural networks.



What are the main components of the Transformer architecture

vectorQueryTool
The Transformer architecture is composed of an encoder and a decoder. Both of these components utilize stacked self-attention and point-wise, fully connected layers.



Can you explain the concept of self-attention


How does multi-head attention work?


What problem does positional encoding solve in the Transformer model?


What are the key advantages of the Transformer architecture compared to recurrent neural networks (RNNs) for sequence modeling tasks?

