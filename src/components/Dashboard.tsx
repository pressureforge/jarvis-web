import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { getOntology } from '../lib/api';
import { Entity, Relation } from '../types';

const nodeColors: Record<string, string> = {
  Person: '#00f0ff',
  Project: '#9d00ff',
  Task: '#00ff9f',
  Event: '#ff6b00',
  Document: '#ffff00',
};

function getLayoutedNodes(entities: Entity[], relations: Relation[]) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  dagreGraph.setGraph({ rankdir: 'LR', ranksep: 200, nodesep: 100 });

  const nodes: Node[] = entities.map(entity => {
    const name = String(entity.properties.name || entity.properties.title || entity.id);
    const props = Object.entries(entity.properties)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
      .join('\n');
    const fullText = `${name}\n${props}`;
    
    return {
      id: entity.id,
      data: { label: fullText },
      position: { x: 0, y: 0 },
      type: 'default',
      style: {
        background: '#0a0a0f',
        border: `2px solid ${nodeColors[entity.type] || '#888'}`,
        borderRadius: '8px',
        padding: '12px 16px',
        color: nodeColors[entity.type] || '#888',
        fontWeight: 600,
        fontSize: '11px',
        minWidth: '220px',
        maxWidth: '300px',
        whiteSpace: 'pre-wrap',
        textAlign: 'left',
        boxShadow: `0 0 20px ${nodeColors[entity.type] || '#888'}40`,
        fontFamily: "'Courier New', monospace",
      },
    };
  });

  const edges: Edge[] = relations.map((rel, i) => ({
    id: `${rel.from}-${rel.rel}-${rel.to}-${i}`,
    source: rel.from,
    target: rel.to,
    label: rel.rel,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#00f0ff', strokeWidth: 2 },
    labelStyle: { fill: '#00f0ff', fontSize: 10, fontWeight: 600 },
    labelBgStyle: { fill: '#0a0a0f', fillOpacity: 0.9, rx: 4 },
    labelBgPadding: [8, 4] as [number, number],
    markerEnd: { type: MarkerType.ArrowClosed, color: '#00f0ff' },
  }));

  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: 220, height: 100 });
  });

  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - 110,
      y: nodeWithPosition.y - 50,
    };
  });

  return { nodes, edges };
}

function GraphView({ entities, relations }: { 
  entities: Entity[], 
  relations: Relation[],
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const layouted = useMemo(() => {
    return getLayoutedNodes(entities, relations);
  }, [entities, relations]);

  useEffect(() => {
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, [layouted, setNodes, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      fitViewOptions={{ padding: 0.1 }}
      minZoom={0.05}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      style={{ background: '#0a0a0f' }}
    >
      <Background color="#00f0ff" gap={20} size={0.5} />
      <Controls 
        style={{ background: '#12121a', borderRadius: '8px', border: '1px solid rgba(0, 240, 255, 0.3)' }}
      />
    </ReactFlow>
  );
}

interface DashboardProps {
  onClose: () => void;
}

export default function Dashboard({ onClose }: DashboardProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOntology();
      setEntities(data.entities || []);
      setRelations(data.relations || []);
    } catch (e) {
      console.error('Load error:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}>
      <div className="top-bar">
        <button className="nav-btn" onClick={onClose}>
          💬 Chat
        </button>
      </div>
      
      <div style={{ width: '100%', height: '100%', paddingTop: '60px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>Loading...</div>
        ) : entities.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>No entities</div>
        ) : (
          <ReactFlowProvider>
            <GraphView entities={entities} relations={relations} />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
}
