import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../apiService';

const AssortmentContext = createContext(null);

export function AssortmentProvider({ children }) {
  const [assortments, setAssortments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeAssortmentId, setActiveAssortmentIdRaw] = useState(() => {
    try {
      const v = sessionStorage.getItem('activeAssortmentId');
      return v ? Number(v) : null;
    } catch { return null; }
  });

  useEffect(() => {
    let alive = true;
    api.get('/api/assortments')
      .then(({ data }) => {
        if (!alive || !Array.isArray(data) || !data.length) { if (alive) setLoaded(true); return; }
        setAssortments(data);
        setActiveAssortmentIdRaw(prev => {
          // keep stored value if it's still valid
          if (prev && data.some(a => a.id === prev)) return prev;
          return data[0].id;
        });
        setLoaded(true);
      })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);

  function setActiveAssortmentId(id) {
    setActiveAssortmentIdRaw(id);
    try { sessionStorage.setItem('activeAssortmentId', String(id)); } catch {}
  }

  const activeAssortment = assortments.find(a => a.id === activeAssortmentId) ?? assortments[0] ?? null;

  return (
    <AssortmentContext.Provider value={{ assortments, loaded, activeAssortmentId, setActiveAssortmentId, activeAssortment }}>
      {children}
    </AssortmentContext.Provider>
  );
}

export function useAssortment() {
  return useContext(AssortmentContext);
}
