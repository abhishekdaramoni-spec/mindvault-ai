import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

const categoryBadges: Record<string, { bg: string; text: string; border: string }> = {
  Technology: { bg: 'rgba(139, 92, 246, 0.15)', text: '#c4b5fd', border: 'rgba(139, 92, 246, 0.5)' },
  Algorithm: { bg: 'rgba(6, 182, 212, 0.15)', text: '#67e8f9', border: 'rgba(6, 182, 212, 0.5)' },
  Person: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fcd34d', border: 'rgba(245, 158, 11, 0.5)' },
  Organization: { bg: 'rgba(16, 185, 129, 0.15)', text: '#6ee7b7', border: 'rgba(16, 185, 129, 0.5)' },
  Topic: { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.5)' },
  Concept: { bg: 'rgba(59, 130, 246, 0.15)', text: '#93c5fd', border: 'rgba(59, 130, 246, 0.5)' },
  Default: { bg: 'rgba(100, 116, 139, 0.15)', text: '#cbd5e1', border: 'rgba(100, 116, 139, 0.5)' },
};

export interface KnowledgeNodeData extends Record<string, unknown> {
  label: string;
  category: string;
  description?: string;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  degree?: number;
}


export const KnowledgeNode = memo(({ data, selected }: { data: KnowledgeNodeData; selected?: boolean }) => {
  const badge = categoryBadges[data.category] || categoryBadges.Default;

  return (
    <div
      className={`relative w-[210px] rounded-xl px-3.5 py-2.5 transition-all duration-200 select-none ${
        data.isDimmed
          ? 'opacity-25 grayscale'
          : selected
          ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0b0f19] shadow-xl shadow-cyan-500/25 scale-105'
          : data.isHighlighted
          ? 'ring-2 ring-violet-400 shadow-lg shadow-violet-500/30 scale-102'
          : 'hover:border-violet-400/80 hover:shadow-lg hover:shadow-black/60'
      }`}
      style={{
        background: selected ? '#18233c' : '#0e1526',
        border: `1.5px solid ${selected ? '#22d3ee' : badge.border}`,
        boxShadow: selected ? '0 0 16px rgba(34, 211, 238, 0.3)' : '0 4px 14px rgba(0,0,0,0.4)',
      }}
    >
      {/* React Flow Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 bg-violet-400 border border-[#0b0f19] rounded-full"
      />

      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span
          className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ background: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}
        >
          {data.category}
        </span>
        {data.degree !== undefined && data.degree > 0 && (
          <span className="text-[9px] font-mono text-gray-400 px-1 rounded bg-[#162035]">
            {data.degree} links
          </span>
        )}
      </div>

      <div className="font-bold text-xs text-gray-100 leading-snug line-clamp-2" title={data.label}>
        {data.label}
      </div>

      {data.description && (
        <p className="text-[10px] text-gray-400 line-clamp-1 mt-1 font-serif italic">
          {data.description}
        </p>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 bg-cyan-400 border border-[#0b0f19] rounded-full"
      />
    </div>
  );
});

KnowledgeNode.displayName = 'KnowledgeNode';
