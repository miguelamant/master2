import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './layoutOnboarding';
import './Personas.css';

// Import images directly
import Budgetbewust from '../profielen/Budgetbewust.png';
import Fijnproever from '../profielen/Fijn-proever.png';
import Gezondheidsbewuste from '../profielen/Gezondheidsbewuste.png';
import LocalLover from '../profielen/Local-Lover.png';
import Luxezoeker from '../profielen/Luxezoeker.png';
import Milieubewuste from '../profielen/Milieubewuste.png';
import Traditionalist from '../profielen/Traditionalist.png';
import Trendvolger from '../profielen/Trendvolger.png';

const personas = [
    { name: "Traditionalist", description: "Houdt van vertrouwde, klassieke gerechten en een huiselijke sfeer. Komt graag op bekende plekken.", image: Traditionalist },
    { name: "Local-Lover", description: "Houdt van authentieke plekken met lokale smaken en cultuur. Bezoekt graag zaken die typisch zijn voor de regio.", image: LocalLover },
    { name: "Trendvolger", description: "Zoekt naar trendy hotspots en vernieuwende gerechten. Houdt van seizoensspecials en fotowaardige gerechten.", image: Trendvolger },
    { name: "Budgetbewust", description: "Let op goede deals en promoties. Kiest voor betaalbare opties zonder kwaliteit te verliezen.", image: Budgetbewust },
    { name: "Fijn-proever", description: "Geniet van verfijnde gerechten en unieke smaken, met oog voor kwaliteit en presentatie.", image: Fijnproever },
    { name: "Gezondheidsbewuste", description: "Gaat voor gezonde opties zoals salades en caloriearme gerechten, passend bij een gezonde levensstijl.", image: Gezondheidsbewuste },
    { name: "Milieubewuste", description: "Kiest voor lokale, biologische en duurzame producten. Waardeert een lage ecologische voetafdruk.", image: Milieubewuste },
    { name: "Sporter", description: "Houdt van exclusieve, luxe ervaringen. Perfect voor speciale gelegenheden met premium opties.", image: Luxezoeker },
    { name: "Feestbeest", description: "Kiest voor lokale, biologische en duurzame producten. Waardeert een lage ecologische voetafdruk.", image: Milieubewuste },
    { name: "Luxezoeker", description: "Houdt van exclusieve, luxe ervaringen. Perfect voor speciale gelegenheden met premium opties.", image: Luxezoeker },
];

const Personas = () => {
    const navigate = useNavigate();

    return (
        <Layout title="Ontmoet onze personas" progress={80}>
            <div className="personas-container">
                <p className="personas-subtitle">Leer de unieke behoeften van de verschillende klanten kennen</p>
                <div className="personas-grid">
                    {personas.map((persona, index) => (
                        <div key={index} className="persona-item">
                            <img src={persona.image} alt={persona.name} className="persona-image" />
                            <div className="persona-info">
                                <h3 className="persona-name">{persona.name}</h3>
                                <p className="persona-description">{persona.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="start-button-container">
                <button className="start-button" onClick={() => navigate('/clienteleanalysis')}>Volgende</button>
            </div>
        </Layout>
    );
};

export default Personas;
