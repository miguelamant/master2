// ===== TopWorstSellers.js =====
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TopWorstSellers.css';
import Optionbar from './Optionbar';
import { api } from "apiService";

// Import category icons
import beerIcon from './Icons/beer.svg';
import cocktailIcon from './Icons/cocktail.svg';
import coffeeIcon from './Icons/coffee.svg';
import juicesIcon from './Icons/juices.svg';
import mocktailsIcon from './Icons/mocktails.svg';
import softdrinksIcon from './Icons/softdrinks.svg';
import spiritsIcon from './Icons/spirits.svg';
import sportdrinksIcon from './Icons/sportdrinks.svg';
import teaIcon from './Icons/tea.svg';
import wineIcon from './Icons/wine.svg';

// Import highlight icons
import highMarginIcon from './Icons/highmargin.svg';
import trendingIcon from './Icons/trending.svg';
import ecoIcon from './Icons/ecofriendly.svg';
import summerIcon from './Icons/summer.svg';
import winterIcon from './Icons/winter.svg';
import autumnIcon from './Icons/autumn.svg';
import springIcon from './Icons/spring.svg';

// Import production location icons
import locallyIcon from './Icons/locallyproduced.svg';
import belgiumIcon from './Icons/madeinbelgium.svg';
import globalIcon from './Icons/globallysourced.svg';
import {highlightOptions, locationOptions, seasonOptions, segmentOptions} from "./optionbarOptions";


// Map category names to icons
const categoryIconMap = {
    Beer: beerIcon,
    Cocktail: cocktailIcon,
    Coffee: coffeeIcon,
    Juices: juicesIcon,
    Mocktails: mocktailsIcon,
    'Soft Drinks': softdrinksIcon,
    Spirits: spiritsIcon,
    'Sport/Energy Drinks': sportdrinksIcon,
    'Tea & Infusions': teaIcon,
    Wine: wineIcon
};

// Map season to icons
const seasonIconMap = {
    Summer: summerIcon,
    Winter: winterIcon,
    Autumn: autumnIcon,
    Spring: springIcon
};

const TooltipIcon = ({ src, alt, tooltip, className }) => (
    <div className="tooltip-wrapper">
        <img src={src} alt={alt} className={className} />
        <div className="tooltip-bubble">{tooltip}</div>
    </div>
);


