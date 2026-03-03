import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./layoutOnboarding";
import "./Distribution.css";
import DistributionEditor from "./components/DistributionEditor";

import NORMAL from "../Dashboard/Icons/taste_group/NORMAL.svg";
import ECO from "../Dashboard/Icons/taste_group/ECO.svg";

export default function Ecologyverdeling() {
  const navigate = useNavigate();

  const groups = [
    { key: "NORMAL", label: "Normal", color: "#60A5FA", iconSrc: NORMAL, tooltip: "Geen expliciete ecologische focus (baseline)." },
    { key: "ECO", label: "Ecology", color: "#34D399", iconSrc: ECO, tooltip: "Duurzaam/ecologisch: impact, herkomst, verpakking, ethiek." },
  ];

  const current = { NORMAL: 70, ECO: 30 };

  return (
    <Layout title="Assortment positioning" progress={84}>
      <div className="dist-container">
        <DistributionEditor
          groups={groups}
          current={current}
          storageKey="fb_eco_target_v1"
          leftColWidth={240}
          maxGroups={2}
          nextLabel="Volgende"
          onNext={() => navigate("/healthyverdeling")}
        />
      </div>
    </Layout>
  );
}