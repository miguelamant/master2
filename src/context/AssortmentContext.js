import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../apiService';

const AssortmentContext = createContext(null);

export function AssortmentProvider({ children }) {
  const [assortments, setAssortments] = useState([]);
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
        if (!alive || !data?.length) return;
        setAssortments(data);
        setActiveAssortmentIdRaw(prev => {
          // keep stored value if it's still valid
          if (prev && data.some(a => a.id === prev)) return prev;
          return data[0].id;
        });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  function setActiveAssortmentId(id) {
    setActiveAssortmentIdRaw(id);
    try { sessionStorage.setItem('activeAssortmentId', String(id)); } catch {}
  }

  const activeAssortment = assortments.find(a => a.id === activeAssortmentId) ?? assortments[0] ?? null;

  return (
    <AssortmentContext.Provider value={{ assortments, activeAssortmentId, setActiveAssortmentId, activeAssortment }}>
      {children}
    </AssortmentContext.Provider>
  );
}

export function useAssortment() {
  return useContext(AssortmentContext);
}
