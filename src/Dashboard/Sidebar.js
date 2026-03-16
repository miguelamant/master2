// src/Dashboard/Sidebar.js
import React from 'react';
import './Sidebar.css';

const Sidebar = ({ selectedOption, onSelectionChange, onGoBack }) => {
    return (
        <nav className="sidebar">
            <div className="sidebar-top">
                {selectedOption !== null && (
                    <button
                        className="sidebar-icon-btn back-btn"
                        onClick={onGoBack}
                        title="Back"
                        aria-label="Back to categories"
                    >
                        &#8592;
                    </button>
                )}
            </div>

            <div className="sidebar-middle" />

            <div className="sidebar-bottom">
                <button
                    className="sidebar-icon-btn"
                    onClick={() => window.location.assign('/')}
                    title="Logout"
                    aria-label="Logout"
                >
                    ⏻
                </button>
            </div>
        </nav>
    );
};

export default Sidebar;
