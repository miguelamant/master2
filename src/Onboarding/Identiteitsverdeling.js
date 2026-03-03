import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./layoutOnboarding";
import "./Distribution.css";
import DistributionEditor from "./components/DistributionEditor";

import MAINSTREAM_ICON from "../Dashboard/Icons/taste_group/MAINSTREAM.svg";
import NORMAL_ICON from "../Dashboard/Icons/taste_group/NORMAL.svg";
import DISTINCT_ICON from "../Dashboard/Icons/taste_group/DISTINCT.svg";

export default function Identiteitsverdeling() {
  const navigate = useNavigate();

  const groups = [
    {
      key: "MAINSTREAM",
      label: "Mainstream",
      color: "#FBBF24",
      iconSrc: MAINSTREAM_ICON,
      tooltip: "Breed herkenbaar. Wat ‘de meeste mensen’ verwachten.",
    },
    {
      key: "NEUTRAL",
      label: "Neutral",
      color: "#60A5FA",
      iconSrc: NORMAL_ICON,
      tooltip: "Tussenpositie. Niet uitgesproken mainstream of distinct.",
    },
    {
      key: "DISTINCT",
      label: "Distinct",
      color: "#34D399",
      iconSrc: DISTINCT_ICON,
      tooltip: "Conceptueel anders dan mainstream: identiteit/beeldvorming (hoe anderen je zien).",
    },
  ];

  const current = {
    MAINSTREAM: 50,
    NEUTRAL: 30,
    DISTINCT: 20,
  };

  return (
    <Layout title="Assortment positioning" progress={74}>
      <div className="dist-container">
        <DistributionEditor
          groups={groups}
          current={current}
          storageKey="fb_identity_target_v1"
          leftColWidth={240}
          maxGroups={3}
          nextLabel="Volgende"
          onNext={() => navigate("/trendyverdeling")}
        />
      </div>
    </Layout>
  );
}