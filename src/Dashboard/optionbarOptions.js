// Import all icons
import beerIcon from './Icons/beer.svg';
import cocktailIcon from './Icons/cocktail.svg';
import coffeeIcon from './Icons/coffee.svg';
import juicesIcon from './Icons/juices.svg';
import mocktailsIcon from './Icons/mocktails.svg';
import softdrinksIcon from './Icons/softdrinks.svg';
import spiritsIcon from './Icons/spirits.svg';
import sportdrinksIcon from './Icons/sportdrinks.svg';
import teaIcon from './Icons/tea.svg';
import wineIcon from './Icons/wine.svg';

import locallyProducedIcon from './Icons/locallyproduced.svg';
import madeInBelgiumIcon from './Icons/madeinbelgium.svg';
import globallySourcedIcon from './Icons/globallysourced.svg';

import summerIcon from './Icons/summer.svg';
import winterIcon from './Icons/winter.svg';
import autumnIcon from './Icons/autumn.svg';
import springIcon from './Icons/spring.svg';

import highMarginIcon from './Icons/highmargin.svg';
import hotForYouIcon from './Icons/hotforyou.svg';
import trendingIcon from './Icons/trending.svg';
import ecoFriendlyIcon from './Icons/ecofriendly.svg';

import beerBitterIcon from './Icons/beer_bitter.svg';
import beerBlondAmberIcon from './Icons/beer_blond_amber.svg';
import beerBlondHabIcon from './Icons/beer_sour.svg';
import beerBrownIcon from './Icons/beer_brown.svg';
import beerExtraIcon from './Icons/beer_extra.svg';
import beerFruitIcon from './Icons/beer_fruit.svg';
import beerLagerIcon from './Icons/beer_lager.svg';
import beerMissingIcon from './Icons/beer_missing.svg';
import beerOtherIcon from './Icons/beer_other.svg';
import beerSmoothieIcon from './Icons/beer_smoothie.svg';
import beerStoutIcon from './Icons/beer_stout.svg';
import beerTafelIcon from './Icons/beer_tafel.svg';
import beerWhiteIcon from './Icons/beer_white.svg';
import beerSourIcon from './Icons/beer_sour.svg';


// Drinks / Segments
{/*
export const segmentOptions = [
    { id: 'beer', label: 'Beer', checked: true, icon: beerIcon },
    { id: 'cocktail', label: 'Cocktail', checked: true, icon: cocktailIcon },
    { id: 'coffee', label: 'Coffee', checked: true, icon: coffeeIcon },
    { id: 'juices', label: 'Juices', checked: true, icon: juicesIcon },
    { id: 'mocktails', label: 'Mocktails', checked: true, icon: mocktailsIcon },
    { id: 'soft drinks', label: 'Soft Drinks', checked: true, icon: softdrinksIcon },
    { id: 'spirits', label: 'Spirits', checked: true, icon: spiritsIcon },
    { id: 'sport/energy drinks', label: 'Sport/Energy Drinks', checked: true, icon: sportdrinksIcon },
    { id: 'tea & infusions', label: 'Tea & Infusions', checked: true, icon: teaIcon },
    { id: 'wine', label: 'Wine', checked: true, icon: wineIcon },
];
*/}


export const segmentOptions = [
    { id: 'lager', label: 'Lagers', checked: true, icon: beerLagerIcon },
    { id: 'traditional_strong_blond', label: '', checked: true, icon: beerBlondAmberIcon },
    { id: 'blond_amber', label: 'Blond & Amber', checked: true, icon: beerBlondAmberIcon },
    { id: 'bitter_beers', label: 'Blond Bitters', checked: true, icon: beerBitterIcon },
    { id: 'white_beers', label: 'White Beers', checked: true, icon: beerWhiteIcon },
    { id: 'sour_beers', label: 'Sours', checked: true, icon: beerSourIcon },
    { id: 'fruit_beers', label: 'Fruit Beers', checked: true, icon: beerFruitIcon },
    { id: 'brown_beers', label: 'Brown & Dark ales', checked: true, icon: beerBrownIcon },
    { id: 'ciders', label: 'Tafelbier', checked: true, icon: beerTafelIcon },   // cider mapped to tafel/extra
    { id: 'stout_porter', label: 'Stout Porter', checked: true, icon: beerStoutIcon },
    { id: 'smoothie_sour', label: 'Smoothie Sour', checked: true, icon: beerSmoothieIcon },
    { id: 'other', label: 'Other', checked: true, icon: beerOtherIcon },
];



// Production origin
export const locationOptions = [
    { id: 'locally-produced', label: 'Locally Produced', checked: true, icon: locallyProducedIcon },
    { id: 'made-in-belgium', label: 'Made in Belgium', checked: true, icon: madeInBelgiumIcon },
    { id: 'globally-sourced', label: 'Globally Sourced', checked: true, icon: globallySourcedIcon },
];

// Seasons
export const seasonOptions = [
    { id: 'summer', label: 'Summer', checked: true, icon: summerIcon },
    { id: 'winter', label: 'Winter', checked: true, icon: winterIcon },
    { id: 'autumn', label: 'Autumn', checked: true, icon: autumnIcon },
    { id: 'spring', label: 'Spring', checked: true, icon: springIcon },
];

// Highlights (special characteristics)
export const highlightOptions = [
    { id: 'high-margin', label: 'High Margin', checked: true, icon: highMarginIcon },
    { id: 'hot-for-you', label: 'Hot for You', checked: true, icon: hotForYouIcon },
    { id: 'trending', label: 'Trending', checked: true, icon: trendingIcon },
    { id: 'eco-friendly', label: 'Eco-Friendly', checked: true, icon: ecoFriendlyIcon },
];
