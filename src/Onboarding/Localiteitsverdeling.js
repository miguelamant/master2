import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./layoutOnboarding";
import "./Distribution.css";
import DistributionEditor from "./components/DistributionEditor";

import REGIONAL from "../Dashboard/Icons/taste_group/REGIONAL.svg";
import BELGIUM from "../Dashboard/Icons/taste_group/BELGIUM.svg";
import WORLD from "../Dashboard/Icons/taste_group/WORLD.svg";

export default function Localiteitsverdeling() {
  const navigate = useNavigate();

  const groups = [
    { key: "REGIONAL", label: "Regionaal", color: "#34D399", iconSrc: REGIONAL, tooltip: "Sterke focus op lokale/regionale herkomst en identiteit." },
    { key: "BELGIAN",  label: "Belgisch",  color: "#FBBF24", iconSrc: BELGIUM,  tooltip: "Focus op Belgisch (nationaal) aanbod en Belgische identiteit." },
    { key: "INTL",     label: "Internationaal", color: "#60A5FA", iconSrc: WORLD, tooltip: "Internationale spreiding; wereldkeuken / import / global positioning." },
  ];

  const current = { REGIONAL: 25, BELGIAN: 45, INTL: 30 };

  return (
    <Layout title="Assortment positioning" progress={78}>
      <div className="dist-container">
        <DistributionEditor
          groups={groups}
          current={current}
          storageKey="fb_localiteit_target_v1"
          leftColWidth={250}
          maxGroups={3}
          nextLabel="Volgende"
          onNext={() => navigate("/oorsprongverdeling")}
        />
      </div>
    </Layout>
  );
}