// src/Layout.js
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopWorstSellers from './TopWorstSellers';
import ToReprice from "./ToReprice/ToReprice";
import WrappedDashboard from "./WrappedDashboard";
import Menu from "./Menu";
import './Layout.css';
import '../index.css';
import ToAdd from './ToAdd';
import CategoryGrid from './CategoryGrid';
import AssortmentOverview from './AssortmentOverview';

const ToRemoveComponent = () => (
    <div><h2>To Remove Component</h2><p>Coming soon...</p></div>
);

// Categories that go through the assortment overview map before analysis
const ANALYSABLE = new Set(['beers', 'refreshments', 'liquors', 'wines', 'hotdrinks', 'meals', 'snacks', 'cocktails']);

const Layout = ({ children }) => {
    const [selectedOption, setSelectedOption] = useState(null);
    // null = show overview map; a number = go straight to analysis for that store
    const [selectedStoreId, setSelectedStoreId] = useState(null);
    // 'analysis' | 'menu' — what action was chosen from the overview
    const [overviewAction, setOverviewAction]   = useState('analysis');

    function handleCategorySelect(option) {
        setSelectedOption(option);
        setSelectedStoreId(null);   // always show overview first
        setOverviewAction('analysis');
    }

    function handleGoBack() {
        if (selectedStoreId !== null) {
            // go back to overview map
            setSelectedStoreId(null);
        } else {
            // go back to category grid
            setSelectedOption(null);
        }
    }

    function handleSelectStoreForAnalysis(storeId) {
        setOverviewAction('analysis');
        setSelectedStoreId(storeId);
    }

    function handleSelectStoreForMenu(storeId) {
        setOverviewAction('menu');
        setSelectedStoreId(storeId);
    }

    let MainContent = null;

    if (selectedOption === null) {
        MainContent = <CategoryGrid onSelect={handleCategorySelect} />;

    } else if (ANALYSABLE.has(selectedOption) && selectedStoreId === null) {
        // ── assortment overview map ──
        MainContent = (
            <AssortmentOverview
                category={selectedOption}
                onSelectStore={handleSelectStoreForAnalysis}
                onViewMenu={handleSelectStoreForMenu}
            />
        );

    } else {
        // ── post-overview: analysis or menu ──
        switch (selectedOption) {
            case 'stats':
                MainContent = <TopWorstSellers />;
                break;
            case 'wrapped':
                MainContent = <WrappedDashboard />;
                break;
            case 'beers':
                MainContent = overviewAction === 'menu'
                    ? <Menu />
                    : <ToAdd section="beers" />;
                break;
            case 'refreshments':
                MainContent = overviewAction === 'menu'
                    ? <Menu />
                    : <ToAdd section="refreshments" />;
                break;
            case 'liquors':
                MainContent = <ToAdd section="liquors" />;
                break;
            case 'wines':
                MainContent = <ToAdd section="wines" />;
                break;
            case 'hotdrinks':
                MainContent = <ToAdd section="hotdrinks" />;
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
    }

    return (
        <div className="layout-container">
            <Sidebar
                selectedOption={selectedOption}
                onSelectionChange={handleCategorySelect}
                onGoBack={handleGoBack}
            />
            <div className="main-content">
                {MainContent}
                {children}
            </div>
        </div>
    );
};

export default Layout;
