import React from 'react';
import './IconComposer.css';

// BASES
import { ReactComponent as BeerLager } from '../Icons/beer_lager.svg';
import { ReactComponent as BeerWhite } from '../Icons/beer_white.svg';
import { ReactComponent as BeerSour } from '../Icons/beer_sour.svg';
import { ReactComponent as BeerFruit } from '../Icons/beer_fruit.svg';
import { ReactComponent as BeerBrown } from '../Icons/beer_brown.svg';
import { ReactComponent as BeerBlondAmber } from '../Icons/beer_blond_amber.svg';
import { ReactComponent as BeerBitter } from '../Icons/beer_bitter.svg';
import { ReactComponent as BeerStout } from '../Icons/beer_stout.svg';
import { ReactComponent as BeerSmoothie } from '../Icons/beer_smoothie.svg';
import { ReactComponent as BeerTafel } from '../Icons/beer_tafel.svg';
import { ReactComponent as BeerOther } from '../Icons/beer_other.svg';

// BADGES (comment out any you don’t have yet)
import { ReactComponent as BadgeZero } from '../Icons/badges/badge_zero.svg';
import { ReactComponent as BadgeSparkling } from '../Icons/badges/badge_sparkling.svg';
import { ReactComponent as BadgeLactoseFree } from '../Icons/badges/badge_lactose_free.svg';
import { ReactComponent as BadgeGlutenFree } from '../Icons/badges/badge_gluten_free.svg';

const BASES = {
    beer_lager: BeerLager, beer_white: BeerWhite, beer_sour: BeerSour,
    beer_fruit: BeerFruit, beer_brown: BeerBrown, beer_blond_amber: BeerBlondAmber,
    beer_bitter: BeerBitter, beer_stout: BeerStout, beer_smoothie: BeerSmoothie,
    beer_tafel: BeerTafel, beer_other: BeerOther,
};

const BADGES = {
    badge_zero: BadgeZero, badge_sparkling: BadgeSparkling,
    badge_lactose_free: BadgeLactoseFree, badge_gluten_free: BadgeGlutenFree,
};

export default function IconComposer({ base, badges = [], size = 22, title }) {
    const Base = BASES[base] || BASES.beer_other;
    const comps = badges.map(t => BADGES[t]).filter(Boolean).slice(0, 3);
    const [B1, B2, B3] = comps;

    return (
        <span className="ic" style={{ width: size, height: size }} title={title || base} aria-label={title || base}>
      {/* base */}
            <Base className="ic-svg ic-base" />
            {/* badges anchored to corners — always consistent */}
            {B1 && <B1 className="ic-svg ic-badge ic-tr" />}
            {B2 && <B2 className="ic-svg ic-badge ic-br" />}
            {B3 && <B3 className="ic-svg ic-badge ic-bl" />}
    </span>
    );
}
