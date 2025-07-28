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

To create the vector index:

*   Expected to max CPU on shared micro instances.
*   Do not run `ask run cmd`.
*   Run `npx bun src/store.ts`.

```typescript
// Create an index for our paper chunks
await vectorStore.createIndex({
  indexName: "papers",
  dimension: 768, // text-embedding-004 outputs 768 dimensions
});
```

## How to Change the Embedding Model

To change the embedding model:

*   Run SQL: `DROP TABLE IF EXISTS papers;`
*   **Change the Embedding Model**: Switch to an embedding model that outputs 1536 dimensions (e.g., `text-embedding-002` from OpenAI often outputs 1536 dimensions, but you would need to verify the exact model and its output dimensions).
*   **Recreate the Vector Index**: Delete the existing "papers" index in your PostgreSQL database and recreate it with the correct dimensionality of 768 to match the `text-embedding-004` model. You would typically do this by connecting to your PostgreSQL database and executing a SQL command similar to `DROP TABLE IF EXISTS papers;` followed by the `CREATE TABLE` command with the correct vector dimension (e.g., `vector(768)`).

```sql
DROP TABLE IF EXISTS papers;
```



## Questions to ask agent and expected response from agent:

### Query: What problems does sequence modeling face with neural networks?

**Response**: The primary challenge faced by sequence modeling with neural networks, particularly at longer sequence lengths, is its inherently sequential nature. This characteristic prevents parallelization within training examples, and memory constraints further limit batching across examples.

**Response (after metadata filtering):**
The inherently sequential nature of recurrent neural networks (RNNs), including Long Short-Term Memory (LSTM) and gated recurrent neural networks, presents a challenge for parallelization within training examples. This limitation becomes particularly critical with longer sequence lengths, as memory constraints restrict the ability to batch across examples.

**Response (after metadata filtering with Chain-of-Thought):**
Sequence modeling with neural networks, particularly recurrent neural networks (RNNs), faces challenges due to their inherently sequential nature. This sequential processing prevents parallelization within training examples, which becomes a critical issue with longer sequence lengths. The inability to parallelize leads to memory constraints, limiting the capacity for batching across examples during training.

### Example Interaction:

**User Query**: What problems does sequence modeling face with neural networks?

**`vectorQueryTool` Output**: The primary challenge faced by sequence modeling with neural networks, particularly at longer sequence lengths, is its inherently sequential nature. This characteristic prevents parallelization within training examples, and memory constraints further limit batching across examples.

**User Query**: What is reducing sequential computation?

**`vectorQueryTool` Output**: Reducing sequential computation is a goal in achieving computational efficiency. This has been explored through methods like factorization tricks and conditional computation, which have also improved model performance. The fundamental constraint of sequential computation, however, still remains. This goal also forms the basis for models like the Extended Neural GPU, ByteNet, and ConvS2S, all of which utilize convolutional neural networks.

**Response (after metadata filtering):**
Based on the provided documents, "reducing sequential computation" is a goal in the development of models like the Extended Neural GPU, ByteNet, and ConvS2S, which achieve this by using convolutional neural networks. While methods like factorization tricks and conditional computation have improved computational efficiency, the fundamental constraint of sequential computation persists. The documents do not provide a direct definition of what sequential computation is.

**User Query**: What are the main components of the Transformer architecture?

**`vectorQueryTool` Output**: The Transformer architecture is composed of an encoder and a decoder. Both of these components utilize stacked self-attention and point-wise, fully connected layers.

### Further Questions to Ask the Agent:

*   Can you explain the concept of self-attention?
*   How does multi-head attention work?
*   What problem does positional encoding solve in the Transformer model?
*  

**User Query**: What are the key advantages of the Transformer architecture compared to recurrent neural networks (RNNs) for sequence modeling tasks?

