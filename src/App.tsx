import { useState } from 'react';
import Chat from './components/Chat';
import Dashboard from './components/Dashboard';

function App() {
  const [view, setView] = useState<'chat' | 'ontology'>('chat');

  return (
    <div className="app">
      <div className="top-bar">
        <button 
          className={`nav-btn ${view === 'ontology' ? 'active' : ''}`}
          onClick={() => setView(view === 'ontology' ? 'chat' : 'ontology')}
        >
          {view === 'ontology' ? '← Back' : '🔗 Ontology'}
        </button>
      </div>

      <main className="main">
        {view === 'chat' && <Chat />}
        {view === 'ontology' && <Dashboard />}
      </main>
    </div>
  );
}

export default App;
