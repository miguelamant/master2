import React from 'react';

export default function PriceModal({ item, price, onChange, onClose, onConfirm, labelFor }) {
    if (!item) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h3>Add to Menu</h3>
                <h2><strong>{item.name}</strong></h2>
                <p>Category: <strong>{labelFor(item.category)}</strong></p>

                <div className="modal-buttons">
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={onConfirm}>Confirm</button>
                </div>
            </div>
        </div>
    );
}
