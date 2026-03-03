import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./layoutOnboarding";
import "./Distribution.css";
import DistributionEditor from "./components/DistributionEditor";

import BUDGET from "../Dashboard/Icons/taste_group/BUDGET.svg";
import NORMAL from "../Dashboard/Icons/taste_group/NORMAL.svg";
import LUXURY from "../Dashboard/Icons/taste_group/LUXURY.svg";

export default function Budgetverdeling() {
  const navigate = useNavigate();

  const groups = [
    { key: "BUDGET", label: "Budget", color: "#34D399", iconSrc: BUDGET, tooltip: "Prijsgevoelig: value-for-money, promoties, scherpe instap." },
    { key: "NORMAL", label: "Normal", color: "#60A5FA", iconSrc: NORMAL, tooltip: "Standaard prijsniveau: brede middenmoot." },
    { key: "LUXURY", label: "Luxury", color: "#FBBF24", iconSrc: LUXURY, tooltip: "Premium: hogere prijs, kwaliteit/ervaring/merkwaarde." },
  ];

  const current = { BUDGET: 20, NORMAL: 60, LUXURY: 20 };

  return (
    <Layout title="Assortment positioning" progress={82}>
      <div className="dist-container">
        <DistributionEditor
          groups={groups}
          current={current}
          storageKey="fb_budget_target_v1"
          leftColWidth={240}
          maxGroups={3}
          nextLabel="Volgende"
          onNext={() => navigate("/ecologyverdeling")}
        />
      </div>
    </Layout>
  );
}