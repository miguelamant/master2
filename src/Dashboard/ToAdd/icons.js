// Keep this lean—only what ToAdd actually uses.

import softdrinksIcon from '../Icons/softdrinks.svg';
import softdrinksMissing from '../Icons/softdrinks_missing.svg';
import softdrinksExtra from '../Icons/softdrinks_extra.svg';


import summerIcon from '../Icons/summer.svg';
import winterIcon from '../Icons/winter.svg';
import autumnIcon from '../Icons/autumn.svg';
import springIcon from '../Icons/spring.svg';

// Categories → base icon
export const categoryIconMap = {
    'Bitter Beers': softdrinksIcon,
    'White Beers': softdrinksIcon,
    'Ciders': softdrinksIcon,
    'Sour Beers': softdrinksIcon,
    'Other': softdrinksIcon,
    'Stout Porter': softdrinksIcon,
};

// Categories → “missing” icon
export const missingIconMap = {
    'Traditional Strong Blond': softdrinksMissing,
    'Lager': softdrinksMissing,
    'Sour Beers': softdrinksMissing,
    'Bitter Beers': softdrinksMissing,
    'White Beers': softdrinksMissing,
    'Ciders': softdrinksMissing,
    'Fruit Beers': softdrinksMissing,
    'Brown Beers': softdrinksMissing,
    'Blond Amber': softdrinksMissing,
    'Other': softdrinksMissing,
    'Stout Porter': softdrinksMissing,
    'Smoothie Sour': softdrinksMissing,
};

// Categories → “extra” icon
export const extraIconMap = {
    'Traditional Strong Blond': softdrinksExtra,
    'Lager': softdrinksExtra,
    'Sour Beers': softdrinksExtra,
    'Bitter Beers': softdrinksExtra,
    'White Beers': softdrinksExtra,
    'Ciders': softdrinksExtra,
    'Fruit Beers': softdrinksExtra,
    'Brown Beers': softdrinksExtra,
    'Blond Amber': softdrinksExtra,
    'Other': softdrinksExtra,
    'Stout Porter': softdrinksExtra,
    'Smoothie Sour': softdrinksExtra,
};

// Season → icon
export const seasonIconMap = {
    Summer: summerIcon,
    Winter: winterIcon,
    Autumn: autumnIcon,
    Spring: springIcon,
};

// If you still want an array of identical icon-sets (for presets)
export const ICON_SETS = [
    { category: categoryIconMap, missing: missingIconMap, extra: extraIconMap },
    { category: categoryIconMap, missing: missingIconMap, extra: extraIconMap },
    { category: categoryIconMap, missing: missingIconMap, extra: extraIconMap },
];
