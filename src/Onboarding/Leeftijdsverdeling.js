import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./layoutOnboarding";
import "./Distribution.css";
import DistributionEditor from "./components/DistributionEditor";

export default function Leeftijdsverdeling() {
  const navigate = useNavigate();

  const groups = [
    { key: "KIDS", label: "Kids", color: "#60A5FA", badge: "K", tooltip: "Kinderen als doelgroep." },
    { key: "TEEN", label: "Teen", color: "#34D399", badge: "T", tooltip: "Tieners / jongeren." },
    { key: "ADULT", label: "Adult", color: "#FBBF24", badge: "A", tooltip: "Volwassenen." },
    { key: "SENIOR", label: "Senior", color: "#F472B6", badge: "S", tooltip: "Senioren." },
  ];

  const current = { KIDS: 10, TEEN: 12, ADULT: 58, SENIOR: 20 };

  return (
    <Layout title="Assortment positioning" progress={70}>
      <div className="dist-container">
        <DistributionEditor
          groups={groups}
          current={current}
          storageKey="fb_age_target_v6"
          onNext={() => navigate("/regioverdeling")}
          nextLabel="Volgende"
          maxGroups={8}
        />
      </div>
    </Layout>
  );
}