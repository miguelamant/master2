import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./layoutOnboarding";
import "./Distribution.css";
import DistributionEditor from "./components/DistributionEditor";
import WINTER from "../Dashboard/Icons/taste_group/WINTER.svg";

export default function Seizoensverdeling() {
  const navigate = useNavigate();

  const groups = [
    { key: "WINTER",  label: "Winter",  iconSrc: WINTER, color: "#60A5FA", badge: "W",  tooltip: "Sterke winter-focus (bv. feestdagen, comfort, warme smaken)." },
    { key: "SPRING",  label: "Spring",   color: "#34D399", badge: "SP", tooltip: "Lente-focus (frisser, lichter, seizoensgebonden)." },
    { key: "SUMMER",  label: "Summer",   color: "#FBBF24", badge: "SU", tooltip: "Zomer-focus (verfrissend, koud, outdoor, snelle consumptie)." },
    { key: "AUTUMN",  label: "Autumn",   color: "#F97316", badge: "AU", tooltip: "Herfst-focus (rijker, kruidiger, comfort, overgangsseizoen)." },
    { key: "ALLYEAR", label: "All year", color: "#A78BFA", badge: "AY", tooltip: "Stabiel door het jaar heen (evergreens / jaarrond relevant)." },
  ];

  // Som = 100
  const current = {
    WINTER: 18,
    SPRING: 16,
    SUMMER: 30,
    AUTUMN: 16,
    ALLYEAR: 20,
  };

  return (
    <Layout title="Assortment positioning" progress={72}>
      <div className="dist-container">
        <DistributionEditor
          groups={groups}
          current={current}
          storageKey="fb_season_target_v1"
          leftColWidth={240}
          maxGroups={5}
          nextLabel="Volgende"
          onNext={() => navigate("/identiteitsverdeling")}
        />
      </div>
    </Layout>
  );
}