**Response (after metadata filtering):**
The Transformer architecture offers several key advantages over recurrent neural networks (RNNs) for sequence modeling tasks:
  - Sole Reliance on Attention Mechanisms: Unlike RNNs, which depend on recurrence and convolutions, the Transformer is built entirely on attention mechanisms. This design simplifies the network architecture.
  - Superior Performance: Experiments on machine translation tasks have shown that Transformer models are superior to complex recurrent or convolutional neural networks.
  - Outperforms RNN Sequence-to-Sequence Models: The Transformer has been shown to outperform RNN sequence-to-sequence models, even when trained on smaller datasets.

**Response (after metadata filtering with Chain-of-Thought):**
THOUGHT PROCESS:

Step 1: The retrieved chunks consistently highlight one key advantage of the Transformer architecture: it "dispens[es] with recurrence and convolutions entirely," relying "solely on attention mechanisms." They also state that the Transformer is "superior in" performance on machine translation tasks compared to models based on recurrent or convolutional neural networks.
Step 2: The core connection is that by eliminating recurrence and convolutions and relying entirely on attention, the Transformer achieves superior performance in sequence transduction tasks like machine translation.
Step 3: The information directly states that the Transformer replaces RNNs and convolutions with attention mechanisms, leading to better results. The repeated phrasing across multiple chunks reinforces this as a primary advantage.
FINAL ANSWER: The key advantage of the Transformer architecture over recurrent neural networks (RNNs) for sequence modeling tasks is that it entirely dispenses with recurrence and convolutions, relying solely on attention mechanisms. This architectural change has resulted in superior performance in tasks such as machine translation.

# Vector Query Tool Creation
Using createVectorQueryTool imported from @mastra/rag, you can create a tool that enables metadata filtering. Each vector store has its own prompt that defines the supported filter operators and syntax:

const vectorQueryTool = createVectorQueryTool({
  ...
  enableFilter: true,
  ...
})

const chunks = await doc.chunk({
  ...
   extract: {
    keywords: true, // Extracts keywords from each chunk
  },
})


export const ragAgent = new Agent({
...
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
  `
  ...

# demonstrate a "Chain of Thought" (CoT) system prompt for an AI agent

CoT prompting is a technique used to enable large language models (LLMs) to perform complex reasoning tasks by breaking them down into intermediate steps.

Here's how the provided prompt implements the Chain of Thought:

1. 1.
   Explicit Step-by-Step Guidance : The prompt clearly outlines a sequence of steps the agent must follow:
   
   - "First, carefully analyze the retrieved context chunks and identify key information."
   - "Break down your thinking process about how the retrieved information relates to the query."
   - "Explain how you're connecting different pieces from the retrieved chunks."
   - "Draw conclusions based only on the evidence in the retrieved context."
   - "If the retrieved chunks don't contain enough information, explicitly state what's missing."
2. 2.
   Structured Output Format : It dictates a specific format for the agent's response, including a "THOUGHT PROCESS" section with sub-steps and a "FINAL ANSWER" section. This forces the agent to externalize its reasoning:
   
   ```
   THOUGHT PROCESS:
   - Step 1: [Initial analysis of retrieved 
   chunks]
   - Step 2: [Connections between chunks]
   - Step 3: [Reasoning based on chunks]
   
   FINAL ANSWER:
   [Your concise answer based on the retrieved 
   context]
   ```
3. 3.
   Emphasis on Justification : Phrases like "Explain how you're connecting different pieces" and "Remember: Explain how you're using the retrieved information to reach your conclusions" reinforce the need for the agent to show its work, not just provide a final answer.
Purpose of Chain of Thought Prompting:

- Improved Reasoning : By guiding the agent through a logical sequence of steps, CoT prompts help LLMs perform better on tasks requiring multi-step reasoning, arithmetic, and symbolic manipulation.
- Transparency and Debugging : The explicit thought process makes the agent's reasoning transparent, allowing developers to understand how the agent arrived at its conclusion and to debug issues more effectively.
- Reduced Hallucinations : By instructing the agent to base answers only on provided context and to state explicitly when information is missing, CoT can help reduce the likelihood of the agent generating incorrect or unsupported information.