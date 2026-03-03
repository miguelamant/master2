import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./layoutOnboarding";
import "./Distribution.css";
import DistributionEditor from "./components/DistributionEditor";

import NORMAL_ICON from "../Dashboard/Icons/taste_group/NORMAL.svg";
import TRENDY_ICON from "../Dashboard/Icons/taste_group/IG_TRENDY.svg";

export default function Trendyverdeling() {
  const navigate = useNavigate();

  const groups = [
    {
      key: "NORMAL",
      label: "Normal",
      color: "#60A5FA",
      iconSrc: NORMAL_ICON,
      tooltip: "Klassiek/standaard. Niet gericht op social hype.",
    },
    {
      key: "GENZY",
      label: "Genzy / Trendy",
      color: "#EC4899",
      iconSrc: TRENDY_ICON,
      tooltip: "Instagrammable/TikTok-gevoelig: social heavy, trendy uitstraling, shareable.",
    },
  ];

  const current = {
    NORMAL: 70,
    GENZY: 30,
  };

  return (
    <Layout title="Assortment positioning" progress={76}>
      <div className="dist-container">
        <DistributionEditor
          groups={groups}
          current={current}
          storageKey="fb_trendy_target_v1"
          leftColWidth={240}
          maxGroups={2}
          nextLabel="Volgende"
          onNext={() => navigate("/localiteitsverdeling")}
        />
      </div>
    </Layout>
  );
}