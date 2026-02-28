import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
  type NodeClickHandler,
  ReactFlowProvider,
  getLayoutedElements
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { getOntology } from '../lib/api';
import { Entity, Relation, ViewType } from '../types';

const nodeColors: Record<string, string> = {
  Person: '#00d4ff',
  Project: '#7c3aed',
  Task: '#00ff7f',
  Event: '#ff6b6b',
  Document: '#ffd93d',
};

interface DashboardProps {
  viewType: ViewType;
  setViewType: (v: ViewType) => void;
}

function getLayoutedNodes(entities: Entity[], relations: Relation[]) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  dagreGraph.setGraph({ rankdir: 'LR', ranksep: 150, nodesep: 80 });

  const nodes: Node[] = entities.map(entity => ({
    id: entity.id,
    data: { label: String(entity.properties.name || entity.properties.title || entity.id) },
    position: { x: 0, y: 0 },
    type: 'default',
    style: {
      background: nodeColors[entity.type] || '#888',
      border: `2px solid ${nodeColors[entity.type] || '#888'}88`,
      borderRadius: '10px',
      padding: '15px 20px',
      color: '#000',
      fontWeight: 600,
      fontSize: '13px',
      minWidth: '180px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    },
  }));

  const edges: Edge[] = relations.map((rel, i) => ({
    id: `${rel.from}-${rel.rel}-${rel.to}-${i}`,
    source: rel.from,
    target: rel.to,
    label: rel.rel,
    type: 'smoothstep',
    animated: true,
    style: { stroke: '#666', strokeWidth: 2 },
    labelStyle: { fill: '#aaa', fontSize: 11, fontWeight: 500 },
    labelBgStyle: { fill: '#1a1a2e', fillOpacity: 0.95, rx: 4 },
    labelBgPadding: [8, 4] as [number, number],
    markerEnd: { type: MarkerType.ArrowClosed, color: '#666' },
  }));

  nodes.forEach(node => {
    dagreGraph.setNode(node.id, { width: 180, height: 60 });
  });

  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - 90,
      y: nodeWithPosition.y - 30,
    };
  });

  return { nodes, edges };
}

function GraphView({ entities, relations, onNodeClick }: { 
  entities: Entity[], 
  relations: Relation[],
  onNodeClick: NodeClickHandler 
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
    <div style={{ width: '100%', height: '500px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#2a2a4a" gap={24} size={1} />
        <Controls 
          style={{ background: '#1a1a2e', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <MiniMap 
          nodeColor={(n) => nodeColors[n.type || 'default'] || '#888'}
          maskColor="rgba(26, 26, 46, 0.8)"
          style={{ background: '#1a1a2e', borderRadius: '8px' }}
        />
      </ReactFlow>
    </div>
  );
}

export default function Dashboard({ viewType, setViewType }: DashboardProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Entity | null>(null);

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

  const onNodeClick: NodeClickHandler = (_event, node) => {
    const entity = entities.find(e => e.id === node.id);
    if (entity) setSelectedNode(entity);
  };

  const groupedEntities = entities.reduce<Record<string, Entity[]>>((acc, e) => {
    if (!acc[e.type]) acc[e.type] = [];
    acc[e.type].push(e);
    return acc;
  }, {});

  return (
    <div className="dashboard">
      <div className="view-toggle">
        <button 
          className={viewType === 'list' ? 'active' : ''} 
          onClick={() => setViewType('list')}
        >
          📝 List
        </button>
        <button 
          className={viewType === 'graph' ? 'active' : ''} 
          onClick={() => setViewType('graph')}
        >
          🔗 Graph
        </button>
      </div>

      {viewType === 'list' ? (
        <div className="list-view">
          {loading ? (
            <div className="empty-state">Loading...</div>
          ) : entities.length === 0 ? (
            <div className="empty-state">No entities yet.</div>
          ) : (
            Object.entries(groupedEntities).map(([type, ents]) => (
              <div key={type} className="section">
                <div className="section-title">{type}s</div>
                {ents.map(entity => (
                  <div key={entity.id} className="entity" onClick={() => setSelectedNode(entity)}>
                    <div className="entity-name">
                      {String(entity.properties.name || entity.properties.title || 'Unnamed')}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      ) : (
        <ReactFlowProvider>
          <GraphView 
            entities={entities} 
            relations={relations} 
            onNodeClick={onNodeClick} 
          />
        </ReactFlowProvider>
      )}

      {selectedNode && (
        <div className="modal-overlay" onClick={() => setSelectedNode(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="entity-type" style={{ background: nodeColors[selectedNode.type] }}>
                {selectedNode.type}
              </span>
              <button className="modal-close" onClick={() => setSelectedNode(null)}>×</button>
            </div>
            <div className="modal-body">
              <h3>{String(selectedNode.properties.name || selectedNode.properties.title || selectedNode.id)}</h3>
              <div className="modal-props">
                {Object.entries(selectedNode.properties).map(([key, value]) => (
                  <div key={key} className="prop-row">
                    <span className="prop-key">{key}:</span>
                    <span className="prop-value">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
