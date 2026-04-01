import React from 'react';

const formatPrice = (price, showEuro, decimalSep) => {
  if (price == null) return '';
  const num = Number(price).toFixed(2);
  const formatted = decimalSep === 'comma' ? num.replace('.', ',') : num;
  return showEuro ? `\u20AC ${formatted}` : formatted;
};

const MenuItemCard = ({ item, showEuro = true, decimalSep = 'comma' }) => {
  const { item_name, description, abv, price, volumes_prices } = item;
  const hasVolumes = Array.isArray(volumes_prices) && volumes_prices.length > 0;

  return (
    <div className="twin-item">
      <div className="twin-item__header">
        <span className="twin-item__name">{item_name}</span>
        {abv > 0 && <span className="twin-item__abv">{abv}%</span>}
        {!hasVolumes && price != null && (
          <span className="twin-item__price">
            {formatPrice(price, showEuro, decimalSep)}
          </span>
        )}
      </div>
      {description && (
        <p className="twin-item__desc">{description}</p>
      )}
      {hasVolumes && (
        <div className="twin-item__volumes">
          {volumes_prices.map((vp, i) => (
            <span key={i} className="twin-item__vol">
              {vp.volume} &mdash; {formatPrice(vp.price, showEuro, decimalSep)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuItemCard;
