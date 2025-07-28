import { google } from "@ai-sdk/google";
import { MDocument } from "@mastra/rag";
import { embedMany } from "ai";
import { mastra } from "./mastra";
 
// Load the paper
const paperUrl = "https://arxiv.org/html/1706.03762";
const response = await fetch(paperUrl);
const paperText = await response.text();
 
// Create document and chunk it
const doc = MDocument.fromText(paperText);
const chunks = await doc.chunk({
  strategy: "recursive",
  size: 512,
  overlap: 50,
  separator: "\n",
  extract: {
    keywords: true, // Extracts keywords from each chunk
  },
});
 
console.log("Number of chunks:", chunks.length);
console.log("Starting embedding generation...");
// Number of chunks: 768 text-embedding-004

// Define the embedding model
const embeddingModel = google.textEmbeddingModel('text-embedding-004', {
  taskType: 'RETRIEVAL_DOCUMENT',
});

// Generate embeddings in batches
const allEmbeddings = [];
const batchSize = 100; // Max 100 requests per batch

for (let i = 0; i < chunks.length; i += batchSize) {
  console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(chunks.length / batchSize)}`);
  const batch = chunks.slice(i, i + batchSize);
  const { embeddings: batchEmbeddings } = await embedMany({
    model: embeddingModel,
    values: batch.map((chunk) => chunk.text),
  });
  allEmbeddings.push(...batchEmbeddings);
}
console.log("Embedding generation complete.");

const embeddings = allEmbeddings;
console.log("Creating index 'papers'...");

 
// Get the vector store instance from Mastra
const vectorStore = mastra.getVector('pgVectorStore'); // src/mastra/index.ts

// Create an index for our paper chunks
await vectorStore.createIndex({
  indexName: "papers",
  dimension: 768, // text-embedding-004 outputs 768 dimensions
});
console.log("Index 'papers' created.");

console.log("Upserting vectors to index...");
await vectorStore.upsert({
  indexName: "papers",
  vectors: embeddings,
  metadata: chunks.map((chunk) => ({
    text: chunk.text,
    source: "transformer-paper",
    excerptKeywords: chunk.metadata.excerptKeywords,
  })),
});
console.log("Upsert complete.");


