import React, { useMemo } from 'react';
import './AddToMenuModal.css';
import { convertItemLabel } from '../utils/itemLabelMap';

export default function AddToMenuModal({
                                           item,
                                           price,
                                           onChangePrice,
                                           onCancel,
                                           onConfirm,
                                       }) {
    const displayName = useMemo(() => {
        return convertItemLabel(item?.name || item?.item_name || '');
    }, [item]);

    if (!item) return null;

    return (
        <div className="modal-backdrop" onMouseDown={onCancel}>
            <div className="modal-content" onMouseDown={(e) => e.stopPropagation()}>
                <h3>Add to Menu</h3>
                <h2><strong>{displayName}</strong></h2>

                {item.category && (
                    <p>Category: <strong>{item.category}</strong></p>
                )}

                <div className="modal-buttons">
                    <button type="button" onClick={onCancel}>Cancel</button>
                    <button
                        type="button"
                        onClick={onConfirm}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
