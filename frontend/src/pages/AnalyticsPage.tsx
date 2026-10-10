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
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { fetchAnalytics, AnalyticsData } from '../services/api';
import { useNavigate } from 'react-router-dom';

const VIOLET_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#3b82f6'];

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
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.top_concepts.slice(0, 7)} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-25} textAnchor="end" />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1f293d', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={data.categories}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {data.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={VIOLET_COLORS[index % VIOLET_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#1f293d', borderRadius: '8px', fontSize: '11px' }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Ingestion Timeline */}
        <div className="p-5 rounded-2xl bg-[#0c111e] border border-[#1a2336] shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1a2336]">
            <h2 className="text-sm font-bold text-gray-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Document Ingestion Timeline</span>
            </h2>
            <span className="text-[10px] text-gray-400 font-mono">Real Ingestion Dates</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.ingestion_timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1f293d', borderRadius: '8px', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
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

          <div className="space-y-2.5 max-h-60 overflow-y-auto">
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
