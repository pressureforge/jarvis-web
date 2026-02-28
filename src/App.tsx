import { useState } from 'react';
import { TabType, ViewType } from '../types';
import Chat from './components/Chat';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [viewType, setViewType] = useState<ViewType>('list');

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
          onClick={() => {
            setActiveTab('dashboard');
            setViewType('list');
          }}
        >
          📋 Dashboard
        </button>
      </div>

      <main className="main">
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'dashboard' && (
          <Dashboard viewType={viewType} setViewType={setViewType} />
        )}
      </main>
    </div>
  );
}

export default App;
