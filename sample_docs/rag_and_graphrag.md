# Retrieval Augmented Generation (RAG) Systems

Retrieval Augmented Generation combines pre-trained parametric memory with non-parametric external memory indexed via vector databases.
RAG systems use dense vector representations produced by encoders such as SentenceTransformers to retrieve the most relevant passages for a query.

## Knowledge Graphs in RAG
GraphRAG augments traditional vector retrieval by extracting entities, concepts, and relationships from source documents.
By traversing the knowledge graph, the AI can discover cross-document connections that keyword and standard semantic search might overlook.
