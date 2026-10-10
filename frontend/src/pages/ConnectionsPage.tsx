import React, { useEffect, useState } from 'react';
import { GitFork, Check, X, ExternalLink, Sparkles } from 'lucide-react';
import { fetchConnections, reviewConnection, ConnectionSuggestion } from '../services/api';

export const ConnectionsPage: React.FC = () => {
  const [connections, setConnections] = useState<ConnectionSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchConnections();
      setConnections(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReview = async (id: string, status: 'accepted' | 'dismissed') => {
    try {
      await reviewConnection(id, status);
      setConnections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
    } catch (e) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <GitFork className="w-6 h-6 text-violet-400" />
          <span>Cross-Document Connections</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Discover implicit semantic links and shared concepts connecting separate documents that do not directly cite each other.
        </p>
      </div>

      {connections.length === 0 ? (
        <div className="bg-[#121929] border border-[#1e293b] rounded-xl p-12 text-center text-gray-500">
          <Sparkles className="w-10 h-10 mx-auto mb-2 text-violet-400/50" />
          <h3 className="text-sm font-semibold text-gray-300">No Cross-Document Connections Discovered Yet</h3>
          <p className="text-xs mt-1 max-w-sm mx-auto">
            Upload multiple documents with related technical topics to allow MindVault's semantic connection discovery to correlate them.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {connections.map((c) => (
            <div
              key={c.id}
              className="bg-[#121929] border border-[#1e293b] rounded-xl p-5 hover:border-violet-500/40 transition space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-violet-600/20 text-violet-300 font-semibold text-[11px]">
                    Shared Concept: {c.shared_concept}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {(c.confidence * 100).toFixed(0)}% Confidence
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReview(c.id, 'accepted')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition ${
                      c.status === 'accepted'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-[#162035] text-gray-300 hover:text-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm</span>
                  </button>
                  <button
                    onClick={() => handleReview(c.id, 'dismissed')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition ${
                      c.status === 'dismissed'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-[#162035] text-gray-300 hover:text-white'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Dismiss</span>
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-300 font-medium">{c.reasoning}</p>

              {/* Side-by-side excerpts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-[#0e1424] rounded-lg border border-[#1a2436] space-y-1">
                  <span className="text-[11px] font-bold text-cyan-400 block">{c.doc_a_title}</span>
                  <p className="text-xs text-gray-400 italic font-serif">"{c.excerpt_a}"</p>
                </div>
                <div className="p-3 bg-[#0e1424] rounded-lg border border-[#1a2436] space-y-1">
                  <span className="text-[11px] font-bold text-violet-400 block">{c.doc_b_title}</span>
                  <p className="text-xs text-gray-400 italic font-serif">"{c.excerpt_b}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
