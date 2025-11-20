import React from 'react';
import './RightSidebar.css';

const RightSidebar = ({ character }) => {
    return (
        <div className="right-sidebar">
            <div className="profile-section">
                <div className="profile-avatar-large">{character.avatar}</div>
                <h2 className="profile-name">{character.name}</h2>
                <p className="profile-role">{character.role}</p>
            </div>

            <div className="sidebar-section">
                <h3 className="section-title">Description</h3>
                <p className="section-content">
                    {character.name} is a highly advanced AI designed to assist with {character.role.toLowerCase()} tasks.
                    Always ready to provide insightful analysis and creative solutions.
                </p>
            </div>

            <div className="sidebar-section">
                <h3 className="section-title">Memory</h3>
                <div className="memory-item">
                    <span className="memory-icon">🧠</span>
                    <span className="memory-text">Remembering context from last session...</span>
                </div>
            </div>

            <div className="sidebar-section">
                <h3 className="section-title">Settings</h3>
                <div className="setting-item">
                    <label>Notifications</label>
                    <input type="checkbox" defaultChecked />
                </div>
                <div className="setting-item">
                    <label>Voice Mode</label>
                    <input type="checkbox" />
                </div>
            </div>
        </div>
    );
};

export default RightSidebar;
