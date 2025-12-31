import React, { useMemo } from 'react';
import './AddToMenuModal.css';
import { convertItemLabel } from '../utils/itemLabelMap';

export default function RemoveFromMenuModal({ item, onCancel, onConfirm }) {
    const displayName = useMemo(() => {
        return convertItemLabel(item?.name || item?.item_name || '');
    }, [item]);

    if (!item) return null;

    return (
        <div className="modal-backdrop" onMouseDown={onCancel}>
            <div className="modal-content" onMouseDown={(e) => e.stopPropagation()}>
                <h3>Remove from Menu</h3>
                <h2><strong>{displayName}</strong></h2>

                <div className="remove-confirm">
                    <p>Are you sure you want to remove this item from your menu?</p>
                    <p className="warning">This action cannot be undone.</p>
                </div>

                <div className="modal-buttons">
                    <button type="button" onClick={onCancel}>Cancel</button>
                    <button type="button" className="danger" onClick={onConfirm}>
                        Yes, remove
                    </button>
                </div>
            </div>
        </div>
    );
}
