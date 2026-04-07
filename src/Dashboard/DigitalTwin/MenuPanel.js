import React from 'react';
import MenuItemCard from './MenuItemCard';

const MenuPanel = ({ items, columns, showEuro, decimalSep, pageIndex, style }) => {
  // Group items by category
  const groups = {};
  for (const item of items) {
    const cat = item.category || 'Other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }

  const categoryNames = Object.keys(groups).sort();

  return (
    <div className="twin-panel" data-page={pageIndex + 1} style={style}>
      <div
        className="twin-panel__content"
        style={{ columnCount: columns, columnGap: '1.5rem' }}
      >
        {categoryNames.map(cat => (
          <div key={cat} className="twin-panel__section">
            <h3 className="twin-panel__cat">{cat.replace(/_/g, ' ')}</h3>
            {groups[cat].map(item => (
              <MenuItemCard
                key={item.id_menu_item}
                item={item}
                showEuro={showEuro}
                decimalSep={decimalSep}
              />
            ))}
          </div>
        ))}
        {items.length === 0 && (
          <p className="twin-panel__empty">
            Page {pageIndex + 1} &mdash; drag items here
          </p>
        )}
      </div>
    </div>
  );
};

export default MenuPanel;
