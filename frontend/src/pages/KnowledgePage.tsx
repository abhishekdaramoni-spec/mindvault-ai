import React, { useEffect, useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Layers,
  BookOpen,
  Filter,
  Network,
  ChevronRight,
  Database,
  Eye,
} from 'lucide-react';
import {
  fetchDocuments,
  uploadDocuments,
  deleteDocument,
  reprocessDocument,
  fetchDocumentContent,
  DocumentItem,
  DocumentContentResponse,
} from '../services/api';

export const KnowledgePage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [docContent, setDocContent] = useState<DocumentContentResponse | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [activeTab, setActiveTab] = useState<'metadata' | 'chunks' | 'entities'>('metadata');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const res = await fetchDocuments();
      setDocuments(res);
      if (res.length > 0 && !selectedDoc) {
        handleSelectDoc(res[0]);
      }
    } catch (e: any) {
      setErrorMsg('Failed to load documents from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
    const interval = setInterval(loadDocs, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectDoc = async (doc: DocumentItem) => {
    setSelectedDoc(doc);
    try {
      setLoadingContent(true);
      const content = await fetchDocumentContent(doc.id);
      setDocContent(content);
    } catch (e: any) {
      // In serverless / ephemeral environments or if doc was removed, handle cleanly
      if (e?.response?.status === 404) {
        setDocContent(null);
      } else {
        console.warn('Document content not currently available:', e?.message || e);
        setDocContent(null);
      }
    } finally {
      setLoadingContent(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploading(true);
      setErrorMsg(null);
      await uploadDocuments(e.target.files);
      await loadDocs();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Upload failed. File type may be unsupported.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document and clean up its vector embeddings and provenance records?')) return;
    try {
      await deleteDocument(id);
      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
        setDocContent(null);
      }
      await loadDocs();
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      await reprocessDocument(id);
      await loadDocs();
      if (selectedDoc?.id === id) {
        handleSelectDoc(selectedDoc);
      }
    } catch (err) {
      alert('Failed to trigger reprocessing');
    }
  };

  const filteredDocs = documents.filter((d) => {
    const matchesSearch = d.filename.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesType = typeFilter === 'all' || d.file_type.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0c111e] border border-[#1a2336] shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            <span>My Knowledge Vault</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage, inspect, and organize your document corpus. Upload PDF, DOCX, TXT, or Markdown files for automated chunking, embedding, and entity extraction.
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition hover:scale-105"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Processing Files...' : 'Upload Documents'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document List Column (5 cols) */}
        <div className="lg:col-span-5 bg-[#0c111e] border border-[#1a2336] rounded-2xl overflow-hidden flex flex-col h-[700px] shadow-xl">
          {/* Search and Filters toolbar */}
          <div className="p-3 border-b border-[#1a2336] bg-[#090e18] flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search documents by title..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-[#111827] border border-[#1f293d] rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#111827] border border-[#1f293d] rounded-xl px-2 py-1.5 text-xs">
              <Filter className="w-3 h-3 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-gray-300 text-[11px] focus:outline-none"
              >
                <option value="all" className="bg-[#111827]">All Types</option>
                <option value="pdf" className="bg-[#111827]">PDF</option>
                <option value="docx" className="bg-[#111827]">DOCX</option>
                <option value="md" className="bg-[#111827]">Markdown</option>
                <option value="txt" className="bg-[#111827]">TXT</option>
              </select>
            </div>
          </div>

          {/* Document Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#1a2336]">
            {filteredDocs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 space-y-2">
                <FileText className="w-10 h-10 stroke-1 text-gray-600" />
                <p className="text-xs font-semibold text-gray-300">No documents found</p>
                <p className="text-[11px] max-w-xs">Upload PDF, DOCX, or text files to populate your knowledge base.</p>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    className={`p-3.5 flex items-center justify-between hover:bg-[#12192a] cursor-pointer transition ${
                      isSelected ? 'bg-gradient-to-r from-violet-600/20 to-transparent border-l-4 border-violet-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="px-2 py-1 rounded-lg bg-violet-950/60 text-violet-300 font-mono text-[10px] font-bold uppercase border border-violet-700/30">
                        {doc.file_type}
                      </div>
                      <div className="truncate">
                        <h3 className="text-xs font-semibold text-gray-200 truncate">{doc.filename}</h3>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mt-0.5">
                          <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span>{doc.chunk_count} chunks</span>
                          <span>•</span>
                          <span>{doc.total_pages || 1} pgs</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          doc.status === 'indexed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : doc.status === 'failed'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {doc.status === 'indexed' && <CheckCircle className="w-2.5 h-2.5" />}
                        {doc.status !== 'indexed' && <Clock className="w-2.5 h-2.5 animate-spin" />}
                        <span className="capitalize">{doc.status}</span>
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                        title="Delete Document"
                        className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-[#1a2336] transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Document Inspection & Content Panel (7 cols) */}
        <div className="lg:col-span-7 bg-[#0c111e] border border-[#1a2336] rounded-2xl p-6 flex flex-col justify-between h-[700px] shadow-xl">
          {selectedDoc ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header Title with Tabs */}
              <div className="pb-4 border-b border-[#1a2336] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-violet-400 font-bold">Document Inspector</span>
                  <h2 className="text-base font-bold text-white break-words mt-0.5">{selectedDoc.filename}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-[#111827] border border-[#1f293d] rounded-xl p-1 text-[11px]">
                    <button
                      onClick={() => setActiveTab('metadata')}
                      className={`px-3 py-1 rounded-lg font-semibold transition ${
                        activeTab === 'metadata' ? 'bg-violet-600 text-white shadow' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('chunks')}
                      className={`px-3 py-1 rounded-lg font-semibold transition ${
                        activeTab === 'chunks' ? 'bg-violet-600 text-white shadow' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Chunks ({docContent?.total_chunks || selectedDoc.chunk_count})
                    </button>
                    <button
                      onClick={() => setActiveTab('entities')}
                      className={`px-3 py-1 rounded-lg font-semibold transition ${
                        activeTab === 'entities' ? 'bg-violet-600 text-white shadow' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Entities ({docContent?.entities?.length || 0})
                    </button>
                  </div>

                  <button
                    onClick={() => handleReprocess(selectedDoc.id)}
                    title="Reprocess & Re-index"
                    className="p-2 rounded-xl bg-[#141d2e] border border-[#1e293b] text-gray-300 hover:text-white hover:bg-[#1a263c] transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {activeTab === 'metadata' && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-[#111827] rounded-xl border border-[#1f293d]">
                        <span className="text-gray-400 text-[10px] uppercase font-bold block">Page Count</span>
                        <p className="font-extrabold text-white text-base mt-1">{selectedDoc.total_pages || 1}</p>
                      </div>
                      <div className="p-3 bg-[#111827] rounded-xl border border-[#1f293d]">
                        <span className="text-gray-400 text-[10px] uppercase font-bold block">Chunks Extracted</span>
                        <p className="font-extrabold text-cyan-400 text-base mt-1">{selectedDoc.chunk_count}</p>
                      </div>
                      <div className="p-3 bg-[#111827] rounded-xl border border-[#1f293d]">
                        <span className="text-gray-400 text-[10px] uppercase font-bold block">File Size</span>
                        <p className="font-extrabold text-violet-400 text-base mt-1">{(selectedDoc.file_size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>

                    <div className="p-4 bg-[#111827] rounded-xl border border-[#1f293d] space-y-2">
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Status & Health</span>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 capitalize font-medium">{selectedDoc.status}</span>
                        <span className="text-[10px] font-mono text-emerald-400">Vector Embeddings Active</span>
                      </div>
                      {selectedDoc.error_message && (
                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                          {selectedDoc.error_message}
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-[#111827] rounded-xl border border-[#1f293d] space-y-2">
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Storage Provenance</span>
                      <p className="text-[11px] font-mono text-gray-300 break-all">{selectedDoc.filename}</p>
                      <span className="text-[10px] text-gray-500 block">
                        Indexed: {new Date(selectedDoc.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === 'chunks' && (
                  <div className="space-y-3">
                    {loadingContent ? (
                      <div className="py-12 text-center text-xs text-gray-400">Loading document chunks...</div>
                    ) : !docContent?.chunks || docContent.chunks.length === 0 ? (
                      <div className="py-12 text-center text-xs text-gray-500">No chunks generated yet.</div>
                    ) : (
                      docContent.chunks.map((chk) => (
                        <div
                          key={chk.id}
                          className="p-3.5 rounded-xl bg-[#111827] border border-[#1f293d] space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono text-violet-300">
                            <span>Chunk #{chk.chunk_index + 1}</span>
                            <span className="text-cyan-400">Page {chk.page_number || 1} • {chk.token_count} tokens</span>
                          </div>
                          <p className="text-gray-300 leading-relaxed font-sans text-xs bg-[#090e18] p-3 rounded-lg border border-white/5">
                            {chk.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'entities' && (
                  <div className="space-y-3">
                    {!docContent?.entities || docContent.entities.length === 0 ? (
                      <div className="py-12 text-center text-xs text-gray-500">
                        No entities extracted from this document yet. Click 'Reprocess' to run knowledge extraction.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {docContent.entities.map((ent, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-[#111827] border border-[#1f293d] space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white truncate">{ent.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-violet-900/40 text-violet-300">
                                {ent.category}
                              </span>
                            </div>
                            {ent.excerpt && (
                              <p className="text-[11px] text-gray-400 line-clamp-2 italic font-serif">
                                "{ent.excerpt}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-2">
              <Eye className="w-10 h-10 text-gray-600 stroke-1" />
              <p className="text-xs font-semibold text-gray-300">Select a document</p>
              <p className="text-[11px]">Select a file from the repository to view its text chunks, page provenance, and extracted graph entities.</p>
            </div>
          )}

          {selectedDoc && (
            <div className="pt-4 border-t border-[#1a2336] flex items-center justify-between">
              <span className="text-[11px] text-gray-400">Total Chunks: {selectedDoc.chunk_count}</span>
              <button
                onClick={() => handleDelete(selectedDoc.id)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition"
              >
                Delete Document & Vectors
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
