import React, { useEffect, useState } from 'react';
import {
  FileText,
  Network,
  Database,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Upload,
  BotMessageSquare,
  GitFork,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { fetchDashboard, DashboardMetrics } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

export const OverviewPage: React.FC = () => {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchDashboard();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const metricCards = [
    {
      title: 'Total Documents',
      value: data?.total_documents ?? 0,
      sub: `${data?.indexed_documents ?? 0} successfully indexed in vault`,
      icon: FileText,
      color: 'from-blue-500/20 to-cyan-500/10 text-cyan-400 border-cyan-500/30',
      link: '/knowledge',
      trend: `${data?.total_documents ? '100% On-Device' : 'Awaiting files'}`,
    },
    {
      title: 'Extracted Entities',
      value: data?.total_entities ?? 0,
      sub: 'Categorized concepts & terminology',
      icon: Network,
      color: 'from-violet-500/20 to-purple-500/10 text-violet-400 border-violet-500/30',
      link: '/graph',
      trend: 'Knowledge Graph',
    },
    {
      title: 'Graph Relationships',
      value: data?.total_relationships ?? 0,
      sub: 'Evidence-backed directional edges',
      icon: TrendingUp,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
      link: '/graph',
      trend: 'Cross-linked',
    },
    {
      title: 'Knowledge Chunks',
      value: data?.total_chunks ?? 0,
      sub: 'Dense vector embeddings stored',
      icon: Database,
      color: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30',
      link: '/knowledge',
      trend: 'Vector Indexed',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Hero Welcome & Quick Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-2xl bg-gradient-to-r from-[#12192e] via-[#0f172a] to-[#12192e] border border-[#1e293b] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-[11px] text-cyan-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Personal Knowledge Intelligence Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Knowledge Vault Overview
          </h1>
          <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
            Your documents are synthesized into a connected semantic knowledge graph. Run multi-document inquiries, detect contradictions, and navigate evidence with complete local privacy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141d2e] border border-[#1e293b] text-gray-300 hover:text-white hover:bg-[#1a263c] text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh State</span>
          </button>
          <Link
            to="/knowledge"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/25 transition hover:scale-105"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Ingest Documents</span>
          </Link>
          <Link
            to="/chat"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a243a] hover:bg-[#202d48] border border-cyan-500/30 text-cyan-300 text-xs font-bold transition"
          >
            <BotMessageSquare className="w-3.5 h-3.5" />
            <span>Ask Vault</span>
          </Link>
        </div>
      </div>

      {/* Real Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              onClick={() => navigate(card.link)}
              className={`bg-[#0e1424] bg-gradient-to-br ${card.color} border rounded-2xl p-5 hover:scale-[1.02] cursor-pointer transition-all duration-200 shadow-lg relative group`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-300">{card.title}</span>
                <div className="p-2 rounded-xl bg-[#141d2e] border border-white/5">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-3xl font-black text-white tracking-tight">{card.value}</span>
                <p className="text-[11px] text-gray-400 mt-1 leading-snug">{card.sub}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                <span className="font-mono text-[10px] text-cyan-300">{card.trend}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Diagnostics & Recent Knowledge Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Runtime Diagnostics Card */}
        <div className="bg-[#0e1424] border border-[#1a2336] rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#1a2336]">
            <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-400" />
              <span>Local AI Engine Status</span>
            </h2>
            <Link to="/settings" className="text-[11px] text-violet-400 hover:text-cyan-300 font-semibold">
              Configure
            </Link>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#12192a] border border-[#1e293b] text-xs">
              <span className="text-gray-400">Ollama Runtime</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                  data?.ollama_status
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {data?.ollama_status ? 'ONLINE (11434)' : 'OFFLINE'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#12192a] border border-[#1e293b] text-xs">
              <span className="text-gray-400">Configured LLM</span>
              <span className="font-mono text-[11px] text-violet-300 font-bold">
                {data?.ollama_model || 'llama3.2:3b'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#12192a] border border-[#1e293b] text-xs">
              <span className="text-gray-400">Vector Embeddings</span>
              <span className="text-[11px] text-cyan-300 font-medium">all-MiniLM-L6-v2</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#12192a] border border-[#1e293b] text-xs">
              <span className="text-gray-400">Database Storage</span>
              <span className="text-[11px] text-emerald-400 font-mono">SQLite + Vector Index</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-800/30 text-[11px] text-violet-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Zero cloud data leakage: No external API keys or subscriptions required.</span>
          </div>
        </div>

        {/* Recent Ingested Documents List */}
        <div className="lg:col-span-2 bg-[#0e1424] border border-[#1a2336] rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1a2336]">
              <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Recently Processed Documents</span>
              </h2>
              <Link to="/knowledge" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold">
                <span>Open Repository</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {!data?.recent_documents || data.recent_documents.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500 space-y-3">
                <Layers className="w-8 h-8 mx-auto text-gray-600 stroke-1" />
                <p className="font-semibold text-gray-300">No documents ingested in this vault yet.</p>
                <p className="max-w-xs mx-auto text-[11px]">Upload a PDF, DOCX, TXT or Markdown file to populate entities, relations, and vectors.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.recent_documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => navigate('/knowledge')}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#12192a] border border-[#1e293b] hover:border-violet-500/40 hover:bg-[#162137] cursor-pointer transition text-xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="px-2 py-1 rounded bg-violet-600/20 text-violet-300 font-mono text-[10px] font-bold uppercase border border-violet-500/30">
                        {doc.file_type}
                      </div>
                      <div>
                        <span className="font-bold text-gray-100 group-hover:text-cyan-300 transition truncate max-w-sm block">
                          {doc.filename}
                        </span>
                        <span className="text-[11px] text-gray-400 font-mono mt-0.5 block">
                          {(doc.file_size / 1024).toFixed(1)} KB • {doc.chunk_count} chunks indexed
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5 ${
                          doc.status === 'indexed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : doc.status === 'failed'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {doc.status === 'indexed' && <CheckCircle2 className="w-3 h-3" />}
                        {doc.status !== 'indexed' && <Clock className="w-3 h-3 animate-spin" />}
                        <span className="capitalize">{doc.status}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Navigation Footer */}
          <div className="pt-4 mt-4 border-t border-[#1a2336] flex items-center justify-between text-xs text-gray-400">
            <span>Click any item to view extracted text chunks & entities</span>
            <Link to="/graph" className="text-violet-400 hover:text-cyan-300 flex items-center gap-1 font-semibold">
              <span>View in Knowledge Graph</span>
              <GitFork className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
