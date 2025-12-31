// src/Layout.js
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopWorstSellers from './TopWorstSellers';
import ToReprice from "./ToReprice";
import WrappedDashboard from "./WrappedDashboard";
import Menu from "./Menu";
import './Layout.css';
import '../index.css';
import ToAdd from './ToAdd';

const ToRemoveComponent = () => (
    <div><h2>To Remove Component</h2><p>Coming soon...</p></div>
);

const Layout = ({ children }) => {
    const [selectedOption, setSelectedOption] = useState('beers');

    let MainContent = null;
    switch (selectedOption) {
        case 'stats':
            MainContent = <TopWorstSellers />;
            break;
        case 'wrapped':
            MainContent = <WrappedDashboard />;
            break;

        // existing
        case 'beers':
            MainContent = <ToAdd section="beers" />;
            break;
        case 'refreshments':
            MainContent = <ToAdd section="refreshments" />;
            break;

        // NEW sections
        case 'liquors':
            MainContent = <ToAdd section="liquors" />;
            break;
        case 'wines':
            MainContent = <ToAdd section="wines" />;
            break;
        case 'hotdrinks':
            MainContent = <ToAdd section="hotdrinks" />; // FE token; map as you like
            break;
        case 'meals':
            MainContent = <ToAdd section="meals" />;
            break;
        case 'snacks':
            MainContent = <ToAdd section="snacks" />;
            break;
        case 'cocktails':
            MainContent = <ToAdd section="cocktails" />;
            break;

        case 'to-remove':
            MainContent = <ToRemoveComponent />;
            break;
        case 'to-reprice':
            MainContent = <ToReprice />;
            break;
        case 'edit-menu':
            MainContent = <Menu />;
            break;
        default:
            MainContent = <ToAdd section="beers" />;
    }

    return (
        <div className="layout-container">
            <Sidebar
                selectedOption={selectedOption}
                onSelectionChange={setSelectedOption}
            />
            <div className="main-content">
                {MainContent}
                {children}
            </div>
        </div>
    );
};

export default Layout;
