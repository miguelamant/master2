import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./layoutOnboarding";
import "./Distribution.css";
import DistributionEditor from "./components/DistributionEditor";

import TRADITIONAL from "../Dashboard/Icons/taste_group/TRADITIONAL.svg";
import MAINSTREAM from "../Dashboard/Icons/taste_group/MAINSTREAM.svg";
import EXPLORATIVE from "../Dashboard/Icons/taste_group/EXPLORATIVE.svg";

export default function Innovatieverdeling() {
  const navigate = useNavigate();

  const groups = [
    {
      key: "CONSERVATIVE",
      label: "Conservative",
      color: "#60A5FA",
      iconSrc: TRADITIONAL,
      tooltip: "Veilige, herkenbare keuzes. Klassiek en weinig risico.",
    },
    {
      key: "MAINSTREAM",
      label: "Mainstream",
      color: "#FBBF24",
      iconSrc: MAINSTREAM,
      tooltip: "Breed toegankelijk. Populaire smaken en trends die ‘werken’.",
    },
    {
      key: "EXPLORATIVE",
      label: "Explorative",
      color: "#34D399",
      iconSrc: EXPLORATIVE,
      tooltip: "Verrassend en avontuurlijk. Nieuwe smaken, combinaties en inspiratie.",
    },
  ];

  // Must sum to 100
  const current = {
    CONSERVATIVE: 30,
    MAINSTREAM: 55,
    EXPLORATIVE: 15,
  };

  return (
    <Layout title="Assortment positioning" progress={70}>
      <div className="dist-container">
        <DistributionEditor
          groups={groups}
          current={current}
          storageKey="fb_innovatie_target_v1"
          leftColWidth={240}
          maxGroups={3}
          nextLabel="Volgende"
          onNext={() => navigate("/regioverdeling")}
        />
      </div>
    </Layout>
  );
}