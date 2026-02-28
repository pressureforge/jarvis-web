import { useEffect, useState, useCallback } from 'react';
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
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
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

function GraphView({ entities, relations, onNodeClick }: { 
  entities: Entity[], 
  relations: Relation[],
  onNodeClick: NodeClickHandler 
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const typeOrder = ['Person', 'Project', 'Task', 'Event', 'Document'];
    const typePositions: Record<string, number> = {};
    
    const newNodes: Node[] = entities.map((entity) => {
      const type = entity.type;
      if (!typePositions[type]) typePositions[type] = 0;
      
      const name = String(entity.properties.name || entity.properties.title || entity.id);
      const color = nodeColors[type] || '#888888';
      const typeIdx = typeOrder.indexOf(type);
      const x = typeIdx * 300 + (typePositions[type] % 3) * 200;
      const y = Math.floor(typePositions[type] / 3) * 180;
      
      typePositions[type]++;
      
      return {
        id: entity.id,
        position: { x, y },
        data: { label: name.length > 25 ? name.substring(0, 22) + '...' : name },
        style: {
          background: color,
          border: `2px solid ${color}88`,
          borderRadius: '8px',
          padding: '12px 18px',
          color: '#000',
          fontWeight: 600,
          fontSize: '13px',
          minWidth: '150px',
          textAlign: 'center',
        },
      };
    });
    
    const newEdges: Edge[] = relations.map((rel, i) => ({
      id: `${rel.from}-${rel.rel}-${rel.to}-${i}`,
      source: rel.from,
      target: rel.to,
      label: rel.rel,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#666', strokeWidth: 2 },
      labelStyle: { fill: '#aaa', fontSize: 10 },
      labelBgStyle: { fill: '#1a1a2e', fillOpacity: 0.9 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#666',
      },
    }));
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [entities, relations, setNodes, setEdges]);

  return (
    <div style={{ width: '100%', height: '500px', borderRadius: '12px', overflow: 'hidden' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#333" gap={20} />
        <Controls />
        <MiniMap nodeColor={(n) => nodeColors[n.type || 'default'] || '#888'} />
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
              <span className="entity-type">{selectedNode.type}</span>
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
