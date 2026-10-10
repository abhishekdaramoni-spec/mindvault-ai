import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 85;

/**
 * Computes a Dagre directed hierarchical layout (Top-to-Bottom or Left-to-Right).
 * Automatically spaces nodes and separates disconnected components.
 */
export function getHierarchicalLayout(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: 50,    // Space between horizontal nodes
    ranksep: 75,    // Space between hierarchical levels
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPos = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPos.x - NODE_WIDTH / 2,
        y: nodeWithPos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Computes an organized multi-ring force-directed / cluster layout for exploratory browsing.
 * Groups nodes with high degrees in central layers, placing leaves in outer orbits without overlaps.
 */
export function getExploreLayout(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  // 1. Calculate degree for each node
  const degreeMap = new Map<string, number>();
  nodes.forEach((n) => degreeMap.set(n.id, 0));
  edges.forEach((e) => {
    degreeMap.set(e.source, (degreeMap.get(e.source) || 0) + 1);
    degreeMap.set(e.target, (degreeMap.get(e.target) || 0) + 1);
  });

  // Sort nodes descending by degree
  const sorted = [...nodes].sort(
    (a, b) => (degreeMap.get(b.id) || 0) - (degreeMap.get(a.id) || 0)
  );

  // Group into concentric orbits (ring 0: top hubs, ring 1: connected, ring 2: peripheral)
  const ringCapacities = [6, 14, 24, 40, 60];
  const ringRadii = [180, 360, 560, 780, 1020];

  let currentRing = 0;
  let countInRing = 0;
  const ringNodes: Node[][] = [[]];

  sorted.forEach((node) => {
    if (countInRing >= (ringCapacities[currentRing] || 50)) {
      currentRing++;
      ringNodes[currentRing] = [];
      countInRing = 0;
    }
    ringNodes[currentRing].push(node);
    countInRing++;
  });

  const layoutedNodes: Node[] = [];
  const centerX = 600;
  const centerY = 500;

  ringNodes.forEach((nodesInRing, ringIdx) => {
    const radius = ringRadii[ringIdx] || (ringIdx * 240);
    const totalInRing = nodesInRing.length;

    nodesInRing.forEach((node, idx) => {
      // Deterministic angle offset per ring to prevent radial edge overlaps
      const angleOffset = (ringIdx * Math.PI) / 6;
      const angle = (idx / (totalInRing || 1)) * 2 * Math.PI + angleOffset;
      const x = centerX + radius * Math.cos(angle) - NODE_WIDTH / 2;
      const y = centerY + radius * Math.sin(angle) - NODE_HEIGHT / 2;

      layoutedNodes.push({
        ...node,
        position: { x, y },
      });
    });
  });

  return { nodes: layoutedNodes, edges };
}