const TopWorstSellers = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('top');
    const [items, setItems] = useState([]);
    const [businessCity, setBusinessCity] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        segments:   new Set(segmentOptions.map(o => o.id)),
        highlights: new Set(highlightOptions.map(o => o.id)),
        seasons:    new Set(seasonOptions.map(o => o.id)),
        locations:  new Set(locationOptions.map(o => o.id)),
    });

    // Fetch business address info
    useEffect(() => {
        api.get('/api/business-info', { withCredentials: true })
            .then(res => setBusinessCity(res.data.city || ''))
            .catch(err => console.error('Business-info error', err));
    }, []);

    // Fetch this year and last year sales
    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get('/api/sales', { withCredentials: true }),
            api.get('/api/sales/last-year', { withCredentials: true }),
        ])
            .then(([currentRes, lastYearRes]) => {
                const lastYearMap = new Map(
                    lastYearRes.data.map(i => [i.id_menu_item, i.total_sold])
                );
                const mapped = currentRes.data.map(i => {
                    const thisCount = i.total_sold ?? i.sold_count;
                    const lastCount = lastYearMap.get(i.id_menu_item) || 0;
                    const diffPercent = lastCount > 0
                        ? ((thisCount - lastCount) / lastCount) * 100
                        : null;

                    return {
                        id: i.id_menu_item,
                        name: i.item_name,
                        count: thisCount,
                        lastYearCount: lastCount,
                        diffPercent,
                        category: i.category,
                        high_margin: i.is_high_margin === 1,
                        trending: i.is_trending === 1,
                        eco_friendly: i.eco_friendly === 'Yes' || i.eco_friendly === 1,
                        season: i.season || 'Unknown',
                        prodCity:    i.prodCity,
                        prodCountry: i.prodCountry,
                        categoryId:   i.id_category,
                        price: i.price
                    };
                });
                setItems(mapped);
            })
            .catch(err => {
                console.error('Fetch sales failed:', err);
                setError('Kon verkoopcijfers niet laden');
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Loading…</p>;
    if (error) return <p className="error">{error}</p>;

    // Compute percentage stats
    const sortedByDiff = items.filter(i => i.diffPercent != null).sort((a, b) => b.diffPercent - a.diffPercent);
    const bestGainer = sortedByDiff[0] || {};
    const worstLoser = sortedByDiff[sortedByDiff.length - 1] || {};

    const sortedByProfit = [...items].sort((a, b) => (b.count * b.price) - (a.count * a.price));
    const mostProfit = sortedByProfit[0] || {};
    const leastProfit = sortedByProfit[sortedByProfit.length - 1] || {};

    // Sort and filter by searchTerm
    const sorted = [...items].sort((a, b) =>
        sortOrder === 'top' ? b.count - a.count : a.count - b.count
    );
    // filtered by search + filters
    const visible = sorted.filter(item => {
        if (!item.name.toLowerCase().includes(searchTerm.toLowerCase().replace(/[ &\/]/g,'_'))) {
            return false;
        }
        // search
        if(!item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        // segment
        if(!filters.segments.has(item.category.toLowerCase())) return false;

        // highlight filter: must match any selected highlight if any toggled
        if(!filters.highlights.has(highlightOptions.find(o=>o.label==='High Margin').id) && item.high_margin === true) return false;
        if(!filters.highlights.has(highlightOptions.find(o=>o.label==='Trending').id) && item.trending === true) return false;
        if(!filters.highlights.has(highlightOptions.find(o=>o.label==='Eco-Friendly').id) && item.eco_friendly === true) return false;

        if(!filters.seasons.has(seasonOptions.find(o=>o.label==='Summer').id) && item.season === "Summer") return false;
        if(!filters.seasons.has(seasonOptions.find(o=>o.label==='Winter').id) && item.season === "Winter") return false;
        if(!filters.seasons.has(seasonOptions.find(o=>o.label==='Spring').id) && item.season === "Spring") return false;
        if(!filters.seasons.has(seasonOptions.find(o=>o.label==='Autumn').id) && item.season === "Autumn") return false;

        // Location filter: determine label then check id
        const locLabel = item.prodCity===businessCity
            ? 'Locally Produced'
            : (item.prodCountry==='Belgium' ? 'Made in Belgium' : 'Globally Sourced');
        const locOpt = locationOptions.find(o => o.label===locLabel);
        if (locOpt && !filters.locations.has(locOpt.id)) return false;
        return true;
    });

    return (
        <div className="top-worst-container">
            <div className="centre-content">
                <div className="segment-section">
                    <div>{filters.segments}</div>
                    <h2 className="section-title">Statistics</h2>
                    <div className="stats-cards">
                        <div className="stat-card">
                            <h3>Biggest Gainer</h3>
                            <h1 className="stat-card-item">{bestGainer.name || '–'}</h1>
                            <div className="stat-card-number"> {bestGainer.diffPercent != null ? `+${bestGainer.diffPercent.toFixed(1)}%` : '–'}</div>
                        </div>
                        <div className="stat-card">
                            <h3>Biggest Loser</h3>
                            <h1 className="stat-card-item">{worstLoser.name || '–'}</h1>
                            <div className="stat-card-number"> {worstLoser.diffPercent != null ? `${worstLoser.diffPercent.toFixed(1)}%` : '–'}</div>
                        </div>
                        <div className="stat-card">
                            <h3>Most profit</h3>
                            <h1 className="stat-card-item">{mostProfit.name || '–'}</h1>
                        </div>
                        <div className="stat-card">
                            <h3>Least profit</h3>
                            <h1 className="stat-card-item">{leastProfit.name || '–'}</h1>
                        </div>
                    </div>
                </div>
                <div className="items-section">
                    {/* header */}
                    <div className="list-header">
                        <div className="header-title">
                            <p>Statistics</p>
                            <h2 className="section-title">Menu-items</h2>
                        </div>
                        <div className="section-order">
              <span
                  className={`order-button ${sortOrder === 'top' ? 'active' : ''}`}
                  onClick={() => setSortOrder('top')}
              >Top sellers ↑</span>
                            <span
                                className={`order-button ${sortOrder === 'worst' ? 'active' : ''}`}
                                onClick={() => setSortOrder('worst')}
                            >Worst sellers ↓</span>
                        </div>
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {/* list */}
                    <ul className="items-list">
                        {visible.map((item, idx) => {
                            console.log('CAT raw:', item.category);
                            return (
                                <li key={item.id} className="item">
                                    <div className="item-main">
                                        <span className="item-rank">{idx + 1}.</span>
                                        <span className="item-name">{item.name}</span>
                                        <div className="item-icons">
                                            {/* category icon */}
                                            {item.category && categoryIconMap[item.category] && (
                                                <TooltipIcon
                                                    src={categoryIconMap[item.category]}
                                                    alt={item.category}
                                                    tooltip={item.category}
                                                    className="category-icon"
                                                />
                                            )}
                                            {/* high margin */}
                                            {item.high_margin && (
                                                <TooltipIcon
                                                    src={highMarginIcon}
                                                    alt="High Margin"
                                                    tooltip="High Margin"
                                                    className="highlight-icon"
                                                />
                                            )}
                                            {/* trending */}
                                            {item.trending && (
                                                <TooltipIcon
                                                    src={trendingIcon}
                                                    alt="Trending"
                                                    tooltip="Trending"
                                                    className="highlight-icon"
                                                />
                                            )}
                                            {/* eco-friendly */}
                                            {item.eco_friendly && (
                                                <TooltipIcon
                                                    src={ecoIcon}
                                                    alt="Eco Friendly"
                                                    tooltip="Eco Friendly"
                                                    className="highlight-icon"
                                                />
                                            )}
                                            {/* season */}
                                            {item.season !== 'Unknown' && seasonIconMap[item.season] && (
                                                <TooltipIcon
                                                    src={seasonIconMap[item.season]}
                                                    alt={item.season}
                                                    tooltip={`Popular in the ${item.season}`}
                                                    className="highlight-icon"
                                                />
                                            )}
                                            {/* production location */}
                                            {item.prodCity && item.prodCountry && (
                                                <TooltipIcon
                                                    src={
                                                        // same city => locally
                                                        item.prodCity === businessCity ? locallyIcon :
                                                            // same country (Belgium) => made in Belgium
                                                            (item.prodCountry === 'Belgium' ? belgiumIcon : globalIcon)
                                                    }
                                                    alt={
                                                        item.prodCity === businessCity ? 'Locally Produced' :
                                                            (item.prodCountry === 'Belgium' ? 'Made in Belgium' : 'Global')
                                                    }
                                                    tooltip={
                                                        item.prodCity === businessCity ? 'Locally Produced' :
                                                            (item.prodCountry === 'Belgium' ? 'Made in Belgium' : 'Sourced Globally')
                                                    }
                                                    className="location-icon"
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="item-stats">
                                        <span className="item-count">{item.count} sold</span>
                                        {item.diffPercent != null && (
                                            <span
                                                className="item-diff"
                                                style={{color: item.diffPercent >= 0 ? '#4d8f2f' : '#ba3636'}}
                                            >
                                            {item.diffPercent >= 0 ? '+' : ''}
                                                {item.diffPercent.toFixed(1)}%
                                        </span>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
            <Optionbar filters={filters} onChange={setFilters}/>
        </div>
    );
};

export default TopWorstSellers;
