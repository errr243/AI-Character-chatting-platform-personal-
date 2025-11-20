import React from 'react';
import './MessageBubble.css';

const MessageBubble = ({ message }) => {
    const isUser = message.sender === 'user';

    return (
        <div className={`message-row ${isUser ? 'message-row-user' : 'message-row-ai'}`}>
            {!isUser && (
                <div className="message-avatar">
                    {message.avatar || 'AI'}
                </div>
            )}

            <div className={`message-bubble ${isUser ? 'bubble-user' : 'bubble-ai'}`}>
                <div className="message-content">
                    {message.text}
                </div>
                <div className="message-time">
                    {message.timestamp}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
