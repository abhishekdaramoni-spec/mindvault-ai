import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Layers,
  Network,
  Database,
  Calendar,
  FileCheck,
  Activity,
  Cpu,
  RefreshCw,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { fetchAnalytics, AnalyticsData } from '../services/api';
import { useNavigate } from 'react-router-dom';

const CATEGORY_COLORS: Record<string, string> = {
  Technology: '#8b5cf6',
  Algorithm: '#06b6d4',
  Person: '#f59e0b',
  Organization: '#10b981',
  Topic: '#ec4899',
  Concept: '#3b82f6',
  Default: '#64748b',
};

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<'all' | '7d' | '30d'>('all');
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchAnalytics();
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

  const maxConceptCount = Math.max(...(data?.top_concepts?.map((c) => c.count) || [1]), 1);
  const totalCategoryEntities = data?.categories?.reduce((acc, c) => acc + c.count, 0) || 1;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0c111e] border border-[#1a2336] shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-violet-400" />
            <span>Knowledge Intelligence Analytics</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Real metrics derived from database records, vector indexes, extracted concept frequencies, and graph topology.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#111827] border border-[#1f293d] rounded-xl p-1 text-xs">
            <button
              onClick={() => setSelectedRange('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                selectedRange === 'all' ? 'bg-violet-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setSelectedRange('30d')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                selectedRange === '30d' ? 'bg-violet-600 text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              Past 30 Days
            </button>
          </div>

          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141d2e] border border-[#1e293b] text-gray-300 hover:text-white text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0c111e] border border-[#1a2336] shadow-lg space-y-2">
          <span className="text-gray-400 text-xs font-medium flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Total Documents</span>
          </span>
          <p className="text-2xl font-black text-white">{data?.summary?.total_documents ?? 0}</p>
          <span className="text-[10px] text-gray-500 font-mono block">Across all formats</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c111e] border border-[#1a2336] shadow-lg space-y-2">
          <span className="text-gray-400 text-xs font-medium flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>Vector Chunks</span>
          </span>
          <p className="text-2xl font-black text-amber-300">{data?.summary?.total_chunks ?? 0}</p>
          <span className="text-[10px] text-gray-500 font-mono block">
            Avg {data?.summary?.avg_chunks_per_doc ?? 0} chunks / doc
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c111e] border border-[#1a2336] shadow-lg space-y-2">
          <span className="text-gray-400 text-xs font-medium flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-violet-400" />
            <span>Entities Extracted</span>
          </span>
          <p className="text-2xl font-black text-violet-300">{data?.summary?.total_entities ?? 0}</p>
          <span className="text-[10px] text-gray-500 font-mono block">Across {data?.categories?.length || 0} categories</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c111e] border border-[#1a2336] shadow-lg space-y-2">
          <span className="text-gray-400 text-xs font-medium flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Graph Relationships</span>
          </span>
          <p className="text-2xl font-black text-emerald-300">{data?.summary?.total_relationships ?? 0}</p>
          <span className="text-[10px] text-gray-500 font-mono block">
            Graph density: {((data?.summary?.graph_density ?? 0) * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Main Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Frequent Knowledge Concepts */}
        <div className="p-5 rounded-2xl bg-[#0c111e] border border-[#1a2336] shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1a2336]">
            <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              <span>Most Frequent Knowledge Concepts</span>
            </h2>
            <button
              onClick={() => navigate('/graph')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Explore Graph
            </button>
          </div>

          {(!data?.top_concepts || data.top_concepts.length === 0) ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-gray-500 text-xs">
              No concept frequencies recorded yet.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {data.top_concepts.slice(0, 7).map((c, idx) => {
                const pct = Math.round((c.count / maxConceptCount) * 100);
                const color = CATEGORY_COLORS[c.category] || CATEGORY_COLORS.Default;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-semibold text-gray-200 truncate">
                        <span className="w-4 text-[10px] text-gray-500 font-mono">{idx + 1}.</span>
                        <span className="truncate">{c.name}</span>
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px] font-mono"
                          style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
                        >
                          {c.category}
                        </span>
                      </div>
                      <span className="text-gray-400 font-mono text-[11px]">{c.count} mentions</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#111827] overflow-hidden border border-[#1f293d]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, #8b5cf6, ${color})` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Entity Categories Breakdown */}
        <div className="p-5 rounded-2xl bg-[#0c111e] border border-[#1a2336] shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1a2336]">
            <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-cyan-400" />
              <span>Entity Category Distribution</span>
            </h2>
            <span className="text-[10px] text-gray-400 font-mono">Calculated from Vault</span>
          </div>

          {(!data?.categories || data.categories.length === 0) ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-gray-500 text-xs">
              No entities categorized yet.
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {data.categories.map((entry, index) => {
                const pct = Math.round((entry.count / totalCategoryEntities) * 100);
                const color = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.Default;
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                        <span className="font-semibold text-gray-200">{entry.category}</span>
                      </div>
                      <span className="text-gray-400 font-mono text-[11px]">{entry.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#111827] overflow-hidden border border-[#1f293d]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ingestion Timeline */}
        <div className="p-5 rounded-2xl bg-[#0c111e] border border-[#1a2336] shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1a2336]">
            <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Document Ingestion Activity</span>
            </h2>
            <span className="text-[10px] text-gray-400 font-mono">Real Ingestion Dates</span>
          </div>

          <div className="space-y-3 pt-1">
            {(!data?.ingestion_timeline || data.ingestion_timeline.length === 0) ? (
              <p className="text-xs text-gray-500 py-10 text-center">No timeline activity.</p>
            ) : (
              data.ingestion_timeline.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#111827] border border-[#1f293d] text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <span className="font-bold text-gray-200 block">{item.date}</span>
                      <span className="text-[10px] text-gray-400 font-mono">Completed Document Indexing</span>
                    </div>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30">
                    +{item.count} Files
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Document Formats & Chunks Breakdown */}
        <div className="p-5 rounded-2xl bg-[#0c111e] border border-[#1a2336] shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1a2336]">
            <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              <span>Chunks Per Document Breakdown</span>
            </h2>
            <span className="text-[10px] text-gray-400 font-mono">Density Indicator</span>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pt-1">
            {(!data?.chunks_per_doc || data.chunks_per_doc.length === 0) ? (
              <p className="text-xs text-gray-500 py-10 text-center">No documents indexed.</p>
            ) : (
              data.chunks_per_doc.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#111827] border border-[#1f293d] text-xs"
                >
                  <span className="font-semibold text-gray-200 truncate max-w-xs">{item.filename}</span>
                  <span className="font-mono text-cyan-400 font-bold">{item.chunks} chunks</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
