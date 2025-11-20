import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import './ChatArea.css';

const ChatArea = ({ character, onToggleSidebar, isSidebarOpen, onToggleRightSidebar, isRightSidebarOpen }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    // Mock initial messages
    const [messages, setMessages] = useState([
        { id: 1, sender: 'ai', text: `Hello! I am ${character.name}. How can I help you today?`, timestamp: '10:00 AM', avatar: character.avatar },
    ]);

    // Reset messages when character changes
    useEffect(() => {
        setMessages([
            { id: 1, sender: 'ai', text: `Hello! I am ${character.name}. How can I help you today?`, timestamp: '10:00 AM', avatar: character.avatar },
        ]);
    }, [character]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newMessage = {
            id: Date.now(),
            sender: 'user',
            text: input,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMessage]);
        setInput('');

        // Simulate AI response
        setTimeout(() => {
            const aiResponse = {
                id: Date.now() + 1,
                sender: 'ai',
                text: `This is a simulated response from ${character.name}. I am processing "${input}".`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                avatar: character.avatar
            };
            setMessages(prev => [...prev, aiResponse]);
        }, 1000);
    };

    return (
        <div className="chat-area">
            <div className="chat-header">
                <div className="chat-header-left">
                    <button className="icon-btn toggle-btn" onClick={onToggleSidebar}>
                        {isSidebarOpen ? '«' : '»'}
                    </button>
                    <div className="chat-header-info">
                        <div className="header-avatar">{character.avatar}</div>
                        <div>
                            <div className="header-name">{character.name}</div>
                            <div className="header-status">Online</div>
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="icon-btn toggle-btn" onClick={onToggleRightSidebar}>
                        {isRightSidebarOpen ? '»' : '«'}
                    </button>
                </div>
            </div>

            <div className="messages-container">
                {messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="input-area">
                <form className="input-container" onSubmit={handleSend}>
                    <input
                        type="text"
                        className="chat-input"
                        placeholder={`Message ${character.name}...`}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button type="submit" className="send-btn" disabled={!input.trim()}>
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatArea;
