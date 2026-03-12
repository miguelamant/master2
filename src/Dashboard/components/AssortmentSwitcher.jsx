import React from 'react';
import { useAssortment } from '../../context/AssortmentContext';

export default function AssortmentSwitcher() {
    const ctx = useAssortment();
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const dropRef = React.useRef(null);

    React.useEffect(() => {
        if (!open) return;
        function onClickOutside(e) {
            if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [open]);

    if (!ctx || ctx.assortments.length <= 1) return null;

    const { assortments, activeAssortmentId, setActiveAssortmentId, activeAssortment } = ctx;
    const idx = assortments.findIndex(a => a.id === activeAssortmentId);

    const goPrev = (e) => {
        e.stopPropagation();
        if (idx > 0) setActiveAssortmentId(assortments[idx - 1].id);
    };
    const goNext = (e) => {
        e.stopPropagation();
        if (idx < assortments.length - 1) setActiveAssortmentId(assortments[idx + 1].id);
    };

    const filtered = assortments.filter(a =>
        !search || (a.name || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, position: 'relative' }} ref={dropRef}>
            <button
                onClick={goPrev}
                disabled={idx <= 0}
                style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: idx <= 0 ? 'default' : 'pointer', opacity: idx <= 0 ? 0.4 : 1, flexShrink: 0 }}
            >&#8249;</button>

            <span
                onClick={() => setOpen(o => !o)}
                style={{ cursor: 'pointer', fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}
                title={activeAssortment?.name || ''}
            >
                {activeAssortment?.name || '—'}
            </span>

            <button
                onClick={goNext}
                disabled={idx >= assortments.length - 1}
                style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid #e5e7eb', background: '#fff', cursor: idx >= assortments.length - 1 ? 'default' : 'pointer', opacity: idx >= assortments.length - 1 ? 0.4 : 1, flexShrink: 0 }}
            >&#8250;</button>

            <button
                onClick={() => setOpen(o => !o)}
                style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', flexShrink: 0, fontSize: 10 }}
            >&#9660;</button>

            {open && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, zIndex: 999,
                    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 220, maxHeight: 300, overflowY: 'auto',
                    marginTop: 4,
                }}>
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0' }}>
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search store..."
                            style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 4, padding: '4px 8px', fontSize: 13, boxSizing: 'border-box' }}
                        />
                    </div>
                    {filtered.map(a => (
                        <div
                            key={a.id}
                            onClick={() => { setActiveAssortmentId(a.id); setOpen(false); setSearch(''); }}
                            style={{
                                padding: '8px 12px', cursor: 'pointer', fontSize: 13,
                                background: a.id === activeAssortmentId ? '#f0f7ff' : 'transparent',
                                fontWeight: a.id === activeAssortmentId ? 600 : 400,
                            }}
                        >
                            {a.name || `Assortment ${a.id}`}
                            {a.id === activeAssortmentId && ' ✓'}
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div style={{ padding: '8px 12px', color: '#999', fontSize: 13 }}>No results</div>
                    )}
                </div>
            )}
        </div>
    );
}
