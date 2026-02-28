import { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage, pollResponses } from '../lib/api';
import { ChatMessage } from '../types';

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const lastTimestamp = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    try {
      const data = await getMessages();
      const recent = data.messages.slice(-10);
      setMessages(recent.filter(m => m.sender === 'assistant'));
      lastTimestamp.current = data.serverTime;
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async function poll() {
    try {
      const data = await pollResponses(lastTimestamp.current);
      if (data.messages.length > 0) {
        const newMessages = data.messages.filter(m => m.sender === 'assistant');
        setMessages(prev => [...prev, ...newMessages]);
      }
      lastTimestamp.current = data.serverTime;
    } catch (e) {
      console.error('Poll error:', e);
    }
  }

  async function handleSend() {
    if (!input.trim() || sending) return;
    
    const text = input.trim();
    setInput('');
    setSending(true);

    setMessages(prev => [...prev, { sender: 'You', message: text, timestamp: Date.now() }]);

    try {
      await sendMessage(text);
    } catch (e) {
      console.error('Send error:', e);
    }

    setSending(false);
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="message assistant">
            <div className="sender">Jarvis</div>
            Hey! What's on your mind?
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender === 'You' ? 'user' : 'assistant'}`}>
            <div className="sender">{msg.sender}</div>
            {msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button onClick={handleSend} disabled={sending || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
