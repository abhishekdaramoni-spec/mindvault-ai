import React, { useEffect, useState } from 'react';
import { Scale, Check, X, AlertTriangle, Sparkles } from 'lucide-react';
import { fetchContradictions, reviewContradiction, ContradictionItem } from '../services/api';

export const ContradictionsPage: React.FC = () => {
  const [contradictions, setContradictions] = useState<ContradictionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchContradictions();
      setContradictions(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReview = async (id: string, status: 'confirmed' | 'dismissed') => {
    try {
      await reviewContradiction(id, status);
      setContradictions((prev) =>
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
          <Scale className="w-6 h-6 text-amber-400" />
          <span>Contradiction Detective</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Identifies inconsistent claims, conflicting assertions, dates, or specifications across your multi-document corpus.
        </p>
      </div>

      {contradictions.length === 0 ? (
        <div className="bg-[#121929] border border-[#1e293b] rounded-xl p-12 text-center text-gray-500">
          <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-amber-400/50" />
          <h3 className="text-sm font-semibold text-gray-300">No Contradictions Detected</h3>
          <p className="text-xs mt-1 max-w-sm mx-auto">
            Your indexed documents do not show conflicting assertions or mutually exclusive claims.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {contradictions.map((c) => (
            <div
              key={c.id}
              className="bg-[#121929] border border-[#1e293b] rounded-xl p-5 hover:border-amber-500/40 transition space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
                  Conflict on Topic: {c.topic}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReview(c.id, 'confirmed')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition ${
                      c.status === 'confirmed'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-[#162035] text-gray-300 hover:text-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Conflict</span>
                  </button>
                  <button
                    onClick={() => handleReview(c.id, 'dismissed')}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition ${
                      c.status === 'dismissed'
                        ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        : 'bg-[#162035] text-gray-300 hover:text-white'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Dismiss</span>
                  </button>
                </div>
              </div>

              {c.reasoning && (
                <p className="text-xs text-gray-300 font-medium bg-[#0e1424] p-3 rounded-lg border border-[#1a2436]">
                  {c.reasoning}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-[#0e1424] rounded-lg border border-[#1a2436] space-y-1">
                  <span className="text-[11px] font-bold text-gray-300 block">{c.doc_a_title}</span>
                  <p className="text-xs text-gray-400 italic font-serif">"{c.claim_a}"</p>
                </div>
                <div className="p-3 bg-[#0e1424] rounded-lg border border-[#1a2436] space-y-1">
                  <span className="text-[11px] font-bold text-gray-300 block">{c.doc_b_title}</span>
                  <p className="text-xs text-gray-400 italic font-serif">"{c.claim_b}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
