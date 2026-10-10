import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 45000,
});

export interface DocumentItem {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  collection_id?: string;
  status: 'queued' | 'extracting' | 'chunking' | 'embedding' | 'graph_extraction' | 'indexed' | 'failed';
  error_message?: string;
  total_pages: number;
  chunk_count: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  id: string;
  name: string;
  description?: string;
  document_count: number;
  created_at: string;
}

export interface DashboardMetrics {
  total_documents: number;
  indexed_documents: number;
  failed_documents: number;
  total_chunks: number;
  total_entities: number;
  total_relationships: number;
  total_questions: number;
  ollama_status: boolean;
  ollama_model: string;
  embedding_status: boolean;
  recent_activity: Array<{ action: string; time: string; details: string }>;
  recent_documents: DocumentItem[];
}

export interface SearchResult {
  chunk_id: string;
  document_id: string;
  document_title: string;
  page_number?: number;
  excerpt: string;
  score: number;
  match_type: string;
}

export interface Citation {
  id: string;
  chunk_id: string;
  document_title: string;
  page_number?: number;
  excerpt: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  model_used?: string;
  suggested_follow_ups?: string[];
  created_at?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  category: string;
  description?: string;
  document_count: number;
  degree: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation_type: string;
  description?: string;
  confidence: number;
  evidence_count: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    total_nodes: number;
    total_edges: number;
    categories: Record<string, number>;
  };
}

export interface ConnectionSuggestion {
  id: string;
  doc_a_id: string;
  doc_a_title: string;
  doc_b_id: string;
  doc_b_title: string;
  shared_concept?: string;
  reasoning: string;
  excerpt_a: string;
  excerpt_b: string;
  confidence: number;
  status: 'suggested' | 'accepted' | 'dismissed';
  created_at: string;
}

export interface ContradictionItem {
  id: string;
  doc_a_id: string;
  doc_a_title: string;
  doc_b_id: string;
  doc_b_title: string;
  topic: string;
  claim_a: string;
  claim_b: string;
  classification: string;
  status: 'needs_review' | 'confirmed' | 'dismissed';
  reasoning?: string;
  created_at: string;
}

export interface KnowledgeGapItem {
  id: string;
  topic: string;
  category: string;
  why_identified: string;
  supporting_excerpt?: string;
  related_concepts?: string;
  suggested_follow_up: string;
  confidence: number;
  created_at: string;
}

export interface AnalyticsData {
  ingestion_timeline: Array<{ date: string; count: number }>;
  top_concepts: Array<{ name: string; count: number; category: string }>;
  relation_types: Array<{ type: string; count: number }>;
  doc_types: Array<{ type: string; count: number }>;
  categories?: Array<{ category: string; count: number }>;
  status_counts?: Record<string, number>;
  chunks_per_doc?: Array<{ filename: string; chunks: number }>;
  summary?: {
    total_documents: number;
    total_chunks: number;
    total_entities: number;
    total_relationships: number;
    total_questions: number;
    avg_chunks_per_doc: number;
    graph_density: number;
  };
}

export interface DocumentChunkDetail {
  id: string;
  chunk_index: number;
  content: string;
  page_number?: number;
  token_count: number;
}

export interface DocumentContentResponse {
  id: string;
  filename: string;
  total_chunks: number;
  chunks: DocumentChunkDetail[];
  entities: Array<{ name: string; category: string; excerpt?: string }>;
}

export const fetchDashboard = async (): Promise<DashboardMetrics> => {
  const { data } = await api.get('/dashboard');
  return data;
};

export const fetchDocuments = async (): Promise<DocumentItem[]> => {
  const { data } = await api.get('/documents');
  return data;
};

export const fetchDocumentContent = async (id: string): Promise<DocumentContentResponse> => {
  const { data } = await api.get(`/documents/${id}/content`);
  return data;
};


export const uploadDocuments = async (files: FileList | File[]): Promise<any> => {
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append('files', file);
  });
  const { data } = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deleteDocument = async (id: string): Promise<void> => {
  await api.delete(`/documents/${id}`);
};

export const reprocessDocument = async (id: string): Promise<void> => {
  await api.post(`/documents/${id}/reprocess`);
};

export const searchKnowledge = async (query: string): Promise<SearchResult[]> => {
  const { data } = await api.get('/search', { params: { query } });
  return data;
};

export const sendChatMessage = async (message: string, conversation_id?: string) => {
  const { data } = await api.post('/chat', { message, conversation_id });
  return data;
};

export const fetchKnowledgeGraph = async (): Promise<GraphData> => {
  const { data } = await api.get('/graph');
  return data;
};

export const fetchConnections = async (): Promise<ConnectionSuggestion[]> => {
  const { data } = await api.get('/connections');
  return data;
};

export const reviewConnection = async (id: string, status: string): Promise<void> => {
  await api.post(`/connections/${id}/review`, { status });
};

export const fetchContradictions = async (): Promise<ContradictionItem[]> => {
  const { data } = await api.get('/contradictions');
  return data;
};

export const reviewContradiction = async (id: string, status: string): Promise<void> => {
  await api.post(`/contradictions/${id}/review`, { status });
};

export const fetchKnowledgeGaps = async (): Promise<KnowledgeGapItem[]> => {
  const { data } = await api.get('/knowledge-gaps');
  return data;
};

export const fetchAnalytics = async (): Promise<AnalyticsData> => {
  const { data } = await api.get('/analytics');
  return data;
};

export const testOllama = async () => {
  const { data } = await api.post('/settings/test-ollama');
  return data;
};

export const updateSettings = async (settings: { base_url: string; model: string }) => {
  const { data } = await api.post('/settings/ollama', settings);
  return data;
};

export const checkHealth = async (): Promise<{ status: string; app: string; version: string; is_serverless?: boolean }> => {
  const { data } = await api.get('/health');
  return data;
};

export default api;
