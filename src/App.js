import React from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import './index.css';

// Import all components
import WelcomePage from './Onboarding/WelcomePage';
import ContactPage from './Onboarding/Basisinformatie';
import TypeHoreca from "./Onboarding/TypeHoreca";
import Zitplaatsen from "./Onboarding/Zitplaatsen";
import Kenmerken from "./Onboarding/Kenmerken";
import Leeftijdsverdeling from "./Onboarding/Leeftijdsverdeling";
import Profielverdeling from "./Onboarding/Profielverdeling";
import Personas from "./Onboarding/Personas";
import ClienteleAnalysis from "./Onboarding/ClienteleAnalysis";
import ToerismeAnalysis from "./Onboarding/ToerismeAnalysis";
import UploadMenu from "./Onboarding/UploadMenu";
import MenuFrequency from "./Onboarding/MenuFrequency";
import Promoties from "./Onboarding/Promoties";
import MarketingStrategy from "./Onboarding/MarketingStrategy";
import Belangrijker1 from "./Onboarding/Belangrijker1";
import Belangrijker2 from "./Onboarding/Belangrijker2";
import Belangrijker3 from "./Onboarding/Belangrijker3";
import WrappedIntro from "./Wrapped/WrappedIntro";
import TopverkopersDrank from "./Wrapped/TopverkopersDrank";
import PrijsOptimalisatie from "./Wrapped/PrijsOptimalisatie";
import PrijsVergelijking from "./Wrapped/PrijsVergelijking";
import Specialiteit from "./Wrapped/Specialiteit";
import Dashboard from "./Dashboard/Dashboard";
import Categorieen from "./Wrapped/Categorieen";
import TopverkopersEten from "./Wrapped/TopverkopersEten";
import StijgersDrank from "./Wrapped/StijgersDrank";
import StijgersEten from "./Wrapped/StijgersEten";
import HotForYou from "./Wrapped/HotForYou";
import HotForNextSeason from "./Wrapped/HotForNextSeason";
import LandingPage from "./Landing/LandinginPage";

// Import OnboardingProvider for context
import { OnboardingProvider } from './Onboarding/OnboardingContext';
import { AssortmentProvider } from './context/AssortmentContext';
import Regioverdeling from "./Onboarding/Regioverdeling";
import Regioverdeling2a from "./Onboarding/Regioverdeling2a";
import Innovatieverdeling from "./Onboarding/Innovatieverdeling";
import Seizoensverdeling from "./Onboarding/Seizoensverdeling";
import Identiteitsverdeling from "./Onboarding/Identiteitsverdeling";
import Trendyverdeling from "./Onboarding/Trendyverdeling";

import Localiteitsverdeling from "./Onboarding/Localiteitsverdeling";
import Oorsprongverdeling from "./Onboarding/Oorsprongverdeling";
import Budgetverdeling from "./Onboarding/Budgetverdeling";
import Ecologyverdeling from "./Onboarding/Ecologyverdeling";
import Healthyverdeling from "./Onboarding/Healthyverdeling";

const wrappedRoutes = [
    "/wrapped1",
    "/wrapped2",
    "/wrapped3",
    "/wrapped4",
    "/wrapped5",
    "/wrapped6",
    "/wrapped7",
    "/wrapped8",
    "/wrapped9",
    "/wrapped10",
    "/wrapped11",
];

function WrappedNavigator({ currentPath }) {
    const navigate = useNavigate();

    const handleNavigation = (direction) => {
        const currentIndex = wrappedRoutes.indexOf(currentPath);
        if (direction === "next" && currentIndex < wrappedRoutes.length - 1) {
            navigate(wrappedRoutes[currentIndex + 1]);
        } else if (direction === "prev" && currentIndex > 0) {
            navigate(wrappedRoutes[currentIndex - 1]);
        }
    };

    return (
        <div
            className="navigator-container"
            onClick={(e) => {
                const screenWidth = window.innerWidth;
                if (e.clientX > screenWidth / 2) {
                    handleNavigation("next");
                } else {
                    handleNavigation("prev");
                }
            }}
            style={{ width: "100vw", height: "100vh", position: "fixed", top: 0, left: 0, zIndex: 1000 }}
        />
    );
}

function App() {
    return (
        <OnboardingProvider>
        <AssortmentProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/welcomepage" element={<WelcomePage />} />
                    <Route path="/contact" element={<ContactPage />} />


                    <Route path="/regioverdeling" element={<Regioverdeling />} />
                    <Route path="/regioverdeling2a" element={<Regioverdeling2a />} />
                    <Route path="/leeftijdsverdeling" element={<Leeftijdsverdeling />} />
                    <Route path="/innovatieverdeling" element={<Innovatieverdeling />} />
                    <Route path="/seizoensverdeling" element={<Seizoensverdeling />} />
                    <Route path="/identiteitsverdeling" element={<Identiteitsverdeling />} />
                    <Route path="/trendyverdeling" element={<Trendyverdeling />} />

                    <Route path="/localiteitsverdeling" element={<Localiteitsverdeling />} />
                    <Route path="/oorsprongverdeling" element={<Oorsprongverdeling />} />
                    <Route path="/budgetverdeling" element={<Budgetverdeling />} />
                    <Route path="/ecologyverdeling" element={<Ecologyverdeling />} />
                    <Route path="/healthyverdeling" element={<Healthyverdeling />} />


                    <Route path="/personas" element={<Personas />} />
                    <Route path="/clienteleanalysis" element={<ClienteleAnalysis />} />

                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/welcome" element={<LandingPage />} />

                    {/* Wrapped Routes */}
                    {wrappedRoutes.map((route, index) => (
                        <Route
                            key={index}
                            path={route}
                            element={
                                <>
                                    <WrappedNavigator currentPath={route} />
                                    {index === 0 && <WrappedIntro />}
                                    {index === 1 && <TopverkopersDrank />}
                                    {index === 2 && <TopverkopersEten />}
                                    {index === 3 && <StijgersDrank />}
                                    {index === 4 && <StijgersEten />}
                                    {index === 5 && <PrijsOptimalisatie />}
                                    {index === 6 && <PrijsVergelijking />}
                                    {index === 7 && <Specialiteit />}
                                    {index === 8 && <HotForYou />}
                                    {index === 9 && <HotForNextSeason />}
                                    {index === 10 && <Categorieen />}
                                </>
                            }
                        />
                    ))}
                </Routes>
            </Router>
        </AssortmentProvider>
        </OnboardingProvider>
    );
}

export default App;

/*                    <Route path="/toerisme" element={<ToerismeAnalysis />} />
                    <Route path="/uploadmenu" element={<UploadMenu />} />
                    <Route path="/menufrequency" element={<MenuFrequency />} />
                    <Route path="/promoties" element={<Promoties />} />
                    <Route path="/marketingstrategy" element={<MarketingStrategy />} />
                    <Route path="/belangrijker1" element={<Belangrijker1 />} />
                    <Route path="/belangrijker2" element={<Belangrijker2 />} />
                    <Route path="/belangrijker3" element={<Belangrijker3 />} />

                    <Route path="/typehoreca" element={<TypeHoreca />} />
                    <Route path="/zitplaatsen" element={<Zitplaatsen />} />
                    <Route path="/kenmerken" element={<Kenmerken />} />
                    <Route path="/leeftijdsverdeling" element={<Leeftijdsverdeling />} />
                    <Route path="/profielverdeling" element={<Profielverdeling />} />

                    */