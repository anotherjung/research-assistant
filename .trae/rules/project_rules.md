use pnpm as package manager
pnpm i @ai-sdk/google
use import { google } from '@ai-sdk/google'; 

# vector model
model: google.textEmbeddingModel('text-embedding-004'), 
text-embedding-004	
Default Dimensions 768


Embedding Models
You can create models that call the Google Generative AI embeddings API using the .textEmbeddingModel() factory method.



Google Generative AI embedding models support aditional settings. You can pass them as an options argument:

const model = google.textEmbeddingModel('text-embedding-004', {
  outputDimensionality: 512, // optional, number of dimensions for the embedding
  taskType: 'SEMANTIC_SIMILARITY', // optional, specifies the task type for generating embeddings
});
The following optional settings are available for Google Generative AI embedding models:

outputDimensionality: number

Optional reduced dimension for the output embedding. If set, excessive values in the output embedding are truncated from the end.

taskType: string

Optional. Specifies the task type for generating embeddings. Supported task types include:

SEMANTIC_SIMILARITY: Optimized for text similarity.
CLASSIFICATION: Optimized for text classification.
CLUSTERING: Optimized for clustering texts based on similarity.
RETRIEVAL_DOCUMENT: Optimized for document retrieval.
RETRIEVAL_QUERY: Optimized for query-based retrieval.
QUESTION_ANSWERING: Optimized for answering questions.
FACT_VERIFICATION: Optimized for verifying factual information.
CODE_RETRIEVAL_QUERY: Optimized for retrieving code blocks based on natural language queries.

# chat model for research assistant agent 
model: google("gemini-2.5-flash"),

# chat model for general
model: google("gemini-2.0-flash"),