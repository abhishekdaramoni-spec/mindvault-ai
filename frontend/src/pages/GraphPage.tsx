import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Network,
  Filter,
  Search,
  Maximize2,
  RefreshCw,
  Eye,
  EyeOff,
  Layers,
  FileText,
  X,
  Sparkles,
  Compass,
  ArrowRight,
  ChevronRight,
  Focus,
  BookOpen,
  Info,
} from 'lucide-react';
import { fetchKnowledgeGraph, GraphData, GraphNode as ApiGraphNode, GraphEdge as ApiGraphEdge } from '../services/api';
import { KnowledgeNode, KnowledgeNodeData } from '../components/KnowledgeNode';
import { getHierarchicalLayout, getExploreLayout, NODE_WIDTH, NODE_HEIGHT } from '../utils/graphLayout';

const nodeTypes = {
  knowledgeNode: KnowledgeNode,
};

const categoryColors: Record<string, string> = {
  Technology: '#8b5cf6', // Violet
  Algorithm: '#06b6d4',  // Cyan
  Person: '#f59e0b',     // Amber
  Organization: '#10b981', // Emerald
  Topic: '#ec4899',      // Pink
  Concept: '#3b82f6',    // Blue
  Default: '#64748b',    // Slate
};

function KnowledgeGraphCanvas() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ApiGraphEdge | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [layoutMode, setLayoutMode] = useState<'hierarchical' | 'explore'>('hierarchical');
  const [showEdgeLabels, setShowEdgeLabels] = useState<boolean>(true);
  const [focusOnlyConnected, setFocusOnlyConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();
  const initialFitDone = useRef(false);

  // 1. Fetch Graph Data
  const loadGraph = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchKnowledgeGraph();
      setGraphData(data);
    } catch (e) {
      console.error('Failed to load knowledge graph:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  // 2. Compute Connected Subgraph & Degree Maps
  const { degreeMap, neighborMap } = useMemo(() => {
    const degs = new Map<string, number>();
    const neighbors = new Map<string, Set<string>>();

    if (graphData) {
      graphData.nodes.forEach((n) => {
        degs.set(n.id, 0);
        neighbors.set(n.id, new Set<string>());
      });

      graphData.edges.forEach((e) => {
        degs.set(e.source, (degs.get(e.source) || 0) + 1);
        degs.set(e.target, (degs.get(e.target) || 0) + 1);

        neighbors.get(e.source)?.add(e.target);
        neighbors.get(e.target)?.add(e.source);
      });
    }

    return { degreeMap: degs, neighborMap: neighbors };
  }, [graphData]);

  // 3. Filter and Apply Layout
  const applyLayout = useCallback(() => {
    if (!graphData) return;

    // Filter nodes
    let filteredApiNodes = graphData.nodes.filter((n) => {
      const matchesCat = filterCategory === 'all' || n.category === filterCategory;
      const matchesSearch = !searchTerm || n.label.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCat && matchesSearch;
    });

    // If focus mode is active with a selected node
    if (focusOnlyConnected && selectedNodeId) {
      const directNeighbors = neighborMap.get(selectedNodeId) || new Set();
      filteredApiNodes = filteredApiNodes.filter(
        (n) => n.id === selectedNodeId || directNeighbors.has(n.id)
      );
    }

    const validNodeIdSet = new Set(filteredApiNodes.map((n) => n.id));

    // Filter edges to only include ones between visible nodes
    const filteredApiEdges = graphData.edges.filter(
      (e) => validNodeIdSet.has(e.source) && validNodeIdSet.has(e.target)
    );

    // Build React Flow Node objects
    const rawNodes: Node[] = filteredApiNodes.map((n) => {
      const isSelected = selectedNodeId === n.id;
      const isNeighbor = selectedNodeId ? neighborMap.get(selectedNodeId)?.has(n.id) : false;
      const isHighlighted = isSelected || isNeighbor || (!!searchTerm && n.label.toLowerCase().includes(searchTerm.toLowerCase()));
      const isDimmed = selectedNodeId ? !isSelected && !isNeighbor : false;

      const nodeData: KnowledgeNodeData = {
        label: n.label,
        category: n.category,
        description: n.description,
        isHighlighted,
        isDimmed,
        degree: degreeMap.get(n.id) || 0,
      };

      return {
        id: n.id,
        type: 'knowledgeNode',
        position: { x: 0, y: 0 },
        data: nodeData,
      };
    });

    // Build React Flow Edge objects
    const rawEdges: Edge[] = filteredApiEdges.map((e) => {
      const isEdgeActive =
        selectedNodeId && (e.source === selectedNodeId || e.target === selectedNodeId);
      const isDimmed = selectedNodeId ? !isEdgeActive : false;

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'smoothstep',
        label: showEdgeLabels ? e.relation_type : undefined,
        animated: isEdgeActive || false,
        style: {
          stroke: isEdgeActive ? '#22d3ee' : isDimmed ? '#1e293b' : '#475569',
          strokeWidth: isEdgeActive ? 2.5 : 1.2,
          opacity: isDimmed ? 0.2 : 0.85,
        },
        labelStyle: {
          fill: isEdgeActive ? '#67e8f9' : '#94a3b8',
          fontSize: 10,
          fontWeight: 600,
          background: '#0b0f19',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isEdgeActive ? '#22d3ee' : '#64748b',
          width: 14,
          height: 14,
        },
      };
    });

    // Run layout engine
    let layoutResult =
      layoutMode === 'hierarchical'
        ? getHierarchicalLayout(rawNodes, rawEdges, 'TB')
        : getExploreLayout(rawNodes, rawEdges);

    setNodes(layoutResult.nodes);
    setEdges(layoutResult.edges);

    // Fit view after layout update
    setTimeout(() => {
      fitView({ padding: 0.18, duration: 400 });
    }, 50);
  }, [
    graphData,
    filterCategory,
    searchTerm,
    layoutMode,
    showEdgeLabels,
    focusOnlyConnected,
    selectedNodeId,
    neighborMap,
    degreeMap,
    setNodes,
    setEdges,
    fitView,
  ]);

  // Re-run layout whenever graph filters or mode change
  useEffect(() => {
    if (graphData && graphData.nodes.length > 0) {
      applyLayout();
    }
  }, [applyLayout, graphData]);

  // Handle Node Selection
  const handleNodeClick = (_: any, node: Node) => {
    setSelectedNodeId(node.id);
    setSelectedEdge(null);
  };

  // Handle Edge Selection
  const handleEdgeClick = (_: any, edge: Edge) => {
    const rawEdge = graphData?.edges.find((e) => e.id === edge.id);
    if (rawEdge) {
      setSelectedEdge(rawEdge);
      setSelectedNodeId(null);
    }
  };

  // Center on Selected Node
  const centerSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    const targetNode = nodes.find((n) => n.id === selectedNodeId);
    if (targetNode) {
      setCenter(
        targetNode.position.x + NODE_WIDTH / 2,
        targetNode.position.y + NODE_HEIGHT / 2,
        { zoom: 1.2, duration: 500 }
      );
    }
  }, [selectedNodeId, nodes, setCenter]);

  // Selected Node Object for Drawer
  const activeNode = useMemo(() => {
    if (!selectedNodeId || !graphData) return null;
    return graphData.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, graphData]);

  // Connected Neighbors for Selected Node
  const activeNeighbors = useMemo(() => {
    if (!selectedNodeId || !graphData) return [];
    const directIds = neighborMap.get(selectedNodeId) || new Set();
    return graphData.nodes.filter((n) => directIds.has(n.id));
  }, [selectedNodeId, graphData, neighborMap]);

  // Connected Edges for Selected Node
  const activeEdges = useMemo(() => {
    if (!selectedNodeId || !graphData) return [];
    return graphData.edges.filter(
      (e) => e.source === selectedNodeId || e.target === selectedNodeId
    );
  }, [selectedNodeId, graphData]);

  const categories = useMemo(() => {
    if (!graphData) return [];
    return Object.keys(graphData.stats?.categories || {});
  }, [graphData]);

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col space-y-3 pb-2 animate-fadeIn">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0c111e] border border-[#1a2336] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-cyan-400 flex items-center justify-center border border-violet-500/30">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Interactive Knowledge Graph</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/20">
                {nodes.length} Nodes • {edges.length} Edges
              </span>
            </h1>
            <p className="text-[11px] text-gray-400">
              Deterministic, evidence-grounded entity relationships with zero-collision graph layout.
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Search Input */}
          <div className="relative w-44">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search concepts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111827] border border-[#1f293d] rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-[#111827] border border-[#1f293d] px-2.5 py-1.5 rounded-xl">
            <Filter className="w-3 h-3 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent text-gray-200 text-[11px] focus:outline-none"
            >
              <option value="all" className="bg-[#111827]">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c} className="bg-[#111827]">{c}</option>
              ))}
            </select>
          </div>

          {/* Layout Mode Switcher */}
          <div className="flex bg-[#111827] border border-[#1f293d] rounded-xl p-0.5">
            <button
              onClick={() => setLayoutMode('hierarchical')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                layoutMode === 'hierarchical'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Organized hierarchical Dagre layers"
            >
              <Layers className="w-3 h-3" />
              <span>Hierarchical</span>
            </button>
            <button
              onClick={() => setLayoutMode('explore')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                layoutMode === 'explore'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Exploratory multi-ring orbit arrangement"
            >
              <Compass className="w-3 h-3" />
              <span>Explore</span>
            </button>
          </div>

          {/* Toggle Labels */}
          <button
            onClick={() => setShowEdgeLabels(!showEdgeLabels)}
            className={`p-1.5 rounded-xl border border-[#1f293d] transition ${
              showEdgeLabels ? 'bg-violet-600/20 text-cyan-300 border-violet-500/40' : 'bg-[#111827] text-gray-400'
            }`}
            title={showEdgeLabels ? 'Hide Relationship Labels' : 'Show Relationship Labels'}
          >
            {showEdgeLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Fit View Action */}
          <button
            onClick={() => fitView({ padding: 0.18, duration: 400 })}
            className="p-1.5 rounded-xl bg-[#111827] border border-[#1f293d] text-gray-300 hover:text-white"
            title="Fit Graph to Viewport"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Reset Layout Action */}
          <button
            onClick={applyLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141d2e] border border-[#1e293b] text-gray-300 hover:text-white hover:bg-[#1a263c] font-semibold"
            title="Re-run Automatic Layout"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-layout</span>
          </button>
        </div>
      </div>

      {/* Main Canvas + Inspector Split View */}
      <div className="flex-1 flex gap-3 overflow-hidden rounded-2xl border border-[#1a2336] bg-[#080d17] relative shadow-2xl">
        <div className="flex-1 h-full relative">
          {nodes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 space-y-3">
              <Network className="w-12 h-12 stroke-1 text-gray-600" />
              <p className="text-sm font-bold text-gray-200">Knowledge Graph is Empty or Filtered Out</p>
              <p className="text-xs max-w-sm">
                No nodes match the selected search criteria or no documents have been indexed yet.
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold"
                >
                  Clear Search Filter
                </button>
              )}
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              onPaneClick={() => {
                setSelectedNodeId(null);
                setSelectedEdge(null);
                setFocusOnlyConnected(false);
              }}
              minZoom={0.2}
              maxZoom={2.5}
              defaultEdgeOptions={{ type: 'smoothstep' }}
            >
              <Background color="#162035" gap={24} size={1} />
              <Controls className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden shadow-2xl text-gray-300" />
              <MiniMap
                nodeColor={(n: any) => {
                  const cat = n.data?.category;
                  return categoryColors[cat] || categoryColors.Default;
                }}
                nodeStrokeWidth={2}
                className="bg-[#0c111e]/90 border border-[#1f293d] rounded-2xl overflow-hidden shadow-2xl !bottom-4 !right-4 !w-52 !h-36"
                maskColor="rgba(8, 13, 23, 0.75)"
              />
            </ReactFlow>
          )}

          {/* Quick Graph Category Legend Badge Strip */}
          <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 p-2 rounded-xl bg-[#0c111e]/90 backdrop-blur-md border border-[#1a2336] shadow-xl text-[10px]">
            <span className="font-bold text-gray-400 uppercase tracking-wider mr-1">Categories:</span>
            {categories.map((c) => (
              <span
                key={c}
                onClick={() => setFilterCategory(filterCategory === c ? 'all' : c)}
                className={`cursor-pointer px-2 py-0.5 rounded-full font-mono font-semibold transition ${
                  filterCategory === c ? 'ring-1 ring-white' : 'opacity-80 hover:opacity-100'
                }`}
                style={{
                  background: `${categoryColors[c] || '#64748b'}22`,
                  color: categoryColors[c] || '#94a3b8',
                  border: `1px solid ${categoryColors[c] || '#64748b'}66`,
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Selected Node Details Drawer */}
        {activeNode && (
          <div className="w-88 bg-[#0c111e]/95 backdrop-blur-xl border-l border-[#1a2336] p-5 flex flex-col justify-between overflow-y-auto shadow-2xl space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1a2336]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <Focus className="w-4 h-4 text-cyan-400" />
                  <span>Concept Provenance</span>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2336]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase mb-2"
                  style={{
                    backgroundColor: `${categoryColors[activeNode.category] || '#64748b'}22`,
                    color: categoryColors[activeNode.category] || '#cbd5e1',
                    border: `1px solid ${categoryColors[activeNode.category] || '#64748b'}55`,
                  }}
                >
                  {activeNode.category}
                </span>
                <h2 className="text-base font-extrabold text-white break-words leading-tight">
                  {activeNode.label}
                </h2>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400 font-mono">
                  <span>{activeNeighbors.length} connected entities</span>
                  <span>•</span>
                  <span>{activeEdges.length} relationships</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={centerSelectedNode}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-[#141d2e] border border-[#1e293b] text-gray-200 hover:text-white text-xs font-semibold"
                >
                  <Focus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Center Node</span>
                </button>
                <button
                  onClick={() => setFocusOnlyConnected(!focusOnlyConnected)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border text-xs font-semibold transition ${
                    focusOnlyConnected
                      ? 'bg-violet-600 text-white border-violet-500 shadow'
                      : 'bg-[#141d2e] border-[#1e293b] text-gray-200 hover:text-white'
                  }`}
                >
                  <Network className="w-3.5 h-3.5 text-violet-400" />
                  <span>{focusOnlyConnected ? 'Full Graph' : 'Isolate Subgraph'}</span>
                </button>
              </div>

              {/* Description / Extraction Passage */}
              {activeNode.description && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Context & Extraction</span>
                  <p className="text-xs text-gray-300 leading-relaxed bg-[#111827] p-3 rounded-xl border border-[#1f293d] font-sans">
                    {activeNode.description}
                  </p>
                </div>
              )}

              {/* Connected Relationships List */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Relationships ({activeEdges.length})
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {activeEdges.map((e) => {
                    const isOutgoing = e.source === activeNode.id;
                    const otherNodeId = isOutgoing ? e.target : e.source;
                    const otherNode = graphData?.nodes.find((n) => n.id === otherNodeId);

                    return (
                      <div
                        key={e.id}
                        onClick={() => setSelectedNodeId(otherNodeId)}
                        className="p-2.5 rounded-xl bg-[#111827] border border-[#1f293d] hover:border-violet-500/40 cursor-pointer transition text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-cyan-300 text-[10px] font-bold">
                            {isOutgoing ? '➜ ' : '⬅ '} {e.relation_type}
                          </span>
                          <span className="text-[9px] text-gray-400">{(e.confidence * 100).toFixed(0)}% Conf</span>
                        </div>
                        <div className="font-bold text-gray-200 flex items-center justify-between">
                          <span className="truncate">{otherNode?.label || otherNodeId}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Edge Details Drawer */}
        {selectedEdge && (
          <div className="w-88 bg-[#0c111e]/95 backdrop-blur-xl border-l border-[#1a2336] p-5 flex flex-col justify-between overflow-y-auto shadow-2xl space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1a2336]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                  <span>Relationship Provenance</span>
                </div>
                <button
                  onClick={() => setSelectedEdge(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2336]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold block w-fit mb-2">
                  {selectedEdge.relation_type}
                </span>
                <p className="text-xs text-gray-300 leading-relaxed bg-[#111827] p-3 rounded-xl border border-[#1f293d]">
                  {selectedEdge.description || 'Verified relationship extracted from document passage.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#111827] border border-[#1f293d] space-y-1.5 text-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Extraction Confidence</span>
                <p className="font-mono text-emerald-400 font-bold text-sm">
                  {(selectedEdge.confidence * 100).toFixed(0)}% Evidence Grounded
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const GraphPage: React.FC = () => {
  return (
    <ReactFlowProvider>
      <KnowledgeGraphCanvas />
    </ReactFlowProvider>
  );
};
