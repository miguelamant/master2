import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./layoutOnboarding";
import "./Distribution.css";
import DistributionEditor from "./components/DistributionEditor";

import BELGIUM from "../Dashboard/Icons/taste_group/BELGIUM.svg";
import GERMANY from "../Dashboard/Icons/taste_group/GERMANY.svg";
import UK from "../Dashboard/Icons/taste_group/UK.svg";
import US from "../Dashboard/Icons/taste_group/US.svg";
import WORLD from "../Dashboard/Icons/taste_group/WORLD.svg";

export default function Oorsprongverdeling() {
  const navigate = useNavigate();

  const groups = [
    { key: "BE",   label: "Belgisch",       color: "#FBBF24", iconSrc: BELGIUM, tooltip: "Bierstijlen met Belgische oorsprong / Belgische klassiekers." },
    { key: "DE",   label: "German",         color: "#60A5FA", iconSrc: GERMANY, tooltip: "Duitse bierstijlen (lager, weizen, bock, etc.)." },
    { key: "UK",   label: "UK",             color: "#34D399", iconSrc: UK,      tooltip: "Britse bierstijlen (ale, stout, porter, etc.)." },
    { key: "US",   label: "US",             color: "#F97316", iconSrc: US,      tooltip: "Amerikaanse craft invloeden (IPA, pale ale, etc.)." },
    { key: "INTL", label: "International",  color: "#A78BFA", iconSrc: WORLD,   tooltip: "Overige internationale oorsprongen (buiten BE/DE/UK/US)." },
  ];

  const current = { BE: 50, DE: 15, UK: 10, US: 15, INTL: 10 };

  return (
    <Layout title="Assortment positioning" progress={80}>
      <div className="dist-container">
        <DistributionEditor
          groups={groups}
          current={current}
          storageKey="fb_oorsprong_target_v1"
          leftColWidth={250}
          maxGroups={5}
          nextLabel="Volgende"
          onNext={() => navigate("/budgetverdeling")}
        />
      </div>
    </Layout>
  );
}