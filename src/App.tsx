import { useState } from 'react';
import Chat from './components/Chat';
import Dashboard from './components/Dashboard';

function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat');

  return (
    <div className="app">
      <header className="header">
        <h1>Jarvis</h1>
        <p className="tagline">AI Assistant</p>
        <div className="status">Online</div>
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 Chat
        </button>
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          🔗 Graph
        </button>
      </div>

      <main className="main">
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'dashboard' && <Dashboard />}
      </main>
    </div>
  );
}

export default App;
