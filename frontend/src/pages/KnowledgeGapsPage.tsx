import React, { useEffect, useState } from 'react';
import { Sparkles, HelpCircle, ArrowRight, BookOpen } from 'lucide-react';
import { fetchKnowledgeGaps, KnowledgeGapItem } from '../services/api';
import { Link } from 'react-router-dom';

export const KnowledgeGapsPage: React.FC = () => {
  const [gaps, setGaps] = useState<KnowledgeGapItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchKnowledgeGaps();
      setGaps(res);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-400" />
          <span>Knowledge Gap Finder</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Surfaces weakly connected concepts, unexplained terms, missing definitions, and unanswered research questions.
        </p>
      </div>

      {gaps.length === 0 ? (
        <div className="bg-[#121929] border border-[#1e293b] rounded-xl p-12 text-center text-gray-500">
          <HelpCircle className="w-10 h-10 mx-auto mb-2 text-cyan-400/50" />
          <h3 className="text-sm font-semibold text-gray-300">No Knowledge Gaps Detected</h3>
          <p className="text-xs mt-1 max-w-sm mx-auto">
            Your knowledge base appears tightly cohesive, or additional documents need to be indexed to identify peripheral concepts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gaps.map((g) => (
            <div
              key={g.id}
              className="bg-[#121929] border border-[#1e293b] rounded-xl p-5 hover:border-cyan-500/40 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-100">{g.topic}</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] uppercase font-mono">
                    {g.category.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">{g.why_identified}</p>

                {g.supporting_excerpt && (
                  <div className="p-3 bg-[#0e1424] rounded-lg border border-[#1a2436] text-[11px] text-gray-400 italic">
                    "{g.supporting_excerpt}"
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#1e293b]/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 block font-medium">Suggested Research Direction</span>
                  <p className="text-xs font-semibold text-violet-300 mt-0.5">{g.suggested_follow_up}</p>
                </div>
                <Link
                  to="/chat"
                  className="p-2 rounded-lg bg-violet-600/20 text-violet-300 hover:bg-violet-600 hover:text-white transition"
                  title="Ask this question in Chat"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
