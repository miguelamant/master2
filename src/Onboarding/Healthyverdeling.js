import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./layoutOnboarding";
import "./Distribution.css";
import DistributionEditor from "./components/DistributionEditor";

import NORMAL from "../Dashboard/Icons/taste_group/NORMAL.svg";
import HEALTH from "../Dashboard/Icons/taste_group/HEALTH.svg";

export default function Healthyverdeling() {
  const navigate = useNavigate();

  const groups = [
    { key: "NORMAL", label: "Normal", color: "#60A5FA", iconSrc: NORMAL, tooltip: "Geen expliciete gezondheidsfocus (baseline)." },
    { key: "HEALTHY", label: "Healthy", color: "#34D399", iconSrc: HEALTH, tooltip: "Gezondheidsfocus: mindful, lighter, voedzaam, ‘better-for-you’." },
  ];

  const current = { NORMAL: 75, HEALTHY: 25 };

  return (
    <Layout title="Assortment positioning" progress={86}>
      <div className="dist-container">
        <DistributionEditor
          groups={groups}
          current={current}
          storageKey="fb_healthy_target_v1"
          leftColWidth={240}
          maxGroups={2}
          nextLabel="Volgende"
          onNext={() => navigate("/clienteleanalysis")}
        />
      </div>
    </Layout>
  );
}