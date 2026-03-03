import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "./layoutOnboarding";
import "./Distribution.css";
import DistributionEditor from "./components/DistributionEditor";

// Icons (SVG) - same folder as your PIN/TARGET_2
import NORTH_AMERICA from "../Dashboard/Icons/taste_group/US.svg";
import LATIN_AMERICA from "../Dashboard/Icons/taste_group/SOUTH_AMERICA.svg";
import EUROPE from "../Dashboard/Icons/taste_group/EUROPE.svg";
import AFRICA from "../Dashboard/Icons/taste_group/AFRICA.svg";
import MIDDLE_EAST_NORTH_AFRICA from "../Dashboard/Icons/taste_group/UAE.svg";
import EAST_SOUTHEAST_ASIA from "../Dashboard/Icons/taste_group/VIETNAM.svg";
import SOUTH_ASIA from "../Dashboard/Icons/taste_group/INDIA.svg";
import OCEANIA from "../Dashboard/Icons/taste_group/OCEANIA.svg";

export default function Regioverdeling() {
  const navigate = useNavigate();

  const groups = [
    {
      key: "NORTH_AMERICA",
      label: "North America",
      color: "#60A5FA",
      iconSrc: NORTH_AMERICA,
      tooltip: "Noord-Amerikaanse invloeden (VS/Canada).",
    },
    {
      key: "LATIN_AMERICA",
      label: "Latin America",
      color: "#34D399",
      iconSrc: LATIN_AMERICA,
      tooltip: "Latijns-Amerikaanse invloeden (Mexico, Centraal/Zuid-Amerika).",
    },
    {
      key: "EUROPE",
      label: "Europe",
      color: "#FBBF24",
      iconSrc: EUROPE,
      tooltip: "Europese invloeden (klassiek, regionaal, traditioneel).",
    },
    {
      key: "AFRICA",
      label: "Africa",
      color: "#F97316",
      iconSrc: AFRICA,
      tooltip: "Afrikaanse invloeden (Noord/Sub-Sahara, diverse stijlen).",
    },
    {
      key: "MIDDLE_EAST_NORTH_AFRICA",
      label: "Middle East & North Africa",
      color: "#A78BFA",
      iconSrc: MIDDLE_EAST_NORTH_AFRICA,
      tooltip: "MENA-invloeden (Levant, Maghreb, kruidig/aromatisch).",
    },
    {
      key: "EAST_SOUTHEAST_ASIA",
      label: "East & Southeast Asia",
      color: "#22C55E",
      iconSrc: EAST_SOUTHEAST_ASIA,
      tooltip: "Oost- en Zuidoost-Aziatische invloeden (umami, wok, streetfood).",
    },
    {
      key: "SOUTH_ASIA",
      label: "South Asia",
      color: "#EC4899",
      iconSrc: SOUTH_ASIA,
      tooltip: "Zuid-Aziatische invloeden (India, Pakistan, Sri Lanka, specerijen).",
    },
    {
      key: "OCEANIA",
      label: "Oceania",
      color: "#0EA5E9",
      iconSrc: OCEANIA,
      tooltip: "OceaniÃƒÂ«-invloeden (AustraliÃƒÂ«/NZ, fusion, modern).",
    },
  ];

  // Current must sum to 100 (based on your earlier example)
  const current = {
    NORTH_AMERICA: 12,
    LATIN_AMERICA: 9,
    EUROPE: 38,
    AFRICA: 8,
    MIDDLE_EAST_NORTH_AFRICA: 7,
    EAST_SOUTHEAST_ASIA: 15,
    SOUTH_ASIA: 6,
    OCEANIA: 5,
  };

  return (
      <Layout title="Assortment positioning" progress={75}>
        <div className="dist-container">
          <DistributionEditor
              groups={groups}
              current={current}
              storageKey="fb_region_target_v1"
              onNext={() => navigate("/seizoensverdeling")}
              nextLabel="Volgende"
              maxGroups={8}
              showStackIcons={true}
          />
        </div>
      </Layout>
  );
}
