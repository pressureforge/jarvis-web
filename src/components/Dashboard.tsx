import { useEffect, useState, useCallback } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
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

export default function Dashboard({ viewType, setViewType }: DashboardProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Entity | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOntology();
      setEntities(data.entities || []);
      setRelations(data.relations || []);
      
      // Convert entities to React Flow nodes
      const typeOrder = ['Person', 'Project', 'Task', 'Event', 'Document'];
      const typePositions: Record<string, number> = {};
      
      const newNodes: Node[] = (data.entities || []).map((entity) => {
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
          data: { 
            label: name.length > 25 ? name.substring(0, 22) + '...' : name,
            entity: entity
          },
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
            cursor: 'pointer',
          },
        };
      });
      
      // Convert relations to React Flow edges
      const newEdges: Edge[] = (data.relations || []).map((rel, i) => ({
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
    } catch (e) {
      console.error('Load error:', e);
    }
    setLoading(false);
  }, [setNodes, setEdges]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onNodeClick = (_: unknown, node: { data: { entity: Entity } }) => {
    setSelectedNode(node.data.entity);
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
                    <div className="entity-header">
                      <span className="entity-type">{entity.type}</span>
                      <span className="entity-id">{entity.id}</span>
                    </div>
                    <div className="entity-name">
                      {String(entity.properties.name || entity.properties.title || 'Unnamed')}
                    </div>
                    <div className="entity-props">
                      {Object.entries(entity.properties).map(([key, value]) => (
                        <div key={key}>
                          <span>{key}:</span> {Array.isArray(value) ? value.join(', ') : String(value)}
                        </div>
                      ))}
                    </div>
                    <div className="entity-updated">
                      Updated: {new Date(entity.updated).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
          {relations.length > 0 && (
            <div className="section">
              <div className="section-title">Relations</div>
              {relations.map((rel, i) => (
                <div key={i} className="entity">
                  <div className="entity-name">
                    {rel.from} → {rel.rel} → {rel.to}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="graph-view">
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
      )}

      {/* Node Detail Modal */}
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
              <div className="modal-meta">
                <div>ID: {selectedNode.id}</div>
                <div>Created: {new Date(selectedNode.created).toLocaleString()}</div>
                <div>Updated: {new Date(selectedNode.updated).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
