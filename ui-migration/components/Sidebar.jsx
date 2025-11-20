import React from 'react';
import './Sidebar.css';

const Sidebar = ({ onSelectCharacter, selectedId }) => {
    const characters = [
        { id: 1, name: 'Atlas', role: 'Guide', avatar: 'A' },
        { id: 2, name: 'Luna', role: 'Creative Assistant', avatar: 'L' },
        { id: 3, name: 'Nova', role: 'Data Analyst', avatar: 'N' },
        { id: 4, name: 'Orion', role: 'Strategist', avatar: 'O' },
    ];

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h1 className="app-title">Aether</h1>
                <button className="new-chat-btn">
                    <span>+</span> New Chat
                </button>
            </div>

            <div className="sidebar-content">
                <div className="section-label">Your Characters</div>
                <ul className="character-list">
                    {characters.map((char) => (
                        <li
                            key={char.id}
                            className={`character-item ${selectedId === char.id ? 'active' : ''}`}
                            onClick={() => onSelectCharacter(char.id)}
                        >
                            <div className="character-avatar">{char.avatar}</div>
                            <div className="character-info">
                                <div className="character-name">{char.name}</div>
                                <div className="character-role">{char.role}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="user-avatar">U</div>
                    <div className="user-name">User</div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
