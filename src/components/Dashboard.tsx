import { useEffect, useState, useCallback } from 'react';
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

  const groupedEntities = entities.reduce<Record<string, Entity[]>>((acc, e) => {
    if (!acc[e.type]) acc[e.type] = [];
    acc[e.type].push(e);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="dashboard">
        <div className="empty-state">Loading ontology...</div>
      </div>
    );
  }

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
          {entities.length === 0 ? (
            <div className="empty-state">No entities yet.</div>
          ) : (
            Object.entries(groupedEntities).map(([type, ents]) => (
              <div key={type} className="section">
                <div className="section-title">{type}s</div>
                {ents.map(entity => (
                  <div 
                    key={entity.id} 
                    className="entity"
                    onClick={() => setSelectedNode(entity)}
                    style={{ borderLeft: `4px solid ${nodeColors[type] || '#888'}` }}
                  >
                    <div className="entity-name">
                      {String(entity.properties.name || entity.properties.title || 'Unnamed')}
                    </div>
                    <div className="entity-props">
                      {Object.entries(entity.properties).slice(0, 3).map(([key, value]) => (
                        <div key={key}>
                          <span>{key}:</span> {Array.isArray(value) ? value.join(', ').substring(0, 50) : String(value).substring(0, 50)}
                        </div>
                      ))}
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
                  <div className="relation-arrow">
                    <span className="rel-node">{rel.from.split('_')[0]}</span>
                    <span className="rel-type">→ {rel.rel} →</span>
                    <span className="rel-node">{rel.to.split('_')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="graph-view">
          {entities.length === 0 ? (
            <div className="empty-state">No entities to display</div>
          ) : (
            <div className="simple-graph">
              {Object.entries(groupedEntities).map(([type, ents], typeIdx) => (
                <div key={type} className="graph-row" style={{ borderLeft: `4px solid ${nodeColors[type] || '#888'}` }}>
                  <div className="graph-type">{type}</div>
                  <div className="graph-items">
                    {ents.map(entity => (
                      <div 
                        key={entity.id} 
                        className="graph-item"
                        onClick={() => setSelectedNode(entity)}
                        style={{ background: nodeColors[type] || '#888' }}
                      >
                        {String(entity.properties.name || entity.properties.title || entity.id).substring(0, 20)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Relations */}
              <div className="relations-view">
                <div className="section-title">Connections</div>
                {relations.map((rel, i) => (
                  <div key={i} className="relation-line">
                    <span>{rel.from}</span>
                    <span className="rel-label">{rel.rel}</span>
                    <span>{rel.to}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Node Detail Modal */}
      {selectedNode && (
        <div className="modal-overlay" onClick={() => setSelectedNode(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="entity-type" style={{ background: nodeColors[selectedNode.type] || '#888' }}>
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
