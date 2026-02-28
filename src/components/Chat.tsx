import { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage, pollResponses } from '../lib/api';
import { ChatMessage } from '../types';

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const lastTimestamp = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  async function loadMessages() {
    try {
      const data = await getMessages();
      setMessages(data.messages.slice(-20));
      lastTimestamp.current = data.serverTime;
    } catch (e) {
      console.error('Load error:', e);
    }
  }

  async function poll() {
    try {
      const data = await pollResponses(lastTimestamp.current);
      if (data.messages.length > 0) {
        setMessages(prev => [...prev, ...data.messages]);
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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="message assistant">
            Hey! What's on your mind?
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender === 'You' || msg.sender === 'guest' ? 'user' : 'assistant'}`}>
            {msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          disabled={sending}
          rows={1}
        />
        <button onClick={handleSend} disabled={sending || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
