import { useState } from 'react';
import Chat from './components/Chat';
import Dashboard from './components/Dashboard';

function App() {
  const [view, setView] = useState<'chat' | 'ontology'>('chat');

  return (
    <div className="app">
      {view === 'ontology' && (
        <Dashboard onClose={() => setView('chat')} />
      )}
      
      {view === 'chat' && (
        <>
          <div className="top-bar">
            <button 
              className="nav-btn"
              onClick={() => setView('ontology')}
            >
              🔗 Ontology
            </button>
          </div>
          <main className="main">
            <Chat />
          </main>
        </>
      )}
    </div>
  );
}

export default App;
