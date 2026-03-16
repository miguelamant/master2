import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../apiService';

const AssortmentContext = createContext(null);

export function AssortmentProvider({ children }) {
  const [assortments, setAssortments] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const [activeAssortmentId, setActiveAssortmentIdRaw] = useState(() => {
    try {
      const v = sessionStorage.getItem('activeAssortmentId');
      return v ? Number(v) : null;
    } catch { return null; }
  });

  useEffect(() => {
    let alive = true;
    setLoaded(false);
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
  }, [fetchKey]);

  /** Call after login to re-fetch assortments for the new user */
  const refresh = useCallback(() => {
    try { sessionStorage.removeItem('activeAssortmentId'); } catch {}
    setActiveAssortmentIdRaw(null);
    setFetchKey(k => k + 1);
  }, []);

  function setActiveAssortmentId(id) {
    setActiveAssortmentIdRaw(id);
    try { sessionStorage.setItem('activeAssortmentId', String(id)); } catch {}
  }

  const activeAssortment = assortments.find(a => a.id === activeAssortmentId) ?? assortments[0] ?? null;

  return (
    <AssortmentContext.Provider value={{ assortments, loaded, activeAssortmentId, setActiveAssortmentId, activeAssortment, refresh }}>
      {children}
    </AssortmentContext.Provider>
  );
}

export function useAssortment() {
  return useContext(AssortmentContext);
}
